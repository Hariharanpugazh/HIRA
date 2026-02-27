import argparse
import subprocess
import sys
from pathlib import Path


def run_step(command, workdir: Path) -> None:
    print("RUN:", " ".join(command))
    result = subprocess.run(command, cwd=str(workdir))
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run full Day-2 pipeline end-to-end.")
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--num-jobs", type=int, default=24)
    parser.add_argument("--candidates-per-job", type=int, default=8)
    parser.add_argument("--epochs", type=int, default=1)
    args = parser.parse_args()

    root = args.root.resolve()
    scripts = root / "ml_pipeline" / "scripts"
    data_dir = root / "ml_pipeline" / "data"

    run_step(
        [
            sys.executable,
            str(scripts / "generate_synthetic_dataset.py"),
            "--output-dir",
            str(data_dir),
            "--num-jobs",
            str(args.num_jobs),
            "--candidates-per-job",
            str(args.candidates_per_job),
        ],
        root,
    )

    run_step(
        [
            sys.executable,
            str(scripts / "train_score_model.py"),
            "--train-file",
            str(data_dir / "train.jsonl"),
            "--val-file",
            str(data_dir / "val.jsonl"),
            "--epochs",
            str(args.epochs),
        ],
        root,
    )

    run_step(
        [
            sys.executable,
            str(scripts / "train_skill_model.py"),
            "--train-file",
            str(data_dir / "train.jsonl"),
            "--val-file",
            str(data_dir / "val.jsonl"),
            "--epochs",
            str(args.epochs),
        ],
        root,
    )

    run_step(
        [
            sys.executable,
            str(scripts / "evaluate_models.py"),
            "--test-file",
            str(data_dir / "test.jsonl"),
        ],
        root,
    )

    run_step(
        [
            sys.executable,
            str(scripts / "run_bias_audit.py"),
            "--test-file",
            str(data_dir / "test.jsonl"),
        ],
        root,
    )

    print("DAY2_PIPELINE_COMPLETE")


if __name__ == "__main__":
    main()

