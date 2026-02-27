import argparse
import json
import re
from pathlib import Path
from typing import Dict, List

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


MALE_TO_FEMALE = {
    "john": "jane",
    "michael": "maya",
    "david": "dina",
    "robert": "riya",
    "daniel": "sophia",
    "kevin": "aisha",
    "jason": "elena",
    " he ": " she ",
    " his ": " her ",
    " him ": " her ",
}


def load_jsonl(path: Path) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def clamp(value: float, low: float = 0.0, high: float = 10.0) -> float:
    return max(low, min(high, value))


def logits_to_scores(logits: torch.Tensor) -> torch.Tensor:
    if logits.ndim == 1:
        return logits
    if logits.size(-1) == 1:
        return logits.squeeze(-1)
    classes = torch.arange(logits.size(-1), device=logits.device, dtype=torch.float32)
    probs = torch.softmax(logits, dim=-1)
    return torch.sum(probs * classes, dim=-1)


def swap_demographics(text: str) -> str:
    out = " {} ".format(text.lower())
    for left, right in MALE_TO_FEMALE.items():
        out = out.replace(left, right)
    return re.sub(r"\s+", " ", out).strip()


def predict_scores(
    rows: List[Dict[str, object]],
    score_model_dir: Path,
    resume_override: Dict[str, str] = None,
    batch_size: int = 16,
) -> List[float]:
    tokenizer = AutoTokenizer.from_pretrained(str(score_model_dir))
    model = AutoModelForSequenceClassification.from_pretrained(str(score_model_dir))
    model.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    outputs: List[float] = []
    resume_override = resume_override or {}
    for idx in range(0, len(rows), batch_size):
        chunk = rows[idx : idx + batch_size]
        resumes = [
            resume_override.get(str(row["id"]), str(row["resume_text"]))
            for row in chunk
        ]
        encoded = tokenizer(
            [row["job_description"] for row in chunk],
            resumes,
            truncation=True,
            padding=True,
            max_length=256,
            return_tensors="pt",
        )
        encoded = {key: value.to(device) for key, value in encoded.items()}
        with torch.no_grad():
            logits = model(**encoded).logits
            scores = logits_to_scores(logits).detach().cpu().numpy().tolist()
        outputs.extend([round(clamp(float(x)), 4) for x in scores])
    return outputs


def main() -> None:
    parser = argparse.ArgumentParser(description="Bias audit using counterfactual demographic swaps.")
    parser.add_argument("--test-file", type=Path, default=Path("ml_pipeline/data/test.jsonl"))
    parser.add_argument("--score-model-dir", type=Path, default=Path("ml_pipeline/artifacts/score_model"))
    parser.add_argument("--report-dir", type=Path, default=Path("ml_pipeline/reports"))
    parser.add_argument("--selection-threshold", type=float, default=7.0)
    parser.add_argument("--alert-delta", type=float, default=0.5)
    args = parser.parse_args()

    rows = load_jsonl(args.test_file)
    args.report_dir.mkdir(parents=True, exist_ok=True)

    original_scores = predict_scores(rows, args.score_model_dir)
    swapped_resume = {str(row["id"]): swap_demographics(str(row["resume_text"])) for row in rows}
    swapped_scores = predict_scores(rows, args.score_model_dir, resume_override=swapped_resume)

    deltas = [abs(a - b) for a, b in zip(original_scores, swapped_scores)]
    flagged = [delta for delta in deltas if delta > args.alert_delta]

    male_scores = []
    female_scores = []
    for row, score in zip(rows, original_scores):
        gender = str(row.get("demographic", {}).get("gender", "unknown")).lower()
        if gender == "male":
            male_scores.append(score)
        elif gender == "female":
            female_scores.append(score)

    male_rate = (
        float(np.mean([value >= args.selection_threshold for value in male_scores]))
        if male_scores
        else 0.0
    )
    female_rate = (
        float(np.mean([value >= args.selection_threshold for value in female_scores]))
        if female_scores
        else 0.0
    )
    dpd = abs(male_rate - female_rate)

    report = {
        "num_samples": len(rows),
        "mean_abs_counterfactual_delta": round(float(np.mean(deltas) if deltas else 0.0), 6),
        "max_abs_counterfactual_delta": round(float(np.max(deltas) if deltas else 0.0), 6),
        "alert_delta": args.alert_delta,
        "flagged_count": len(flagged),
        "flagged_ratio": round(float(len(flagged) / len(deltas)) if deltas else 0.0, 6),
        "selection_threshold": args.selection_threshold,
        "male_selection_rate": round(male_rate, 6),
        "female_selection_rate": round(female_rate, 6),
        "demographic_parity_difference": round(dpd, 6),
    }

    out_file = args.report_dir / "bias_audit_report.json"
    out_file.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
