from app.models.schemas import LLMJudgeResult
from app.services.heuristics import detect_over_claiming, extract_skills, score_heuristics
from app.services.llm_client import _extract_json


def test_extract_json_helper():
    assert _extract_json('{"a":1}') == '{"a":1}'
    assert _extract_json("```json\n{\"a\":1}\n```").strip() == '{"a":1}'
    assert _extract_json("prefix {\"a\":1} suffix").strip() == '{"a":1}'
    assert _extract_json("no-json") == "{}"


def test_heuristics_scoring_and_flags():
    jd = "Need Python, Docker, FastAPI and 5 years backend experience."
    resume = "Senior engineer with 6 years of python and docker, 5 years fastapi."
    result = score_heuristics(jd, resume)
    assert result.score >= 0
    assert result.hard_skill_score > 0
    assert "python" in result.skills

    flagged = detect_over_claiming("Principal expert with 1 years experience.")
    assert flagged

    skills = extract_skills("Worked with Python, PostgreSQL and Docker")
    assert {"python", "postgresql", "docker"}.issubset(set(skills))


class _FakeRedis:
    def __init__(self):
        self.store = {}

    async def hgetall(self, key):
        return self.store.get(key, {})

    async def hset(self, key, mapping):
        self.store[key] = {k: str(v) for k, v in mapping.items()}

    async def expire(self, key, ttl):
        return None


class _FakeLLMClient:
    async def judge(self, jd_text: str, resume_text: str):
        return LLMJudgeResult(
            fit_score=8.5,
            skills_demonstrated=["python", "docker"],
            over_claiming_flags=[],
            reasoning_summary="Good fit.",
        )


def test_ranker_cache_and_hybrid_scoring():
    from app.core.config import Settings
    from app.services.ranker import Ranker

    settings = Settings(
        APP_ENV="test",
        DATABASE_URL="sqlite+aiosqlite:///./tests/unit.db",
        REDIS_URL="redis://invalid:6379/0",
        API_KEY_REQUIRED=False,
        LLM_ENABLED=True,
    )
    fake_redis = _FakeRedis()
    ranker = Ranker(settings=settings, llm_client=_FakeLLMClient(), redis_client=fake_redis)

    jd = "Need Python, Docker and 5 years backend."
    resume = "I have 6 years Python and Docker backend experience."

    import asyncio

    first = asyncio.run(ranker.score(jd, resume))
    assert first.source == "hybrid_llm_heuristic"
    second = asyncio.run(ranker.score(jd, resume))
    assert second.fit_score == first.fit_score
    assert second.skills
