import argparse
import json
import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


KNOWN_SKILLS = [
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
]

ROLE_TEMPLATES = [
    "Backend Engineer",
    "Machine Learning Engineer",
    "MLOps Engineer",
    "Platform Engineer",
    "Data Engineer",
    "Full Stack Engineer",
]

MALE_NAMES = ["John", "Michael", "David", "Robert", "Daniel", "Kevin", "Jason"]
FEMALE_NAMES = ["Jane", "Maya", "Dina", "Riya", "Elena", "Sophia", "Aisha"]

JD_TEMPLATE = (
    "We are hiring a {role}. Required skills: {skills}. "
    "Candidates should have at least {years}+ years of relevant experience, strong delivery ownership, "
    "and measurable project impact."
)

PROJECT_TEMPLATES = [
    "Built {skill} services that reduced latency by {metric}%.",
    "Led migration to {skill} and improved deployment frequency by {metric}%.",
    "Implemented observability for {skill} workloads and cut incidents by {metric}%.",
]


@dataclass
class JobRecord:
    job_id: str
    role: str
    required_skills: List[str]
    required_years: int
    job_description: str


def clamp(value: float, low: float = 0.0, high: float = 10.0) -> float:
    return max(low, min(high, value))


def find_skill_spans(text: str, skills: List[str]) -> List[Dict[str, object]]:
    spans: List[Dict[str, object]] = []
    lower = text.lower()
    for skill in sorted(set(skills), key=len, reverse=True):
        pattern = re.escape(skill.lower())
        for match in re.finditer(pattern, lower):
            spans.append(
                {
                    "start": int(match.start()),
                    "end": int(match.end()),
                    "label": "SKILL",
                    "text": text[match.start() : match.end()],
                }
            )
    spans.sort(key=lambda item: (item["start"], item["end"]))
    return spans


def build_job(job_idx: int) -> JobRecord:
    role = random.choice(ROLE_TEMPLATES)
    required_skills = random.sample(KNOWN_SKILLS, random.randint(4, 7))
    required_years = random.randint(2, 8)
    jd = JD_TEMPLATE.format(role=role, skills=", ".join(required_skills), years=required_years)
    return JobRecord(
        job_id="job-{:04d}".format(job_idx),
        role=role,
        required_skills=required_skills,
        required_years=required_years,
        job_description=jd,
    )


def _quality_tier() -> str:
    pick = random.random()
    if pick < 0.2:
        return "low"
    if pick < 0.6:
        return "mid"
    return "high"


def _experience_for_skill(req_years: int, tier: str) -> int:
    if tier == "high":
        return random.randint(max(1, req_years - 1), req_years + 4)
    if tier == "mid":
        return random.randint(max(1, req_years - 2), req_years + 1)
    return random.randint(0, max(1, req_years - 1))


def _build_resume(job: JobRecord, candidate_id: str) -> Tuple[str, List[str], int, List[str], Dict[str, str]]:
    tier = _quality_tier()
    gender = "male" if random.random() < 0.5 else "female"
    name = random.choice(MALE_NAMES if gender == "male" else FEMALE_NAMES)

    if tier == "high":
        matched_count = random.randint(max(3, len(job.required_skills) - 1), len(job.required_skills))
    elif tier == "mid":
        matched_count = random.randint(max(2, len(job.required_skills) // 2), len(job.required_skills) - 1)
    else:
        matched_count = random.randint(1, max(2, len(job.required_skills) // 2))

    matched = random.sample(job.required_skills, matched_count)
    extras = random.sample(
        [skill for skill in KNOWN_SKILLS if skill not in matched],
        random.randint(1, 4),
    )
    resume_skills = sorted(set(matched + extras))

    skill_lines: List[str] = []
    max_years_seen = 0
    overclaim_flags: List[str] = []
    for skill in resume_skills:
        years = _experience_for_skill(job.required_years, tier)
        if tier == "low" and random.random() < 0.25:
            years = random.randint(job.required_years + 6, job.required_years + 10)
            overclaim_flags.append(
                "Potential over-claim on {}: {} years.".format(skill, years)
            )
        max_years_seen = max(max_years_seen, years)
        skill_lines.append("- {}: {} years".format(skill, years))

    project_lines: List[str] = []
    if tier in ("mid", "high"):
        for _ in range(random.randint(1, 3)):
            project_lines.append(
                random.choice(PROJECT_TEMPLATES).format(
                    skill=random.choice(matched),
                    metric=random.randint(10, 65),
                )
            )
    else:
        project_lines.append("Worked across multiple teams to support delivery initiatives.")

    header = "{} {}. Summary: {} {} engineer.".format(
        name,
        candidate_id,
        "Results-driven" if tier == "high" else "Collaborative",
        job.role,
    )
    body = "\n".join(skill_lines + project_lines)
    resume_text = "{}\n{}".format(header, body)

    demographic = {"name": name, "gender": gender}
    return resume_text, resume_skills, max_years_seen, overclaim_flags, demographic


def _fit_score(
    job: JobRecord,
    resume_skills: List[str],
    max_years_seen: int,
    overclaim_flags: List[str],
    resume_text: str,
) -> float:
    overlap = len(set(job.required_skills) & set(resume_skills)) / float(len(set(job.required_skills)))
    experience_ratio = min(1.3, max_years_seen / float(max(1, job.required_years)))
    metric_bonus = 0.8 if re.search(r"\d+%", resume_text) else 0.0
    overclaim_penalty = min(2.5, 0.8 * len(overclaim_flags))

    raw = (overlap * 6.0) + (experience_ratio * 2.6) + metric_bonus - overclaim_penalty
    noise = random.uniform(-0.4, 0.4)
    return round(clamp(raw + noise), 2)


def generate_dataset(num_jobs: int, candidates_per_job: int) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    for job_idx in range(1, num_jobs + 1):
        job = build_job(job_idx)
        for cand_idx in range(1, candidates_per_job + 1):
            candidate_id = "cand-{:04d}-{:03d}".format(job_idx, cand_idx)
            resume_text, resume_skills, max_years, overclaim_flags, demographic = _build_resume(
                job,
                candidate_id,
            )
            score = _fit_score(job, resume_skills, max_years, overclaim_flags, resume_text)
            rows.append(
                {
                    "id": "{}::{}".format(job.job_id, candidate_id),
                    "job_id": job.job_id,
                    "candidate_id": candidate_id,
                    "job_role": job.role,
                    "job_required_skills": job.required_skills,
                    "job_required_years": job.required_years,
                    "job_description": job.job_description,
                    "resume_text": resume_text,
                    "fit_score": score,
                    "skills": resume_skills,
                    "skill_spans": find_skill_spans(resume_text, resume_skills),
                    "overclaim_flags": overclaim_flags,
                    "demographic": demographic,
                }
            )
    return rows


def split_by_job(rows: List[Dict[str, object]]) -> Dict[str, List[Dict[str, object]]]:
    jobs = sorted({row["job_id"] for row in rows})
    random.shuffle(jobs)
    n = len(jobs)
    train_jobs = set(jobs[: int(0.7 * n)])
    val_jobs = set(jobs[int(0.7 * n) : int(0.85 * n)])
    test_jobs = set(jobs[int(0.85 * n) :])

    split = {"train": [], "val": [], "test": []}
    for row in rows:
        if row["job_id"] in train_jobs:
            split["train"].append(row)
        elif row["job_id"] in val_jobs:
            split["val"].append(row)
        else:
            split["test"].append(row)
    return split


def write_jsonl(path: Path, rows: List[Dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=True) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic resume/JD fit-score dataset.")
    parser.add_argument("--output-dir", type=Path, default=Path("ml_pipeline/data"))
    parser.add_argument("--num-jobs", type=int, default=36)
    parser.add_argument("--candidates-per-job", type=int, default=10)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    rows = generate_dataset(args.num_jobs, args.candidates_per_job)
    split = split_by_job(rows)

    write_jsonl(args.output_dir / "train.jsonl", split["train"])
    write_jsonl(args.output_dir / "val.jsonl", split["val"])
    write_jsonl(args.output_dir / "test.jsonl", split["test"])

    metadata = {
        "seed": args.seed,
        "num_jobs": args.num_jobs,
        "candidates_per_job": args.candidates_per_job,
        "counts": {key: len(value) for key, value in split.items()},
        "skills_vocabulary_size": len(KNOWN_SKILLS),
    }
    (args.output_dir / "dataset_meta.json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()

