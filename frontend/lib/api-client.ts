/**
 * Server-side API client for calling the FastAPI backend.
 * Used exclusively inside Next.js API routes (server-side only).
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.BACKEND_API_KEY || "change-this-api-key";

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    "X-API-Key": API_KEY,
    ...extra,
  };
}

function jsonHeaders(): Record<string, string> {
  return headers({ "Content-Type": "application/json" });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    let detail: string;
    try {
      detail = JSON.parse(body).detail ?? body;
    } catch {
      detail = body;
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ─── Jobs ───

export async function createJob(title: string, description: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/jobs`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ title, description }),
  });
  return handleResponse(res);
}

export async function listJobs(limit = 20, offset = 0) {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/jobs?limit=${limit}&offset=${offset}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function getJob(jobId: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`, {
    headers: headers(),
  });
  return handleResponse(res);
}

export async function updateJobStatus(jobId: string, status: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}/status`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function deleteJob(jobId: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

// ─── Screening (text) ───

export async function frontendScreeningText(
  title: string,
  description: string,
  candidates: { display_name: string; resume_text: string; source_filename?: string | null }[]
) {
  const res = await fetch(`${BACKEND_URL}/api/v1/frontend/screening/text`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ title, description, candidates }),
  });
  return handleResponse(res);
}

// ─── Screening (upload) ───

export async function frontendScreeningUpload(
  title: string,
  description: string,
  resumes: File[]
) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  for (const file of resumes) {
    formData.append("resumes", file);
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/frontend/screening/upload`, {
    method: "POST",
    headers: headers(), // no Content-Type — let fetch set boundary
    body: formData,
  });
  return handleResponse(res);
}

// ─── Rankings ───

export async function getJobRankings(jobId: string, limit = 100, offset = 0) {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/jobs/${jobId}/rankings?limit=${limit}&offset=${offset}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

// ─── Candidates ───

export async function getCandidate(candidateId: string) {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/candidates/${candidateId}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

export async function listCandidates(jobId: string, limit = 50, offset = 0) {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/jobs/${jobId}/candidates?limit=${limit}&offset=${offset}`,
    { headers: headers() }
  );
  return handleResponse(res);
}

// ─── Analytics ───

export async function getBiasReport(jobId?: string) {
  const qs = jobId ? `?job_id=${jobId}` : "";
  const res = await fetch(
    `${BACKEND_URL}/api/v1/analytics/bias-report${qs}`,
    { headers: headers() }
  );
  return handleResponse(res);
}
