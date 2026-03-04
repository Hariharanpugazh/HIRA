// ─── Types matching backend Pydantic schemas ───

export interface ComponentScores {
  llm: number | null;
  heuristic: number;
  hard_skill: number;
  experience: number;
  lexical_similarity: number;
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface JobsListResponse {
  total: number;
  items: JobResponse[];
}

export interface CandidateTextInput {
  display_name: string;
  resume_text: string;
  source_filename?: string | null;
}

export interface CandidateResponse {
  id: string;
  job_id: string;
  display_name: string;
  source_filename: string | null;
  created_at: string;
}

export interface CandidateListResponse {
  total: number;
  items: CandidateResponse[];
}

export interface ScreeningResponse {
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
}

export interface BatchScreenResponse {
  job_id: string;
  processed_count: number;
  results: ScreeningResponse[];
}

export interface RankingListResponse {
  job_id: string;
  total: number;
  items: ScreeningResponse[];
}

export interface BiasReportResponse {
  total_evaluations: number;
  flagged_overclaim_ratio: number;
  avg_fit_score: number;
  generated_at: string;
}

export interface FrontendScreeningResponse {
  job: JobResponse;
  screening: BatchScreenResponse;
  rankings: RankingListResponse;
}

// ─── Request types for frontend → Next.js API routes ───

export interface ScreenTextRequest {
  title: string;
  description: string;
  candidates: CandidateTextInput[];
}

export interface ApiError {
  detail: string;
}
