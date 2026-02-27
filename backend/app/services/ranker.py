import hashlib
from dataclasses import dataclass
from typing import Optional

import redis.asyncio as redis_async

from app.core.config import Settings
from app.models.schemas import ComponentScores
from app.services.heuristics import score_heuristics
from app.services.llm_client import LocalLLMClient


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _clamp(value: float, lower: float = 0.0, upper: float = 10.0) -> float:
    return max(lower, min(upper, value))


@dataclass
class ScoreResult:
    fit_score: float
    source: str
    skills: list[str]
    over_claiming_flags: list[str]
    component_scores: ComponentScores
    reasoning: str


class Ranker:
    def __init__(
        self,
        settings: Settings,
        llm_client: LocalLLMClient,
        redis_client: Optional[redis_async.Redis] = None,
    ):
        self._settings = settings
        self._llm_client = llm_client
        self._redis = redis_client

    @property
    def redis_client(self) -> Optional[redis_async.Redis]:
        return self._redis

    async def score(self, jd_text: str, resume_text: str) -> ScoreResult:
        normalized_jd = jd_text.strip()
        normalized_resume = resume_text.strip()
        cache_key = f"score:{_hash_text(normalized_jd)}:{_hash_text(normalized_resume)}"

        cached = await self._cache_get(cache_key)
        if cached:
            return cached

        heuristic = score_heuristics(normalized_jd, normalized_resume)
        llm = await self._llm_client.judge(normalized_jd, normalized_resume)

        llm_score = float(llm.fit_score) if llm else None
        if llm_score is None:
            final_score = heuristic.score
            source = "heuristic_only"
        else:
            weighted = (
                self._settings.rank_weight_llm * llm_score
                + self._settings.rank_weight_hard_skill * heuristic.hard_skill_score
                + self._settings.rank_weight_experience * heuristic.experience_score
            )
            if llm.over_claiming_flags or heuristic.over_claiming_flags:
                weighted -= self._settings.overclaim_penalty
            final_score = _clamp(weighted)
            source = "hybrid_llm_heuristic"

        skills = sorted(set(heuristic.skills) | (set(llm.skills_demonstrated) if llm else set()))
        over_claiming_flags = list(
            dict.fromkeys((llm.over_claiming_flags if llm else []) + heuristic.over_claiming_flags)
        )
        reasoning = (
            f"LLM: {llm.reasoning_summary} | Heuristic: {heuristic.reasoning}"
            if llm
            else f"Heuristic: {heuristic.reasoning}"
        )

        output = ScoreResult(
            fit_score=round(final_score, 2),
            source=source,
            skills=skills,
            over_claiming_flags=over_claiming_flags,
            component_scores=ComponentScores(
                llm=round(llm_score, 2) if llm_score is not None else None,
                heuristic=heuristic.score,
                hard_skill=heuristic.hard_skill_score,
                experience=heuristic.experience_score,
                lexical_similarity=heuristic.lexical_similarity_score,
            ),
            reasoning=reasoning,
        )

        await self._cache_set(cache_key, output)
        return output

    async def _cache_get(self, key: str) -> Optional[ScoreResult]:
        if not self._redis:
            return None
        payload = await self._redis.hgetall(key)
        if not payload:
            return None
        try:
            component_scores = ComponentScores(
                llm=float(payload["llm"]) if payload.get("llm") not in (None, "", "None") else None,
                heuristic=float(payload["heuristic"]),
                hard_skill=float(payload["hard_skill"]),
                experience=float(payload["experience"]),
                lexical_similarity=float(payload["lexical_similarity"]),
            )
            skills = payload.get("skills", "").split("|") if payload.get("skills") else []
            over_claiming_flags = (
                payload.get("over_claiming_flags", "").split("|")
                if payload.get("over_claiming_flags")
                else []
            )
            return ScoreResult(
                fit_score=float(payload["fit_score"]),
                source=payload["source"],
                skills=skills,
                over_claiming_flags=over_claiming_flags,
                component_scores=component_scores,
                reasoning=payload.get("reasoning", ""),
            )
        except Exception:
            return None

    async def _cache_set(self, key: str, value: ScoreResult) -> None:
        if not self._redis:
            return
        await self._redis.hset(
            key,
            mapping={
                "fit_score": value.fit_score,
                "source": value.source,
                "llm": value.component_scores.llm if value.component_scores.llm is not None else "",
                "heuristic": value.component_scores.heuristic,
                "hard_skill": value.component_scores.hard_skill,
                "experience": value.component_scores.experience,
                "lexical_similarity": value.component_scores.lexical_similarity,
                "skills": "|".join(value.skills),
                "over_claiming_flags": "|".join(value.over_claiming_flags),
                "reasoning": value.reasoning,
            },
        )
        await self._redis.expire(key, self._settings.cache_ttl_seconds)
