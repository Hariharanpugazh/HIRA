import os
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient


DB_PATH = Path(__file__).resolve().parent / f"test_{uuid4().hex}.db"
API_KEY = "test-api-key"

# Configure environment before app import.
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{DB_PATH.as_posix()}"
os.environ["REDIS_URL"] = "redis://invalid:6379/0"
os.environ["LLM_ENABLED"] = "false"
os.environ["API_KEY_REQUIRED"] = "true"
os.environ["API_KEY"] = API_KEY
os.environ["CORS_ORIGINS"] = "http://localhost:3000"
os.environ["APP_ENV"] = "test"
os.environ["LOG_LEVEL"] = "INFO"


@pytest.fixture(scope="session")
def client() -> TestClient:
    if DB_PATH.exists():
        DB_PATH.unlink(missing_ok=True)
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    if DB_PATH.exists():
        try:
            DB_PATH.unlink()
        except PermissionError:
            pass


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"X-API-Key": API_KEY}
