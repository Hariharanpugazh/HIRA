import re
from dataclasses import dataclass
from typing import Final


KNOWN_SKILLS: Final[set[str]] = {
    "python",
    "java",
    "javascript",
    "typescript",
    "c++",
    "c#",
    "go",
    "rust",
    "react",
    "next.js",
    "node.js",
    "django",
    "fastapi",
    "spring",
    "kubernetes",
    "docker",
    "aws",
    "gcp",
    "azure",
    "terraform",
    "ansible",
    "linux",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "valkey",
    "kafka",
    "rabbitmq",
    "spark",
    "hadoop",
    "pytorch",
    "tensorflow",
    "scikit-learn",
    "llm",
    "rag",
    "nlp",
    "data engineering",
    "machine learning",
    "deep learning",
    "ci/cd",
    "github actions",
    "devops",
}


CLAIM_PATTERN = re.compile(
    r"(?P<years>\d{1,2})\s*\+?\s*years?(?:\s+of)?\s+(?P<skill>[a-zA-Z0-9\+\#\.\- ]{2,40})",
    flags=re.IGNORECASE,
)
YEARS_PATTERN = re.compile(r"(?P<years>\d{1,2})\s*\+?\s*years?", flags=re.IGNORECASE)
SENIORITY_PATTERN = re.compile(r"\b(senior|staff|principal|expert)\b", flags=re.IGNORECASE)
TOKEN_PATTERN = re.compile(r"[a-zA-Z0-9\+#\.\-]{2,}")


@dataclass
class HeuristicResult:
    score: float
    hard_skill_score: float
    experience_score: float
    lexical_similarity_score: float
    skills: list[str]
    over_claiming_flags: list[str]
    reasoning: str


def _clamp(value: float, lower: float = 0.0, upper: float = 10.0) -> float:
    return max(lower, min(upper, value))


def extract_skills(text: str) -> list[str]:
    lower_text = text.lower()
    found = [skill for skill in KNOWN_SKILLS if skill in lower_text]
    return sorted(found)


def _required_years(jd_text: str) -> int:
    years = [int(match.group("years")) for match in YEARS_PATTERN.finditer(jd_text)]
    return max(years) if years else 0


def _observed_years(resume_text: str) -> int:
    years = [int(match.group("years")) for match in YEARS_PATTERN.finditer(resume_text)]
    return max(years) if years else 0


def _lexical_similarity(jd_text: str, resume_text: str) -> float:
    jd_tokens = {token.lower() for token in TOKEN_PATTERN.findall(jd_text)}
    resume_tokens = {token.lower() for token in TOKEN_PATTERN.findall(resume_text)}
    if not jd_tokens or not resume_tokens:
        return 0.0
    overlap = len(jd_tokens & resume_tokens)
    union = len(jd_tokens | resume_tokens)
    jaccard = overlap / max(union, 1)
    return _clamp(jaccard * 10.0)


def detect_over_claiming(resume_text: str) -> list[str]:
    flags: list[str] = []
    text_lower = resume_text.lower()
    for match in CLAIM_PATTERN.finditer(resume_text):
        years = int(match.group("years"))
        skill = match.group("skill").strip().lower()
        if years >= 8 and skill not in KNOWN_SKILLS:
            flags.append(f"High claim without clear taxonomy match: {years} years in '{skill}'.")
    if SENIORITY_PATTERN.search(text_lower) and _observed_years(resume_text) <= 1:
        flags.append("Seniority language appears inconsistent with stated experience.")
    return list(dict.fromkeys(flags))


def score_heuristics(jd_text: str, resume_text: str) -> HeuristicResult:
    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)
    overlap = set(jd_skills) & set(resume_skills)

    if jd_skills:
        hard_skill_score = _clamp((len(overlap) / len(set(jd_skills))) * 10.0)
    else:
        hard_skill_score = 7.0

    required_years = _required_years(jd_text)
    observed_years = _observed_years(resume_text)
    if required_years == 0:
        experience_score = 7.0
    else:
        ratio = observed_years / max(required_years, 1)
        experience_score = _clamp(ratio * 10.0)

    lexical_similarity_score = _lexical_similarity(jd_text, resume_text)
    over_claiming_flags = detect_over_claiming(resume_text)

    score = _clamp(0.5 * hard_skill_score + 0.3 * experience_score + 0.2 * lexical_similarity_score)
    if over_claiming_flags:
        score = _clamp(score - 1.0)

    summary = (
        f"Skill overlap {len(overlap)}/{max(len(set(jd_skills)), 1)}; "
        f"experience {observed_years}y vs required {required_years}y; "
        f"lexical similarity {lexical_similarity_score:.2f}/10."
    )

    return HeuristicResult(
        score=round(score, 2),
        hard_skill_score=round(hard_skill_score, 2),
        experience_score=round(experience_score, 2),
        lexical_similarity_score=round(lexical_similarity_score, 2),
        skills=sorted(set(resume_skills)),
        over_claiming_flags=over_claiming_flags,
        reasoning=summary,
    )
