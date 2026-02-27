# Day-2 ML Pipeline: Recruiter's Brain

This pipeline implements all Day-2 requirements locally:

- Labeled dataset (`resume`, `job description`, `fit_score: 0-10`)
- Transformer fine-tuning for:
  - score prediction (ordinal 0-10)
  - skill extraction
- Candidate ranking evaluation
- Baseline comparisons:
  - embedding similarity
  - zero-shot LLM
- Bias analysis (counterfactual demographic swap)
- Lightweight inference demo script

## Install ML Dependencies

```powershell
.\.venv\Scripts\python -m pip install -r requirements-ml.txt
```

## Run Full End-to-End Pipeline

```powershell
.\.venv\Scripts\python ml_pipeline\scripts\run_day2_pipeline.py --num-jobs 120 --candidates-per-job 8 --epochs 4
```

Outputs:

- Dataset:
  - `ml_pipeline/data/train.jsonl`
  - `ml_pipeline/data/val.jsonl`
  - `ml_pipeline/data/test.jsonl`
- Fine-tuned models:
  - `ml_pipeline/artifacts/score_model/`
  - `ml_pipeline/artifacts/skill_model/`
- Evaluation report:
  - `ml_pipeline/reports/evaluation_report.json`
  - `ml_pipeline/reports/evaluation_report.md`
- Bias audit:
  - `ml_pipeline/reports/bias_audit_report.json`

## Production Data (No Sample Mode)

For production, provide real labeled files and skip synthetic generation:

- `train.jsonl`
- `val.jsonl`
- `test.jsonl`

Required fields per row:

- `job_description`
- `resume_text`
- `fit_score` (0-10)
- `skills` (for skill extraction labels)
- `skill_spans` (character spans for token labeling)

Run training/evaluation on your real files:

```powershell
.\.venv\Scripts\python ml_pipeline\scripts\train_score_model.py --train-file <train.jsonl> --val-file <val.jsonl> --epochs 4
.\.venv\Scripts\python ml_pipeline\scripts\train_skill_model.py --train-file <train.jsonl> --val-file <val.jsonl> --epochs 4
.\.venv\Scripts\python ml_pipeline\scripts\evaluate_models.py --test-file <test.jsonl>
.\.venv\Scripts\python ml_pipeline\scripts\run_bias_audit.py --test-file <test.jsonl>
```

## Lightweight Inference Demo

Prepare:

1. A job description text file.
2. One or more resume text files.

Run:

```powershell
.\.venv\Scripts\python ml_pipeline\scripts\demo_inference.py `
  --job-file .\ml_pipeline\data\demo_job.txt `
  --resume-files .\ml_pipeline\data\demo_resume_1.txt .\ml_pipeline\data\demo_resume_2.txt
```

Output:

- `ml_pipeline/reports/demo_inference.json`
