from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy import func, text
from sqlmodel import select

from app.core.security import require_api_key
from app.db.session import AsyncSessionLocal
from app.models.db import ScreeningResult
from app.models.schemas import (
    BatchScreenResponse,
    BatchScreenTextRequest,
    BiasReportResponse,
    CandidateListResponse,
    CandidateTextInput,
    FrontendScreeningRequest,
    FrontendScreeningResponse,
    JobCreateRequest,
    JobResponse,
    JobsListResponse,
    JobStatusUpdateRequest,
    RankingListResponse,
    ScreeningResponse,
)
from app.services.parser import extract_text_from_upload
from app.services.workflow import ScreeningWorkflow


router = APIRouter(prefix="/api/v1", tags=["screening"])


def get_workflow(request: Request) -> ScreeningWorkflow:
    return request.app.state.workflow


@router.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready", tags=["health"])
async def ready(request: Request) -> dict[str, str]:
    db_state = "ok"
    redis_state = "ok"

    try:
        async with AsyncSessionLocal() as session:
            await session.exec(text("SELECT 1"))
    except Exception:
        db_state = "degraded"

    ranker = request.app.state.ranker
    redis_client = ranker.redis_client
    if redis_client is not None:
        try:
            await redis_client.ping()
        except Exception:
            redis_state = "degraded"

    overall = "ok" if db_state == "ok" and redis_state == "ok" else "degraded"
    return {"status": overall, "db": db_state, "cache": redis_state}


@router.post("/jobs", response_model=JobResponse)
async def create_job(
    payload: JobCreateRequest,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> JobResponse:
    return await workflow.create_job(title=payload.title, description=payload.description)


@router.get("/jobs", response_model=JobsListResponse)
async def list_jobs(
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> JobsListResponse:
    return await workflow.list_jobs(limit=limit, offset=offset)


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> JobResponse:
    return await workflow.get_job(job_id)


@router.patch("/jobs/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    job_id: str,
    payload: JobStatusUpdateRequest,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> JobResponse:
    return await workflow.update_job_status(job_id, payload.status)


@router.post("/jobs/{job_id}/screen/text", response_model=BatchScreenResponse)
async def screen_from_text(
    job_id: str,
    payload: BatchScreenTextRequest,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> BatchScreenResponse:
    return await workflow.create_candidates(job_id=job_id, candidates=payload.candidates)


@router.post("/jobs/{job_id}/screen/upload", response_model=BatchScreenResponse)
async def screen_from_upload(
    job_id: str,
    resumes: Annotated[list[UploadFile], File(...)],
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> BatchScreenResponse:
    settings = workflow.settings
    candidates: list[CandidateTextInput] = []
    for upload in resumes:
        parsed = await extract_text_from_upload(upload, settings.max_upload_bytes)
        display_name = (upload.filename or "resume").rsplit(".", maxsplit=1)[0]
        candidates.append(
            CandidateTextInput(
                display_name=display_name,
                resume_text=parsed,
                source_filename=upload.filename,
            )
        )
    return await workflow.create_candidates(job_id=job_id, candidates=candidates)


@router.post("/frontend/screening/text", response_model=FrontendScreeningResponse)
async def frontend_screening_text(
    payload: FrontendScreeningRequest,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> FrontendScreeningResponse:
    job = await workflow.create_job(title=payload.title, description=payload.description)
    screening = await workflow.create_candidates(job_id=job.id, candidates=payload.candidates)
    rankings = await workflow.get_rankings(job_id=job.id, limit=500, offset=0)
    return FrontendScreeningResponse(job=job, screening=screening, rankings=rankings)


@router.post("/frontend/screening/upload", response_model=FrontendScreeningResponse)
async def frontend_screening_upload(
    title: Annotated[str, Form(min_length=3, max_length=180)],
    description: Annotated[str, Form(min_length=30)],
    resumes: Annotated[list[UploadFile], File(...)],
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> FrontendScreeningResponse:
    settings = workflow.settings
    candidates: list[CandidateTextInput] = []
    for upload in resumes:
        parsed = await extract_text_from_upload(upload, settings.max_upload_bytes)
        display_name = (upload.filename or "resume").rsplit(".", maxsplit=1)[0]
        candidates.append(
            CandidateTextInput(
                display_name=display_name,
                resume_text=parsed,
                source_filename=upload.filename,
            )
        )

    job = await workflow.create_job(title=title, description=description)
    screening = await workflow.create_candidates(job_id=job.id, candidates=candidates)
    rankings = await workflow.get_rankings(job_id=job.id, limit=500, offset=0)
    return FrontendScreeningResponse(job=job, screening=screening, rankings=rankings)


@router.get("/jobs/{job_id}/candidates", response_model=CandidateListResponse)
async def list_candidates(
    job_id: str,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> CandidateListResponse:
    return await workflow.list_candidates(job_id=job_id, limit=limit, offset=offset)


@router.get("/jobs/{job_id}/rankings", response_model=RankingListResponse)
async def list_rankings(
    job_id: str,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> RankingListResponse:
    return await workflow.get_rankings(job_id=job_id, limit=limit, offset=offset)


@router.get("/candidates/{candidate_id}", response_model=ScreeningResponse)
async def get_candidate(
    candidate_id: str,
    workflow: Annotated[ScreeningWorkflow, Depends(get_workflow)],
    _: Annotated[None, Depends(require_api_key)],
) -> ScreeningResponse:
    return await workflow.get_candidate(candidate_id)


@router.get("/analytics/bias-report", response_model=BiasReportResponse)
async def analytics_bias_report(
    _: Annotated[None, Depends(require_api_key)],
    job_id: Optional[str] = Query(default=None),
) -> BiasReportResponse:
    async with AsyncSessionLocal() as session:
        where_clause = ScreeningResult.job_id == job_id if job_id else None

        total_stmt = select(func.count()).select_from(ScreeningResult)
        if where_clause is not None:
            total_stmt = total_stmt.where(where_clause)
        total = int((await session.exec(total_stmt)).one() or 0)

        avg_stmt = select(func.avg(ScreeningResult.fit_score))
        if where_clause is not None:
            avg_stmt = avg_stmt.where(where_clause)
        avg_fit = float((await session.exec(avg_stmt)).one() or 0.0)

        flagged_stmt = select(func.count()).select_from(ScreeningResult).where(
            func.json_array_length(ScreeningResult.over_claiming_flags) > 0
        )
        if where_clause is not None:
            flagged_stmt = flagged_stmt.where(where_clause)
        flagged = int((await session.exec(flagged_stmt)).one() or 0)

    ratio = (flagged / total) if total > 0 else 0.0
    return BiasReportResponse(
        total_evaluations=total,
        flagged_overclaim_ratio=round(ratio, 4),
        avg_fit_score=round(avg_fit, 3),
    )
