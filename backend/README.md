# Recruiter Brain Backend (Production API)

This repository now provides a production-oriented, frontend-driven backend for resume screening.

## Core Capabilities

- Local-first inference (`llama.cpp` OpenAI-compatible server)
- Persistent job, candidate, and screening result storage
- Deterministic ranking with `fit_score` + rank positions
- API-key-protected endpoints for frontend usage
- CORS-configurable for Next.js frontend integration
- Dockerized runtime for 16GB RAM laptops

## Runtime Stack

- `FastAPI` application: `app/main.py`
- `PostgreSQL 17 + pgvector image` for relational persistence
- `Valkey` for scoring cache
- `llama.cpp` server for local LLM inference

## Dependency Lock

- Runtime lock file: `requirements.lock.txt`
- Refresh lock (inside `.venv`): `python -m pip freeze > requirements.lock.txt`

## Start (Windows)

```powershell
cd C:\Users\krish\Documents\NINJA\Resume
Copy-Item .env.example .env -Force
.\scripts\start.ps1
```

## Verify (Windows)

Run full local verification (deps, tests, smoke API flow, model check):

```powershell
.\scripts\verify.ps1
```

## Deep Audit + Day-2 Pipeline (Windows)

Runs strict checks + full Day-2 ML pipeline:

```powershell
.\scripts\deep_audit.ps1
```

Day-2 details:

- [ML Pipeline Guide](c:/Users/krish/Documents/NINJA/Resume/ml_pipeline/README.md)
- [Day-2 Deliverables Map](c:/Users/krish/Documents/NINJA/Resume/docs/day2-deliverables.md)

## Start (Linux/macOS)

```bash
cd /path/to/Resume
cp .env.example .env
./scripts/start.sh
```

## Required Environment Values

Set these before production deployment:

- `API_KEY` (required if `API_KEY_REQUIRED=true`)
- `CORS_ORIGINS` (frontend domains)
- `MODEL_FILE` (must exist in `models/`)

Frontend requests must include:

- `X-API-Key: <API_KEY>`

## Frontend Integration Docs

Use this file for implementation:

- [Frontend API Guide](c:/Users/krish/Documents/NINJA/Resume/docs/frontend-integration.md)
- [Backend Deployment Runbook](c:/Users/krish/Documents/NINJA/Resume/docs/backend-deployment.md)

## API Docs

After startup:

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
- Readiness: `http://localhost:8000/api/v1/ready`

## Primary API Flow (Frontend)

1. Create job (`POST /api/v1/jobs`)
2. Upload resumes or send text candidates
   - `POST /api/v1/jobs/{job_id}/screen/upload`
   - `POST /api/v1/jobs/{job_id}/screen/text`
3. Fetch ranked list (`GET /api/v1/jobs/{job_id}/rankings`)
4. Open candidate detail (`GET /api/v1/candidates/{candidate_id}`)
5. Pull aggregate bias/quality analytics (`GET /api/v1/analytics/bias-report`)
