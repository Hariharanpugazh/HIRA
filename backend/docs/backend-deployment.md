# Backend Deployment Runbook

## 1. Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- 16GB RAM minimum
- Model file present in `models/` (default: `Qwen2.5-1.5B-Instruct-Q4_K_M.gguf`)

## 2. Environment Setup

1. Copy env:
```powershell
Copy-Item .env.example .env -Force
```

2. Set secure values in `.env`:
- `API_KEY`
- `CORS_ORIGINS` (frontend domain list)
- `APP_ENV=production`

## 3. Start Services

```powershell
.\scripts\start.ps1
```

or

```bash
./scripts/start.sh
```

## 4. Validate Runtime

- API health: `GET /api/v1/health`
- API readiness: `GET /api/v1/ready`
- Swagger: `/docs`
- Full backend + ML audit:
  - `powershell -ExecutionPolicy Bypass -File scripts/deep_audit.ps1`

## 5. Operational Defaults for 16GB RAM

- `LLM_CTX_SIZE=3072`
- `LLM_BATCH=512`
- `LLM_GPU_LAYERS=0`
- `API_WORKERS=2`

If memory pressure occurs:
- Set `LLM_CTX_SIZE=2048`
- Set `LLM_BATCH=256`
- Restart stack

## 6. Production Notes

- Keep `.env` out of version control.
- Rotate `API_KEY` per environment.
- Restrict `CORS_ORIGINS` to exact frontend domains.
- Run behind reverse proxy + TLS in external deployments.
- For schema resets during early-stage rollout:
  - `docker compose down -v`
  - `docker compose up -d --build`
- Runtime does not require prepackaged datasets: jobs/resumes are ingested through API endpoints and stored in PostgreSQL.
