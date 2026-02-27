param(
    [switch]$SkipModelCheck
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$venvPython = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    python -m venv .venv
    & $venvPython -m pip install --upgrade pip
}

& $venvPython -m pip install -r requirements.txt pytest pytest-cov aiosqlite | Out-Host

if (-not $SkipModelCheck) {
    & ".\scripts\download-model.ps1" | Out-Host
}

& $venvPython -m pytest -q --disable-warnings --cov=app --cov-report=term-missing | Out-Host

$env:DATABASE_URL = "sqlite+aiosqlite:///./tests/smoke.db"
$env:REDIS_URL = "redis://invalid:6379/0"
$env:LLM_ENABLED = "false"
$env:API_KEY_REQUIRED = "true"
$env:API_KEY = "smoke-key"
$env:CORS_ORIGINS = "http://localhost:3000"

$script = @'
import os
import subprocess
import time
import httpx
from pathlib import Path

root = Path(r".")
env = os.environ.copy()
proc = subprocess.Popen(
    [str(root / ".venv/Scripts/python.exe"), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
    cwd=str(root),
    env=env,
)

try:
    client = httpx.Client(timeout=10)
    ok = False
    for _ in range(60):
        try:
            r = client.get("http://127.0.0.1:8001/api/v1/health")
            if r.status_code == 200:
                ok = True
                break
        except Exception:
            pass
        time.sleep(0.5)
    if not ok:
        raise RuntimeError("Smoke server did not become healthy.")

    headers = {"X-API-Key": "smoke-key"}
    job = client.post(
        "http://127.0.0.1:8001/api/v1/jobs",
        headers=headers,
        json={
            "title": "Verify Backend Role",
            "description": "Need Python Docker FastAPI and 4 years backend experience.",
        },
    )
    job.raise_for_status()
    job_id = job.json()["id"]
    screen = client.post(
        f"http://127.0.0.1:8001/api/v1/jobs/{job_id}/screen/text",
        headers=headers,
        json={
            "candidates": [
                {
                    "display_name": "Verify Candidate",
                    "resume_text": "5 years Python and FastAPI with Docker backend systems.",
                    "source_filename": "verify.txt",
                }
            ]
        },
    )
    screen.raise_for_status()
    rankings = client.get(f"http://127.0.0.1:8001/api/v1/jobs/{job_id}/rankings", headers=headers)
    rankings.raise_for_status()
    print("VERIFY_SMOKE_OK", {"job_id": job_id, "processed": screen.json()["processed_count"], "ranked": rankings.json()["total"]})
finally:
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
'@

$script | & $venvPython -
Write-Host "VERIFY_COMPLETE"

