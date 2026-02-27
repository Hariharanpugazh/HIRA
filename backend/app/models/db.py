from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import JSON, Column, DateTime, Index, Text, UniqueConstraint
from sqlmodel import Field, SQLModel


class Job(SQLModel, table=True):
    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_status_created", "status", "created_at"),)

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str = Field(min_length=3, max_length=180, index=True)
    description: str = Field(sa_column=Column(Text, nullable=False))
    status: str = Field(default="open", index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class Candidate(SQLModel, table=True):
    __tablename__ = "candidates"
    __table_args__ = (
        Index("ix_candidate_job_created", "job_id", "created_at"),
        Index("ix_candidate_job_resume_hash", "job_id", "resume_hash"),
    )

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    job_id: str = Field(foreign_key="jobs.id", index=True)
    display_name: str = Field(min_length=1, max_length=180, index=True)
    source_filename: Optional[str] = Field(default=None, max_length=255)
    resume_text: str = Field(sa_column=Column(Text, nullable=False))
    resume_hash: str = Field(index=True, max_length=64)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class ScreeningResult(SQLModel, table=True):
    __tablename__ = "screening_results"
    __table_args__ = (
        UniqueConstraint("candidate_id", name="uq_screening_candidate"),
        Index("ix_screening_job_rank", "job_id", "rank"),
        Index("ix_screening_job_score", "job_id", "fit_score"),
    )

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    job_id: str = Field(foreign_key="jobs.id", index=True)
    candidate_id: str = Field(foreign_key="candidates.id", index=True)

    fit_score: float
    llm_score: Optional[float] = None
    heuristic_score: float
    hard_skill_score: float
    experience_score: float
    lexical_similarity_score: float
    source: str = Field(default="hybrid_llm_heuristic", max_length=64)

    rank: Optional[int] = Field(default=None, index=True)
    skills: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    over_claiming_flags: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    reasoning: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
