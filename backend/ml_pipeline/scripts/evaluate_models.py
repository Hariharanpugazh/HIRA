import argparse
import json
import math
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from scipy.stats import spearmanr
from sklearn.metrics import mean_absolute_error, ndcg_score
from transformers import (
    AutoModel,
    AutoModelForSequenceClassification,
    AutoModelForTokenClassification,
    AutoTokenizer,
    pipeline,
)


SCORE_RE = re.compile(r"-?\d+(?:\.\d+)?")
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


def batch_predict_score(
    rows: List[Dict[str, object]],
    model_dir: Path,
    batch_size: int = 16,
) -> List[float]:
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
    model.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    scores: List[float] = []
    for idx in range(0, len(rows), batch_size):
        chunk = rows[idx : idx + batch_size]
        encoded = tokenizer(
            [r["job_description"] for r in chunk],
            [r["resume_text"] for r in chunk],
            truncation=True,
            padding=True,
            max_length=256,
            return_tensors="pt",
        )
        encoded = {key: value.to(device) for key, value in encoded.items()}
        with torch.no_grad():
            logits = model(**encoded).logits
            batch_scores = logits_to_scores(logits).detach().cpu().numpy().tolist()
        for value in batch_scores:
            scores.append(round(clamp(float(value)), 4))
    return scores


def _mean_pooling(last_hidden_state: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    mask = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
    summed = torch.sum(last_hidden_state * mask, dim=1)
    counts = torch.clamp(mask.sum(dim=1), min=1e-9)
    return summed / counts


def _encode_texts(texts: List[str], model_name: str, batch_size: int = 32) -> torch.Tensor:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    vectors: List[torch.Tensor] = []
    for idx in range(0, len(texts), batch_size):
        chunk = texts[idx : idx + batch_size]
        encoded = tokenizer(
            chunk,
            truncation=True,
            padding=True,
            max_length=256,
            return_tensors="pt",
        )
        encoded = {key: value.to(device) for key, value in encoded.items()}
        with torch.no_grad():
            outputs = model(**encoded)
        pooled = _mean_pooling(outputs.last_hidden_state, encoded["attention_mask"])
        pooled = F.normalize(pooled, p=2, dim=1)
        vectors.append(pooled.detach().cpu())

    return torch.cat(vectors, dim=0) if vectors else torch.zeros((0, 1))


def embedding_baseline(rows: List[Dict[str, object]], model_name: str) -> List[float]:
    jd_vectors = _encode_texts([str(r["job_description"]) for r in rows], model_name)
    resume_vectors = _encode_texts([str(r["resume_text"]) for r in rows], model_name)
    sims = torch.sum(jd_vectors * resume_vectors, dim=1)
    return [round(clamp(float((sim.item() + 1.0) * 5.0)), 4) for sim in sims]


def lexical_overlap_baseline(rows: List[Dict[str, object]]) -> List[float]:
    values: List[float] = []
    for row in rows:
        jd_tokens = set(re.findall(r"[a-z0-9\.\+#-]+", str(row["job_description"]).lower()))
        resume_tokens = set(re.findall(r"[a-z0-9\.\+#-]+", str(row["resume_text"]).lower()))
        overlap = len(jd_tokens & resume_tokens) / float(max(len(jd_tokens), 1))
        values.append(round(clamp(overlap * 10.0), 4))
    return values


def zero_shot_baseline(rows: List[Dict[str, object]], model_name: str) -> List[float]:
    generator = pipeline(
        "text2text-generation",
        model=model_name,
        tokenizer=model_name,
        device=-1,
    )
    outputs: List[float] = []
    prompts = []
    for row in rows:
        prompt = (
            "You are a strict recruiter. Return only one number from 0 to 10.\n"
            "Job Description:\n{}\n\nResume:\n{}\n\nScore:"
        ).format(row["job_description"], row["resume_text"])
        prompts.append(prompt)

    for idx in range(0, len(prompts), 8):
        chunk_prompts = prompts[idx : idx + 8]
        generated_rows = generator(chunk_prompts, max_new_tokens=8, do_sample=False)
        for generated in generated_rows:
            text = generated["generated_text"] if isinstance(generated, dict) else str(generated)
            match = SCORE_RE.search(text)
            if not match:
                outputs.append(5.0)
            else:
                outputs.append(round(clamp(float(match.group(0))), 4))
    return outputs


def _extract_skills_from_labels(
    text: str,
    offsets: List[Tuple[int, int]],
    labels: List[int],
    id2label: Dict[int, str],
) -> List[str]:
    spans: List[str] = []
    current_start = None
    current_end = None

    for (start, end), label_id in zip(offsets, labels):
        if start == end:
            continue
        label = id2label[int(label_id)]
        if label == "B-SKILL":
            if current_start is not None and current_end is not None:
                spans.append(text[current_start:current_end])
            current_start, current_end = start, end
        elif label == "I-SKILL" and current_start is not None:
            current_end = end
        else:
            if current_start is not None and current_end is not None:
                spans.append(text[current_start:current_end])
            current_start, current_end = None, None

    if current_start is not None and current_end is not None:
        spans.append(text[current_start:current_end])

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


def evaluate_skill_extraction(
    rows: List[Dict[str, object]],
    model_dir: Path,
) -> Dict[str, float]:
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    model = AutoModelForTokenClassification.from_pretrained(str(model_dir))
    model.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    tp = 0
    fp = 0
    fn = 0
    exact = 0
    for row in rows:
        encoded = tokenizer(
            row["resume_text"],
            return_offsets_mapping=True,
            truncation=True,
            padding=False,
            max_length=256,
            return_tensors="pt",
        )
        offsets = encoded["offset_mapping"][0].cpu().tolist()
        inputs = {k: v.to(device) for k, v in encoded.items() if k != "offset_mapping"}
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        preds = torch.argmax(logits, dim=-1).cpu().tolist()

        pred_skills = set(
            _extract_skills_from_labels(
                text=row["resume_text"],
                offsets=[(int(x[0]), int(x[1])) for x in offsets],
                labels=preds,
                id2label={int(k): v for k, v in model.config.id2label.items()},
            )
        )
        true_skills = set([str(s).lower() for s in row.get("skills", [])])

        tp += len(pred_skills & true_skills)
        fp += len(pred_skills - true_skills)
        fn += len(true_skills - pred_skills)
        if pred_skills == true_skills:
            exact += 1

    precision = tp / float(max(tp + fp, 1))
    recall = tp / float(max(tp + fn, 1))
    if precision + recall == 0:
        f1 = 0.0
    else:
        f1 = 2 * precision * recall / (precision + recall)
    accuracy = exact / float(max(len(rows), 1))
    return {
        "skill_precision": round(precision, 6),
        "skill_recall": round(recall, 6),
        "skill_f1": round(f1, 6),
        "skill_exact_match_accuracy": round(accuracy, 6),
    }


def ranking_metrics(rows: List[Dict[str, object]], preds: List[float]) -> Dict[str, float]:
    true_scores = np.array([float(row["fit_score"]) for row in rows], dtype=np.float32)
    pred_scores = np.array(preds, dtype=np.float32)

    mae = mean_absolute_error(true_scores, pred_scores)

    by_job_true: Dict[str, List[float]] = defaultdict(list)
    by_job_pred: Dict[str, List[float]] = defaultdict(list)
    for row, pred in zip(rows, preds):
        job_id = str(row["job_id"])
        by_job_true[job_id].append(float(row["fit_score"]))
        by_job_pred[job_id].append(float(pred))

    spearman_values = []
    ndcg_values = []
    for job_id in sorted(by_job_true):
        y_true = np.array(by_job_true[job_id], dtype=np.float32)
        y_pred = np.array(by_job_pred[job_id], dtype=np.float32)
        if len(y_true) >= 2 and np.std(y_true) > 0 and np.std(y_pred) > 0:
            corr = spearmanr(y_true, y_pred).correlation
            if corr is not None and not math.isnan(corr):
                spearman_values.append(float(corr))
        ndcg_values.append(float(ndcg_score(y_true.reshape(1, -1), y_pred.reshape(1, -1), k=min(10, len(y_true)))))

    return {
        "mae": round(float(mae), 6),
        "ranking_spearman_mean": round(float(np.mean(spearman_values) if spearman_values else 0.0), 6),
        "ranking_ndcg_at_10_mean": round(float(np.mean(ndcg_values) if ndcg_values else 0.0), 6),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate fine-tuned model against embedding/zero-shot baselines.")
    parser.add_argument("--test-file", type=Path, default=Path("ml_pipeline/data/test.jsonl"))
    parser.add_argument("--score-model-dir", type=Path, default=Path("ml_pipeline/artifacts/score_model"))
    parser.add_argument("--skill-model-dir", type=Path, default=Path("ml_pipeline/artifacts/skill_model"))
    parser.add_argument("--report-dir", type=Path, default=Path("ml_pipeline/reports"))
    parser.add_argument("--embedding-model", type=str, default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--zero-shot-model", type=str, default="google/flan-t5-small")
    args = parser.parse_args()

    args.report_dir.mkdir(parents=True, exist_ok=True)
    rows = load_jsonl(args.test_file)

    fine_tuned_scores = batch_predict_score(rows, args.score_model_dir)
    embedding_scores = embedding_baseline(rows, args.embedding_model)

    zero_shot_fallback = False
    try:
        zero_shot_scores = zero_shot_baseline(rows, args.zero_shot_model)
    except Exception as exc:
        zero_shot_fallback = True
        print("WARN: zero-shot baseline failed, using lexical fallback: {}".format(exc))
        zero_shot_scores = lexical_overlap_baseline(rows)

    fine_tuned_metrics = ranking_metrics(rows, fine_tuned_scores)
    embedding_metrics = ranking_metrics(rows, embedding_scores)
    zero_shot_metrics = ranking_metrics(rows, zero_shot_scores)

    skill_metrics = evaluate_skill_extraction(rows, args.skill_model_dir)

    report = {
        "dataset_size": len(rows),
        "models": {
            "fine_tuned": fine_tuned_metrics,
            "embedding_baseline": embedding_metrics,
            "zero_shot_llm": zero_shot_metrics,
        },
        "skill_extraction": skill_metrics,
        "metadata": {
            "embedding_model": args.embedding_model,
            "zero_shot_model": args.zero_shot_model,
            "zero_shot_fallback_used": zero_shot_fallback,
        },
    }

    report_path = args.report_dir / "evaluation_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    markdown_lines = [
        "# Evaluation Report",
        "",
        "## Candidate Scoring and Ranking",
        "",
        "| Model | MAE | Spearman (mean) | NDCG@10 (mean) |",
        "|---|---:|---:|---:|",
        "| Fine-tuned | {mae} | {sp} | {ndcg} |".format(
            mae=fine_tuned_metrics["mae"],
            sp=fine_tuned_metrics["ranking_spearman_mean"],
            ndcg=fine_tuned_metrics["ranking_ndcg_at_10_mean"],
        ),
        "| Embedding baseline | {mae} | {sp} | {ndcg} |".format(
            mae=embedding_metrics["mae"],
            sp=embedding_metrics["ranking_spearman_mean"],
            ndcg=embedding_metrics["ranking_ndcg_at_10_mean"],
        ),
        "| Zero-shot LLM | {mae} | {sp} | {ndcg} |".format(
            mae=zero_shot_metrics["mae"],
            sp=zero_shot_metrics["ranking_spearman_mean"],
            ndcg=zero_shot_metrics["ranking_ndcg_at_10_mean"],
        ),
        "",
        "## Skill Extraction",
        "",
        "| Metric | Value |",
        "|---|---:|",
        "| Precision | {} |".format(skill_metrics["skill_precision"]),
        "| Recall | {} |".format(skill_metrics["skill_recall"]),
        "| F1 | {} |".format(skill_metrics["skill_f1"]),
        "| Exact-match accuracy | {} |".format(skill_metrics["skill_exact_match_accuracy"]),
        "",
        "Zero-shot fallback used: {}".format(str(zero_shot_fallback)),
    ]
    (args.report_dir / "evaluation_report.md").write_text("\n".join(markdown_lines), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
