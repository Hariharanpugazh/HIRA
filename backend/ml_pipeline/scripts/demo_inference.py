import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoModelForTokenClassification,
    AutoTokenizer,
)


KNOWN_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "go",
    "rust",
    "react",
    "next.js",
    "node.js",
    "fastapi",
    "django",
    "spring",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "terraform",
    "linux",
    "pytorch",
    "tensorflow",
    "scikit-learn",
    "llm",
    "rag",
    "ci/cd",
    "github actions",
}

CLAIM_PATTERN = re.compile(r"(\d{1,2})\s*\+?\s*years?\s+(?:of\s+)?([a-zA-Z0-9\.\+\#\- ]+)", re.IGNORECASE)


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


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore").strip()


def extract_skills_from_labels(
    text: str,
    offsets: List[Tuple[int, int]],
    pred_ids: List[int],
    id2label: Dict[int, str],
) -> List[str]:
    spans: List[str] = []
    cur_start = None
    cur_end = None

    for (start, end), label_id in zip(offsets, pred_ids):
        if start == end:
            continue
        label = id2label[int(label_id)]
        if label == "B-SKILL":
            if cur_start is not None and cur_end is not None:
                spans.append(text[cur_start:cur_end])
            cur_start, cur_end = start, end
        elif label == "I-SKILL" and cur_start is not None:
            cur_end = end
        else:
            if cur_start is not None and cur_end is not None:
                spans.append(text[cur_start:cur_end])
            cur_start, cur_end = None, None

    if cur_start is not None and cur_end is not None:
        spans.append(text[cur_start:cur_end])

    normalized = []
    for span in spans:
        value = span.strip().lower()
        if not value:
            continue
        for skill in KNOWN_SKILLS:
            if skill in value or value in skill:
                normalized.append(skill)
                break
    return sorted(set(normalized))


def detect_overclaiming(text: str) -> List[str]:
    flags = []
    for years_s, skill in CLAIM_PATTERN.findall(text):
        years = int(years_s)
        skill_clean = skill.strip().lower()
        if years >= 8 and skill_clean not in KNOWN_SKILLS:
            flags.append(
                "Possible over-claim: {} years in '{}' without strong skill taxonomy match.".format(
                    years,
                    skill_clean,
                )
            )
    return flags


def main() -> None:
    parser = argparse.ArgumentParser(description="Lightweight inference demo using fine-tuned artifacts.")
    parser.add_argument("--job-file", type=Path, required=True, help="Text file containing job description.")
    parser.add_argument(
        "--resume-files",
        type=Path,
        nargs="+",
        required=True,
        help="One or more resume text files.",
    )
    parser.add_argument("--score-model-dir", type=Path, default=Path("ml_pipeline/artifacts/score_model"))
    parser.add_argument("--skill-model-dir", type=Path, default=Path("ml_pipeline/artifacts/skill_model"))
    parser.add_argument("--output", type=Path, default=Path("ml_pipeline/reports/demo_inference.json"))
    args = parser.parse_args()

    jd_text = read_text_file(args.job_file)
    resumes = [{"name": path.stem, "text": read_text_file(path)} for path in args.resume_files]

    score_tokenizer = AutoTokenizer.from_pretrained(str(args.score_model_dir))
    score_model = AutoModelForSequenceClassification.from_pretrained(str(args.score_model_dir))
    score_model.eval()
    score_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    score_model.to(score_device)

    skill_tokenizer = AutoTokenizer.from_pretrained(str(args.skill_model_dir))
    skill_model = AutoModelForTokenClassification.from_pretrained(str(args.skill_model_dir))
    skill_model.eval()

    outputs: List[Dict[str, object]] = []
    for resume in resumes:
        encoded = score_tokenizer(
            jd_text,
            resume["text"],
            truncation=True,
            padding=True,
            max_length=256,
            return_tensors="pt",
        )
        encoded = {key: value.to(score_device) for key, value in encoded.items()}
        with torch.no_grad():
            logits = score_model(**encoded).logits
            score_tensor = logits_to_scores(logits)
            score = score_tensor.squeeze().item()
        fit_score = round(clamp(float(score)), 4)

        skill_encoded = skill_tokenizer(
            resume["text"],
            truncation=True,
            padding=False,
            max_length=256,
            return_offsets_mapping=True,
            return_tensors="pt",
        )
        offsets = skill_encoded["offset_mapping"][0].cpu().tolist()
        inputs = {k: v for k, v in skill_encoded.items() if k != "offset_mapping"}
        with torch.no_grad():
            logits = skill_model(**inputs).logits[0]
        pred_ids = torch.argmax(logits, dim=-1).cpu().tolist()
        extracted_skills = extract_skills_from_labels(
            text=resume["text"],
            offsets=[(int(x[0]), int(x[1])) for x in offsets],
            pred_ids=pred_ids,
            id2label={int(k): v for k, v in skill_model.config.id2label.items()},
        )

        outputs.append(
            {
                "candidate": resume["name"],
                "fit_score": fit_score,
                "skills": extracted_skills,
                "overclaim_flags": detect_overclaiming(resume["text"]),
            }
        )

    outputs.sort(key=lambda item: float(item["fit_score"]), reverse=True)
    for idx, item in enumerate(outputs, start=1):
        item["rank"] = idx

    result = {"job_description": jd_text, "results": outputs}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
