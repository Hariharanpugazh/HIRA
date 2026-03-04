import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import select

from app.core.config import Settings
from app.db.session import AsyncSessionLocal
from app.models.db import Candidate, Job, ScreeningResult
from app.models.schemas import (
    BatchScreenResponse,
    CandidateListResponse,
    CandidateResponse,
    CandidateTextInput,
    ComponentScores,
    JobResponse,
    JobsListResponse,
    RankingListResponse,
    ScreeningResponse,
)
from app.services.ranker import Ranker, ScoreResult


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


class ScreeningWorkflow:
    def __init__(self, settings: Settings, ranker: Ranker):
        self._settings = settings
        self._ranker = ranker

    @property
    def settings(self) -> Settings:
        return self._settings

    async def create_job(self, title: str, description: str) -> JobResponse:
        now = datetime.now(timezone.utc)
        async with AsyncSessionLocal() as session:
            job = Job(title=title.strip(), description=description.strip(), updated_at=now)
            session.add(job)
            await session.commit()
            await session.refresh(job)
            return self._to_job_response(job)

    async def list_jobs(self, limit: int, offset: int) -> JobsListResponse:
        async with AsyncSessionLocal() as session:
            total_result = await session.exec(select(func.count()).select_from(Job))
            total = int(total_result.one() or 0)
            rows = await session.exec(select(Job).order_by(Job.created_at.desc()).offset(offset).limit(limit))
            items = [self._to_job_response(job) for job in rows.all()]
            return JobsListResponse(total=total, items=items)

    async def get_job(self, job_id: str) -> JobResponse:
        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            return self._to_job_response(job)

    async def update_job_status(self, job_id: str, status_value: str) -> JobResponse:
        now = datetime.now(timezone.utc)
        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            job.status = status_value
            job.updated_at = now
            session.add(job)
            await session.commit()
            await session.refresh(job)
            return self._to_job_response(job)

    async def create_candidates(
        self,
        job_id: str,
        candidates: list[CandidateTextInput],
    ) -> BatchScreenResponse:
        if len(candidates) > self._settings.max_batch_candidates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Batch exceeds MAX_BATCH_CANDIDATES={self._settings.max_batch_candidates}.",
            )

        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            if job.status != "open":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Job is not open for screening.",
                )
            jd_text = job.description

        scored_payloads: list[tuple[CandidateTextInput, ScoreResult]] = []
        for payload in candidates:
            resume_text = payload.resume_text.strip()
            score = await self._ranker.score(jd_text, resume_text)
            scored_payloads.append((payload, score))

        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            if job.status != "open":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Job is not open for screening.",
                )

            created_candidate_ids: list[str] = []
            for payload, score in scored_payloads:
                resume_text = payload.resume_text.strip()
                candidate = Candidate(
                    job_id=job.id,
                    display_name=payload.display_name.strip(),
                    source_filename=payload.source_filename,
                    resume_text=resume_text,
                    resume_hash=_hash_text(resume_text),
                )
                session.add(candidate)
                await session.flush()

                record = ScreeningResult(
                    job_id=job.id,
                    candidate_id=candidate.id,
                    fit_score=score.fit_score,
                    llm_score=score.component_scores.llm,
                    heuristic_score=score.component_scores.heuristic,
                    hard_skill_score=score.component_scores.hard_skill,
                    experience_score=score.component_scores.experience,
                    lexical_similarity_score=score.component_scores.lexical_similarity,
                    source=score.source,
                    skills=score.skills,
                    over_claiming_flags=score.over_claiming_flags,
                    reasoning=score.reasoning,
                )
                session.add(record)
                created_candidate_ids.append(candidate.id)

            await session.flush()
            await self._refresh_ranks(session, job.id)
            job.updated_at = datetime.now(timezone.utc)
            session.add(job)
            await session.commit()

            response_rows = await session.exec(
                select(ScreeningResult, Candidate)
                .join(Candidate, Candidate.id == ScreeningResult.candidate_id)
                .where(ScreeningResult.candidate_id.in_(created_candidate_ids))
                .order_by(ScreeningResult.rank.asc())
            )
            items = [self._to_screening_response(result, candidate) for result, candidate in response_rows.all()]
            return BatchScreenResponse(job_id=job.id, processed_count=len(items), results=items)

    async def list_candidates(self, job_id: str, limit: int, offset: int) -> CandidateListResponse:
        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            total_result = await session.exec(
                select(func.count()).select_from(Candidate).where(Candidate.job_id == job_id)
            )
            total = int(total_result.one() or 0)
            rows = await session.exec(
                select(Candidate)
                .where(Candidate.job_id == job_id)
                .order_by(Candidate.created_at.desc())
                .offset(offset)
                .limit(limit)
            )
            items = [
                CandidateResponse(
                    id=item.id,
                    job_id=item.job_id,
                    display_name=item.display_name,
                    source_filename=item.source_filename,
                    created_at=item.created_at,
                )
                for item in rows.all()
            ]
            return CandidateListResponse(total=total, items=items)

    async def get_rankings(self, job_id: str, limit: int, offset: int) -> RankingListResponse:
        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            total_result = await session.exec(
                select(func.count()).select_from(ScreeningResult).where(ScreeningResult.job_id == job_id)
            )
            total = int(total_result.one() or 0)
            rows = await session.exec(
                select(ScreeningResult, Candidate)
                .join(Candidate, Candidate.id == ScreeningResult.candidate_id)
                .where(ScreeningResult.job_id == job_id)
                .order_by(ScreeningResult.rank.asc(), ScreeningResult.fit_score.desc())
                .offset(offset)
                .limit(limit)
            )
            items = [self._to_screening_response(result, candidate) for result, candidate in rows.all()]
            return RankingListResponse(job_id=job_id, total=total, items=items)

    async def get_candidate(self, candidate_id: str) -> ScreeningResponse:
        async with AsyncSessionLocal() as session:
            row = await session.exec(
                select(ScreeningResult, Candidate)
                .join(Candidate, Candidate.id == ScreeningResult.candidate_id)
                .where(Candidate.id == candidate_id)
            )
            pair = row.first()
            if not pair:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")
            result, candidate = pair
            return self._to_screening_response(result, candidate)

    async def delete_job(self, job_id: str) -> None:
        async with AsyncSessionLocal() as session:
            job = await session.get(Job, job_id)
            if not job:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
            # Delete screening results
            screening_rows = await session.exec(
                select(ScreeningResult).where(ScreeningResult.job_id == job_id)
            )
            for sr in screening_rows.all():
                await session.delete(sr)
            # Delete candidates
            candidate_rows = await session.exec(
                select(Candidate).where(Candidate.job_id == job_id)
            )
            for c in candidate_rows.all():
                await session.delete(c)
            # Delete the job itself
            await session.delete(job)
            await session.commit()

    async def _refresh_ranks(self, session, job_id: str) -> None:
        rows = await session.exec(
            select(ScreeningResult)
            .where(ScreeningResult.job_id == job_id)
            .order_by(ScreeningResult.fit_score.desc(), ScreeningResult.created_at.asc())
        )
        now = datetime.now(timezone.utc)
        for position, row in enumerate(rows.all(), start=1):
            row.rank = position
            row.updated_at = now
            session.add(row)

    @staticmethod
    def _to_job_response(job: Job) -> JobResponse:
        return JobResponse(
            id=job.id,
            title=job.title,
            description=job.description,
            status=job.status,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )

    @staticmethod
    def _to_screening_response(result: ScreeningResult, candidate: Candidate) -> ScreeningResponse:
        return ScreeningResponse(
            screening_id=result.id,
            job_id=result.job_id,
            candidate_id=result.candidate_id,
            display_name=candidate.display_name,
            fit_score=result.fit_score,
            rank=result.rank,
            source=result.source,
            skills=result.skills,
            over_claiming_flags=result.over_claiming_flags,
            component_scores=ComponentScores(
                llm=result.llm_score,
                heuristic=result.heuristic_score,
                hard_skill=result.hard_skill_score,
                experience=result.experience_score,
                lexical_similarity=result.lexical_similarity_score,
            ),
            reasoning=result.reasoning,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
