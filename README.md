# HIRA — Hiring Intelligence & Ranking Assistant

A full-stack resume screening platform that combines heuristic analysis with LLM-based evaluation to rank job candidates. Upload resumes (PDF, DOCX, TXT), paste text, or batch-process — HIRA scores and ranks each candidate against the job description on a 0–10 scale, flags over-claiming, and breaks down the result into component scores.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Layout](#directory-layout)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Docker (Recommended)](#docker-recommended)
  - [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Scoring System](#scoring-system)
- [ML Pipeline](#ml-pipeline)
- [Frontend Pages](#frontend-pages)
- [Testing](#testing)
- [License](#license)

---

## Overview

HIRA takes a job description and one or more resumes, then produces a ranked list of candidates with:

- **Fit Score** (0–10) — weighted composite of LLM judgment, hard skill overlap, and experience match
- **Component Scores** — LLM Judge, Heuristic, Hard Skills, Experience, Lexical Similarity
- **Skills Extracted** — matched against a 48-skill taxonomy (Python, React, AWS, Kubernetes, etc.)
- **Over-Claiming Flags** — detects inflated seniority or implausible experience claims
- **AI Reasoning** — LLM-generated explanation of the score

The system works in two modes:
- **Hybrid (LLM + Heuristic)** — when an LLM server is available, uses 70% LLM / 20% hard skill / 10% experience weighting
- **Heuristic-only** — falls back gracefully when the LLM is disabled or unreachable

---

## Architecture

```
┌──────────────────────┐     ┌──────────────────────────────────────┐
│   Next.js Frontend   │────▶│   Next.js API Routes (server-side)   │
│   (React 19, TW4)    │     │   /api/jobs, /api/screening, etc.    │
│   Port 3000          │     └───────────────┬──────────────────────┘
└──────────────────────┘                     │ X-API-Key header
                                             ▼
                              ┌──────────────────────────┐
                              │   FastAPI Backend         │
                              │   /api/v1/*               │
                              │   Port 8000               │
                              └──┬────────────┬───────┬───┘
                                 │            │       │
                    ┌────────────▼──┐  ┌──────▼───┐  ┌▼──────────────┐
                    │  PostgreSQL   │  │  Valkey   │  │  llama.cpp    │
                    │  (pgvector)   │  │  (Redis)  │  │  Qwen 2.5    │
                    │  Port 5432    │  │  Port 6379│  │  Port 8080    │
                    └───────────────┘  └──────────┘  └───────────────┘
```

- **Frontend → Backend** communication goes through Next.js API routes (server-side), not direct browser-to-backend calls. The API key never leaves the server.
- **SQLite** is used for local dev (both Prisma auth DB and backend DB). PostgreSQL in production.
- **Valkey/Redis** caches scoring results keyed by SHA-256 hash of JD + resume text.
- **llama.cpp** serves the quantized Qwen 2.5 1.5B Instruct model via an OpenAI-compatible `/v1/chat/completions` endpoint.

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI 0.115+ with async/await |
| ORM | SQLModel + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 17 (pgvector) / SQLite (dev) |
| Cache | Valkey 8.1 (Redis-compatible) |
| LLM | Qwen 2.5 1.5B Instruct (GGUF Q4_K_M, ~1 GB) via llama.cpp |
| File Parsing | pypdf, python-docx (PDF, DOCX, TXT, MD, RTF) |
| Serialization | orjson |
| Runtime | Python 3.12, uvicorn |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16.1 (Turbopack) |
| UI | React 19, Tailwind CSS 4.2, Lucide icons |
| Auth | NextAuth v5 (beta.15) with Prisma adapter |
| Providers | Credentials (email/password with bcrypt) + Google OAuth |
| Auth DB | Prisma ORM → SQLite (dev) / PostgreSQL (prod) |
| Font | Geist (sans + mono) |

### ML Pipeline
| Component | Technology |
|-----------|-----------|
| Training | PyTorch 2.4+, Hugging Face Transformers 4.45+ |
| Tasks | Score prediction (ordinal 0–10), Skill extraction (NER) |
| Evaluation | scikit-learn, seqeval |
| Bias Audit | Counterfactual demographic swap analysis |

---

## Directory Layout

```
HIRA/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, middleware
│   │   ├── api/routes.py        # All API endpoints
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic Settings (env vars)
│   │   │   ├── security.py      # API key middleware
│   │   │   └── middleware.py     # Request ID, logging
│   │   ├── db/session.py        # Async engine, init_db()
│   │   ├── models/
│   │   │   ├── db.py            # Job, Candidate, ScreeningResult tables
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   └── services/
│   │       ├── workflow.py       # Orchestrator: create jobs, screen, rank
│   │       ├── ranker.py         # Hybrid scoring engine
│   │       ├── heuristics.py     # Skill matching, experience extraction
│   │       ├── llm_client.py     # OpenAI-compatible LLM client
│   │       └── parser.py         # PDF/DOCX/TXT file extraction
│   ├── ml_pipeline/              # Training scripts, data, artifacts
│   ├── models/                   # GGUF model files
│   ├── scripts/                  # start.ps1, start.sh, download-model
│   ├── tests/                    # pytest test suite
│   ├── docker-compose.yml        # Full stack: postgres, valkey, llm, api
│   ├── Dockerfile
│   └── requirements.txt
│
└── frontend/
    ├── app/
    │   ├── layout.tsx            # Root layout, fonts, theme bootstrap
    │   ├── page.tsx              # Landing / redirect
    │   ├── globals.css           # Dark + light theme CSS variables
    │   ├── api/                  # Next.js API routes (proxy to backend)
    │   └── (pages)/
    │       ├── (auth)/           # Login, signup, forgot/reset password
    │       └── dashboard/        # Main app pages
    ├── components/
    │   ├── dashboard/            # Sidebar, Shell, Provider, ScreeningResults, etc.
    │   └── auth/                 # Auth page components
    ├── lib/
    │   ├── api-client.ts         # Server-side backend API client
    │   ├── api-types.ts          # TypeScript interfaces matching backend schemas
    │   ├── auth.ts               # NextAuth config
    │   └── prisma.ts             # Prisma client singleton
    └── prisma/
        └── schema.prisma         # User, Account, Session tables
```

---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** (for the recommended setup)
- **Node.js 20+** and **npm** (for frontend)
- **Python 3.10+** (for local backend dev without Docker)
- ~1.5 GB disk space for the Qwen model file

### Docker (Recommended)

This spins up PostgreSQL, Valkey, llama.cpp (LLM), and the API server:

```bash
cd backend

# Copy env file and download the Qwen model (~1 GB)
cp .env.example .env
# On Windows:
powershell -ExecutionPolicy Bypass -File scripts/download-model.ps1
# On Linux/Mac:
bash scripts/download-model.sh

# Start everything
docker compose up -d --build
```

The backend API docs will be at http://localhost:8000/docs

Then start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Local Development

If you don't want Docker, you can run everything locally with SQLite and Ollama:

**Backend:**

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt

# Start with SQLite, no Redis, LLM disabled
DATABASE_URL="sqlite+aiosqlite:///./dev.db" \
REDIS_URL="redis://invalid:6379/0" \
LLM_ENABLED=false \
API_KEY_REQUIRED=true \
API_KEY=change-this-api-key \
CORS_ORIGINS="http://localhost:3000" \
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**To enable LLM scoring locally** (optional), install [Ollama](https://ollama.com), then:

```bash
ollama serve                        # starts on port 11434
ollama pull qwen2.5:1.5b            # ~1 GB download
```

Then start the backend with:

```bash
LLM_ENABLED=true \
LLM_BASE_URL="http://localhost:11434/v1" \
LLM_MODEL="qwen2.5:1.5b" \
# ... rest of env vars same as above
```

**Frontend:**

```bash
cd frontend
npm install
npx prisma generate
npx prisma db push       # creates SQLite auth DB
npm run dev
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Database connection string. Use `sqlite+aiosqlite:///./dev.db` for local dev |
| `REDIS_URL` | `redis://valkey:6379/0` | Valkey/Redis URL. Set to invalid string if not using cache |
| `API_KEY_REQUIRED` | `true` | Whether the `X-API-Key` header is enforced |
| `API_KEY` | `change-this-api-key` | The API key value |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `LLM_ENABLED` | `true` | Toggle LLM scoring on/off |
| `LLM_BASE_URL` | `http://llm:8080/v1` | OpenAI-compatible LLM endpoint |
| `LLM_MODEL` | `qwen2.5-1.5b-instruct-q4_k_m` | Model name to request |
| `LLM_TIMEOUT_SECONDS` | `45` | LLM request timeout |
| `MAX_UPLOAD_BYTES` | `15000000` | Max file upload size (15 MB) |
| `MAX_BATCH_CANDIDATES` | `200` | Max candidates per batch |
| `RANK_WEIGHT_LLM` | `0.70` | Weight for LLM score in final composite |
| `RANK_WEIGHT_HARD_SKILL` | `0.20` | Weight for hard skill match |
| `RANK_WEIGHT_EXPERIENCE` | `0.10` | Weight for experience match |
| `OVERCLAIM_PENALTY` | `1.0` | Points deducted from score when over-claiming is detected |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:8000` | Backend API base URL |
| `BACKEND_API_KEY` | `change-this-api-key` | API key sent to backend |
| `AUTH_SECRET` | — | NextAuth encryption secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | NextAuth callback URL |
| `DATABASE_URL` | `file:./dev.db` | Prisma SQLite path |

---

## API Reference

All backend endpoints are under `/api/v1`. Full interactive docs at `/docs` (Swagger UI).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/ready` | Readiness check (DB + cache) |
| `POST` | `/jobs` | Create a screening job |
| `GET` | `/jobs` | List jobs (paginated) |
| `GET` | `/jobs/{id}` | Get job details |
| `PATCH` | `/jobs/{id}/status` | Update status (open/closed/archived) |
| `DELETE` | `/jobs/{id}` | Delete job and all associated data |
| `POST` | `/jobs/{id}/screen/text` | Screen candidates from pasted text |
| `POST` | `/jobs/{id}/screen/upload` | Screen candidates from file uploads |
| `GET` | `/jobs/{id}/rankings` | Get ranked candidate list |
| `GET` | `/jobs/{id}/candidates` | List candidates for a job |
| `GET` | `/candidates/{id}` | Get single candidate detail |
| `POST` | `/frontend/screening/text` | One-shot: create job + screen + rank (text) |
| `POST` | `/frontend/screening/upload` | One-shot: create job + screen + rank (files) |
| `GET` | `/analytics/bias-report` | Bias analytics report |

All endpoints require the `X-API-Key` header when `API_KEY_REQUIRED=true`.

---

## Scoring System

### Hybrid Mode (LLM enabled)

```
fit_score = (0.70 × LLM_score) + (0.20 × hard_skill_score) + (0.10 × experience_score)

If over-claiming detected:
  fit_score -= 1.0
```

The LLM (Qwen 2.5 1.5B) acts as a "recruiter evaluator" — it reads the full JD and resume, returns a structured JSON with a fit score, identified skills, over-claiming flags, and written reasoning.

### Heuristic-Only Mode (LLM disabled)

```
heuristic_score = (0.50 × hard_skill) + (0.30 × experience) + (0.20 × lexical_similarity)
```

### Component Score Details

| Score | How It's Calculated |
|-------|-------------------|
| **Hard Skill** | `(JD skills ∩ Resume skills) / JD skills × 10` — matched against 48 known skills |
| **Experience** | `observed_years / required_years × 10` — regex-extracted from text |
| **Lexical Similarity** | Jaccard similarity of tokenized JD and resume × 10 |
| **LLM Judge** | Qwen 2.5 rates the match 0–10 based on full text analysis |

### Over-Claiming Detection

Flags are raised when:
- A candidate claims ≥8 years in a non-standard skill
- Seniority language (senior/staff/principal/expert) appears with ≤1 year of stated experience

### Caching

Scoring results are cached in Valkey/Redis by SHA-256 hash of (JD + resume text). Default TTL is 15 minutes. Identical resume-JD pairs skip re-computation.

---

## ML Pipeline

The `ml_pipeline/` directory contains training scripts for two fine-tuned models:

1. **Score Model** — predicts fit score (0–10 ordinal regression) from JD + resume text
2. **Skill Model** — extracts skills via NER token classification

### Running the Pipeline

```bash
cd backend
pip install -r requirements-ml.txt

# Full pipeline: generate data → train → evaluate → bias audit
python -m ml_pipeline.scripts.run_day2_pipeline --num-jobs 20 --candidates-per-job 5 --epochs 3

# Or run individual steps:
python -m ml_pipeline.scripts.generate_synthetic_dataset
python -m ml_pipeline.scripts.train_score_model
python -m ml_pipeline.scripts.train_skill_model
python -m ml_pipeline.scripts.evaluate_models
python -m ml_pipeline.scripts.run_bias_audit
python -m ml_pipeline.scripts.demo_inference
```

### Outputs

| Artifact | Path |
|----------|------|
| Training data | `ml_pipeline/data/train.jsonl`, `val.jsonl`, `test.jsonl` |
| Score model | `ml_pipeline/artifacts/score_model/` |
| Skill model | `ml_pipeline/artifacts/skill_model/` |
| Evaluation report | `ml_pipeline/reports/evaluation_report.md` |
| Bias audit | `ml_pipeline/reports/bias_audit_report.json` |
| Demo output | `ml_pipeline/reports/demo_inference.json` |

---

## Frontend Pages

| Route | Page |
|-------|------|
| `/login` | Sign in with email/password or Google |
| `/signup` | Create account |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password via token |
| `/dashboard` | Main dashboard |
| `/dashboard/resume-analyzer` | Single resume screening — paste JD + resume text |
| `/dashboard/bulk-upload` | Batch screening — upload multiple resume files |
| `/dashboard/jobs` | Jobs history — search, sort, delete past screenings |
| `/dashboard/jobs/[id]` | Job detail — full rankings, score breakdowns, delete |

The UI supports dark and light themes (toggle in sidebar), and displays the logged-in user's name from the NextAuth session.

---

## Testing

```bash
cd backend
pip install pytest pytest-asyncio httpx

# Run all tests
python -m pytest tests/ -v

# Specific test files
python -m pytest tests/test_api_flow.py -v
python -m pytest tests/test_services.py -v
python -m pytest tests/test_upload_and_limits.py -v
```

---

## License

This project is proprietary. All rights reserved.
