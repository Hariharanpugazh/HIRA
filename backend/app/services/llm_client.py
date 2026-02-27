import json
import logging
import re
from typing import Optional

import httpx

from app.core.config import Settings
from app.models.schemas import LLMJudgeResult

logger = logging.getLogger("recruiter_brain.llm")


class LocalLLMClient:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = httpx.AsyncClient(timeout=settings.llm_timeout_seconds)

    async def close(self) -> None:
        await self._client.aclose()

    async def judge(self, jd_text: str, resume_text: str) -> Optional[LLMJudgeResult]:
        if not self._settings.llm_enabled:
            return None

        system_prompt = (
            "You are a strict recruiter evaluator. "
            "Return JSON only with keys: fit_score, skills_demonstrated, over_claiming_flags, reasoning_summary. "
            "fit_score must be between 0 and 10."
        )
        user_prompt = (
            "Evaluate resume against JD.\n"
            f"JOB DESCRIPTION:\n{jd_text}\n\n"
            f"RESUME:\n{resume_text}\n\n"
            "Output strict JSON only."
        )

        payload = {
            "model": self._settings.llm_model,
            "temperature": self._settings.llm_temperature,
            "max_tokens": self._settings.llm_max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        for attempt in range(2):
            try:
                response = await self._client.post(
                    f"{self._settings.llm_base_url.rstrip('/')}/chat/completions", json=payload
                )
                response.raise_for_status()
                content = (
                    response.json()
                    .get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                    .strip()
                )
                as_json = _extract_json(content)
                parsed = json.loads(as_json)
                result = LLMJudgeResult.model_validate(parsed)
                result.fit_score = max(0.0, min(10.0, float(result.fit_score)))
                return result
            except Exception as exc:
                logger.warning("llm_judge_failed attempt=%s error=%s", attempt + 1, exc)
        return None


def _extract_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    if cleaned.startswith("{") and cleaned.endswith("}"):
        return cleaned
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if match:
        return match.group(0)
    return "{}"
