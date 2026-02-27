import logging
from contextlib import asynccontextmanager

import redis.asyncio as redis_async
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.api.routes import router
from app.core.config import get_settings
from app.core.middleware import RequestContextMiddleware
from app.db.session import dispose_engine, init_db
from app.models import db as _db_models  # noqa: F401
from app.services.llm_client import LocalLLMClient
from app.services.ranker import Ranker
from app.services.workflow import ScreeningWorkflow


settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    redis_client = None
    try:
        redis_client = redis_async.from_url(settings.redis_url, decode_responses=True)
        await redis_client.ping()
    except Exception:
        redis_client = None

    llm_client = LocalLLMClient(settings)
    ranker = Ranker(settings=settings, llm_client=llm_client, redis_client=redis_client)
    workflow = ScreeningWorkflow(settings=settings, ranker=ranker)

    app.state.settings = settings
    app.state.ranker = ranker
    app.state.workflow = workflow

    yield

    await llm_client.close()
    if redis_client:
        await redis_client.aclose()
    await dispose_engine()


app = FastAPI(
    title="Recruiter Brain Backend",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(RequestContextMiddleware)
app.include_router(router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    return {"service": "recruiter-brain-backend", "status": "ok", "version": "1.0.0"}
