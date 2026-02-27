from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LLMJudgeResult(BaseModel):
    fit_score: float
    skills_demonstrated: list[str]
    over_claiming_flags: list[str]
    reasoning_summary: str


class ComponentScores(BaseModel):
    llm: Optional[float] = None
    heuristic: float
    hard_skill: float
    experience: float
    lexical_similarity: float


class JobCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=30)


class JobStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str = Field(pattern="^(open|closed|archived)$")


class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime


class JobsListResponse(BaseModel):
    total: int
    items: list[JobResponse]


class CandidateTextInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=1, max_length=180)
    resume_text: str = Field(min_length=20)
    source_filename: Optional[str] = Field(default=None, max_length=255)


class BatchScreenTextRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    candidates: list[CandidateTextInput] = Field(min_length=1)


class FrontendScreeningRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=30)
    candidates: list[CandidateTextInput] = Field(min_length=1)


class CandidateResponse(BaseModel):
    id: str
    job_id: str
    display_name: str
    source_filename: Optional[str] = None
    created_at: datetime


class CandidateListResponse(BaseModel):
    total: int
    items: list[CandidateResponse]


class ScreeningResponse(BaseModel):
    screening_id: str
    job_id: str
    candidate_id: str
    display_name: str
    fit_score: float
    rank: Optional[int] = None
    source: str
    skills: list[str]
    over_claiming_flags: list[str]
    component_scores: ComponentScores
    reasoning: str
    created_at: datetime
    updated_at: datetime


class BatchScreenResponse(BaseModel):
    job_id: str
    processed_count: int
    results: list[ScreeningResponse]


class RankingListResponse(BaseModel):
    job_id: str
    total: int
    items: list[ScreeningResponse]


class BiasReportResponse(BaseModel):
    total_evaluations: int
    flagged_overclaim_ratio: float
    avg_fit_score: float
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FrontendScreeningResponse(BaseModel):
    job: JobResponse
    screening: BatchScreenResponse
    rankings: RankingListResponse
