from pathlib import Path

from ml_pipeline.scripts.generate_synthetic_dataset import generate_dataset, split_by_job, write_jsonl


def test_generate_dataset_has_required_fields():
    rows = generate_dataset(num_jobs=4, candidates_per_job=3)
    assert len(rows) == 12

    sample = rows[0]
    required = {
        "id",
        "job_id",
        "candidate_id",
        "job_description",
        "resume_text",
        "fit_score",
        "skills",
        "skill_spans",
        "overclaim_flags",
        "demographic",
    }
    assert required.issubset(set(sample.keys()))
    assert 0.0 <= float(sample["fit_score"]) <= 10.0
    assert isinstance(sample["skill_spans"], list)


def test_split_and_write_jsonl(tmp_path: Path):
    rows = generate_dataset(num_jobs=6, candidates_per_job=2)
    split = split_by_job(rows)

    assert split["train"]
    assert split["val"]
    assert split["test"]

    train_path = tmp_path / "train.jsonl"
    write_jsonl(train_path, split["train"])
    content = train_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(content) == len(split["train"])

