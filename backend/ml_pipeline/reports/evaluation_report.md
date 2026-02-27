# Evaluation Report

## Candidate Scoring and Ranking

| Model | MAE | Spearman (mean) | NDCG@10 (mean) |
|---|---:|---:|---:|
| Fine-tuned | 0.776787 | 0.745193 | 0.988721 |
| Embedding baseline | 1.641831 | 0.228395 | 0.94837 |
| Zero-shot LLM | 8.041945 | 0.0 | 0.936879 |

## Skill Extraction

| Metric | Value |
|---|---:|
| Precision | 0.932548 |
| Recall | 0.902591 |
| F1 | 0.917325 |
| Exact-match accuracy | 0.5 |

Zero-shot fallback used: False