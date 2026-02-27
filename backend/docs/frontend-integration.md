# Frontend Integration Guide (Production)

This document defines the final API contract for integrating a Next.js frontend with the Recruiter Brain backend.

## 1. Base Configuration

- Base URL: `http://localhost:8000`
- API prefix: `/api/v1`
- Auth header: `X-API-Key: <your-api-key>`
- Content type:
  - JSON endpoints: `application/json`
  - Upload endpoint: `multipart/form-data`

If `API_KEY_REQUIRED=true`, every endpoint below except `/api/v1/health` requires `X-API-Key`.

## 2. Endpoints

## 2.1 Create Job

- Method: `POST`
- URL: `/api/v1/jobs`

Request:
```json
{
  "title": "Senior Backend Engineer",
  "description": "Need Python, FastAPI, PostgreSQL, Docker, AWS, and 5+ years backend experience."
}
```

Response:
```json
{
  "id": "job_uuid",
  "title": "Senior Backend Engineer",
  "description": "...",
  "status": "open",
  "created_at": "2026-02-27T12:00:00Z",
  "updated_at": "2026-02-27T12:00:00Z"
}
```

## 2.2 List Jobs

- Method: `GET`
- URL: `/api/v1/jobs?limit=20&offset=0`

Response:
```json
{
  "total": 1,
  "items": [
    {
      "id": "job_uuid",
      "title": "Senior Backend Engineer",
      "description": "...",
      "status": "open",
      "created_at": "2026-02-27T12:00:00Z",
      "updated_at": "2026-02-27T12:00:00Z"
    }
  ]
}
```

## 2.3 Update Job Status

- Method: `PATCH`
- URL: `/api/v1/jobs/{job_id}/status`

Request:
```json
{
  "status": "closed"
}
```

Allowed values:
- `open`
- `closed`
- `archived`

## 2.4 Screen Candidates from Text

- Method: `POST`
- URL: `/api/v1/jobs/{job_id}/screen/text`

Request:
```json
{
  "candidates": [
    {
      "display_name": "Candidate A",
      "resume_text": "5 years Python, FastAPI, Docker, AWS...",
      "source_filename": "candidate_a.txt"
    },
    {
      "display_name": "Candidate B",
      "resume_text": "3 years Node.js and React...",
      "source_filename": "candidate_b.txt"
    }
  ]
}
```

Response:
```json
{
  "job_id": "job_uuid",
  "processed_count": 2,
  "results": [
    {
      "screening_id": "screening_uuid",
      "job_id": "job_uuid",
      "candidate_id": "candidate_uuid",
      "display_name": "Candidate A",
      "fit_score": 8.7,
      "rank": 1,
      "source": "hybrid_llm_heuristic",
      "skills": ["python", "fastapi", "docker", "aws"],
      "over_claiming_flags": [],
      "component_scores": {
        "llm": 8.9,
        "heuristic": 8.3,
        "hard_skill": 9.0,
        "experience": 8.0,
        "lexical_similarity": 7.4
      },
      "reasoning": "LLM: ... | Heuristic: ...",
      "created_at": "2026-02-27T12:00:00Z",
      "updated_at": "2026-02-27T12:00:00Z"
    }
  ]
}
```

## 2.5 Screen Candidates from File Upload

- Method: `POST`
- URL: `/api/v1/jobs/{job_id}/screen/upload`
- Body: multipart form with repeated field `resumes`

Allowed file formats:
- `.pdf`
- `.docx`
- plain text files

`curl` example:
```bash
curl -X POST "http://localhost:8000/api/v1/jobs/<job_id>/screen/upload" \
  -H "X-API-Key: <api_key>" \
  -F "resumes=@/path/resume1.pdf" \
  -F "resumes=@/path/resume2.docx"
```

## 2.6 List Candidates in a Job

- Method: `GET`
- URL: `/api/v1/jobs/{job_id}/candidates?limit=50&offset=0`

## 2.7 Get Rankings for a Job

- Method: `GET`
- URL: `/api/v1/jobs/{job_id}/rankings?limit=100&offset=0`

Use this endpoint to render your ranking table. It already includes rank, scores, skills, and explanation.

## 2.8 Candidate Detail

- Method: `GET`
- URL: `/api/v1/candidates/{candidate_id}`

## 2.9 Analytics / Bias Summary

- Method: `GET`
- URL: `/api/v1/analytics/bias-report`
- Optional query: `job_id=<job_uuid>`

Response:
```json
{
  "total_evaluations": 32,
  "flagged_overclaim_ratio": 0.125,
  "avg_fit_score": 6.742,
  "generated_at": "2026-02-27T12:00:00Z"
}
```

## 2.10 One-Call Frontend Flow (Text)

- Method: `POST`
- URL: `/api/v1/frontend/screening/text`

Request:
```json
{
  "title": "Senior Backend Engineer",
  "description": "Need Python, FastAPI, PostgreSQL, Docker, AWS, and 5+ years backend experience.",
  "candidates": [
    {
      "display_name": "Candidate A",
      "resume_text": "5 years Python, FastAPI, Docker, AWS...",
      "source_filename": "candidate_a.txt"
    }
  ]
}
```

This single call:
1. Creates job
2. Screens candidates
3. Returns rankings

## 2.11 One-Call Frontend Flow (Upload)

- Method: `POST`
- URL: `/api/v1/frontend/screening/upload`
- Body: multipart form
  - `title`
  - `description`
  - repeated `resumes` files

## 3. Frontend TypeScript Contract

```ts
export type ComponentScores = {
  llm: number | null;
  heuristic: number;
  hard_skill: number;
  experience: number;
  lexical_similarity: number;
};

export type ScreeningResult = {
  screening_id: string;
  job_id: string;
  candidate_id: string;
  display_name: string;
  fit_score: number;
  rank: number | null;
  source: string;
  skills: string[];
  over_claiming_flags: string[];
  component_scores: ComponentScores;
  reasoning: string;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed" | "archived";
  created_at: string;
  updated_at: string;
};
```

## 4. Next.js API Client Example

```ts
const API_BASE = process.env.NEXT_PUBLIC_RECRUITER_API_BASE!;
const API_KEY = process.env.NEXT_PUBLIC_RECRUITER_API_KEY!;

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("X-API-Key", API_KEY);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

export async function createJob(payload: { title: string; description: string }) {
  return api<Job>("/api/v1/jobs", { method: "POST", body: JSON.stringify(payload) });
}

export async function screenFromText(jobId: string, candidates: Array<{ display_name: string; resume_text: string; source_filename?: string }>) {
  return api<{ job_id: string; processed_count: number; results: ScreeningResult[] }>(
    `/api/v1/jobs/${jobId}/screen/text`,
    { method: "POST", body: JSON.stringify({ candidates }) }
  );
}

export async function getRankings(jobId: string, limit = 100, offset = 0) {
  return api<{ job_id: string; total: number; items: ScreeningResult[] }>(
    `/api/v1/jobs/${jobId}/rankings?limit=${limit}&offset=${offset}`
  );
}

export async function runFrontendTextFlow(payload: {
  title: string;
  description: string;
  candidates: Array<{ display_name: string; resume_text: string; source_filename?: string }>;
}) {
  return api<{
    job: Job;
    screening: { job_id: string; processed_count: number; results: ScreeningResult[] };
    rankings: { job_id: string; total: number; items: ScreeningResult[] };
  }>("/api/v1/frontend/screening/text", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function runFrontendUploadFlow(form: FormData) {
  return api<{
    job: Job;
    screening: { job_id: string; processed_count: number; results: ScreeningResult[] };
    rankings: { job_id: string; total: number; items: ScreeningResult[] };
  }>("/api/v1/frontend/screening/upload", {
    method: "POST",
    body: form,
  });
}
```

## 5. Frontend UX Flow

1. User creates/selects a job.
2. User uploads resumes or pastes candidate text.
3. Frontend calls screening endpoint.
4. Frontend refreshes rankings endpoint.
5. User opens candidate detail drawer/page.
6. Frontend shows analytics panel from bias report endpoint.

This is the complete frontend-operable production flow; no backend manual intervention is required after deployment.
