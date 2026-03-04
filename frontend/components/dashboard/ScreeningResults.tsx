"use client";

import { useState } from "react";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Brain,
  BarChart3,
  Sparkles,
  Briefcase,
  Target,
  FileText,
} from "lucide-react";
import type { FrontendScreeningResponse, ScreeningResponse } from "@/lib/api-types";

// ─── Score bar ───

function ScoreBar({ label, value, max = 10 }: { label: string; value: number | null; max?: number }) {
  const pct = value != null ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--cn-muted)]">{label}</span>
        <span className="font-medium text-[var(--cn-text)]">
          {value != null ? `${value.toFixed(1)}/10` : "N/A"}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--cn-surface-3)]">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Candidate card ───

function CandidateCard({ result, rank }: { result: ScreeningResponse; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const score = result.fit_score; // 0–10 scale
  const tierColor =
    score >= 8
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : score >= 6
        ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
        : "text-red-400 bg-red-500/10 border-red-500/30";
  const tierLabel = score >= 8 ? "Strong Fit" : score >= 6 ? "Moderate Fit" : "Weak Fit";

  return (
    <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] overflow-hidden transition hover:border-[var(--cn-accent)]/40">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        {/* Rank badge */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--cn-surface-2)] font-bold text-[var(--cn-text)]">
          #{rank}
        </div>

        {/* Name + tier */}
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-[var(--cn-text)]">{result.display_name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${tierColor}`}>
              {score >= 8 ? <CheckCircle2 className="h-3 w-3" /> : score >= 6 ? <Target className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {tierLabel}
            </span>
            <span className="text-xs text-[var(--cn-muted)]">via {result.source}</span>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl font-bold text-[var(--cn-text)]">{score.toFixed(1)}<span className="text-sm font-normal text-[var(--cn-muted)]">/10</span></span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--cn-muted)]">Fit Score</span>
        </div>

        {/* Expand chevron */}
        <div className="ml-2 text-[var(--cn-muted)]">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--cn-border)] px-5 py-5 space-y-5">
          {/* Component scores */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
              <BarChart3 className="h-4 w-4 text-[var(--cn-accent)]" />
              Score Breakdown
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreBar label="LLM Judge" value={result.component_scores.llm} />
              <ScoreBar label="Heuristic" value={result.component_scores.heuristic} />
              <ScoreBar label="Hard Skills" value={result.component_scores.hard_skill} />
              <ScoreBar label="Experience" value={result.component_scores.experience} />
              <ScoreBar label="Lexical Similarity" value={result.component_scores.lexical_similarity} />
            </div>
          </div>

          {/* Skills */}
          {result.skills.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                <Sparkles className="h-4 w-4 text-[var(--cn-accent)]" />
                Skills Identified
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-block rounded-md bg-[var(--cn-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--cn-text)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Over-claiming flags */}
          {result.over_claiming_flags.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Over-Claiming Flags
              </h4>
              <ul className="space-y-1.5">
                {result.over_claiming_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-300/80">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Reasoning */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
              <Brain className="h-4 w-4 text-[var(--cn-accent)]" />
              AI Reasoning
            </h4>
            <p className="rounded-lg bg-[var(--cn-surface-2)] p-4 text-sm leading-relaxed text-[var(--cn-muted)]">
              {result.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main results component ───

interface ScreeningResultsProps {
  data: FrontendScreeningResponse;
  onReset?: () => void;
}

export function ScreeningResults({ data, onReset }: ScreeningResultsProps) {
  const { job, screening, rankings } = data;
  const items = rankings.items.length > 0 ? rankings.items : screening.results;

  const avgScore =
    items.length > 0 ? items.reduce((s, r) => s + r.fit_score, 0) / items.length : 0;
  const strongFit = items.filter((r) => r.fit_score >= 8.0).length;
  const flaggedCount = items.filter((r) => r.over_claiming_flags.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--cn-text)]">{job.title}</h2>
            <p className="mt-1 text-sm text-[var(--cn-muted)]">
              {screening.processed_count} candidate{screening.processed_count !== 1 ? "s" : ""} analyzed
            </p>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="rounded-lg bg-[var(--cn-surface-2)] px-4 py-2 text-sm font-medium text-[var(--cn-text)] hover:bg-[var(--cn-hover)] transition border border-[var(--cn-border)]"
            >
              New Analysis
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-[var(--cn-surface-2)] p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--cn-muted)]">
              <FileText className="h-3.5 w-3.5" />
              Total
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--cn-text)]">{items.length}</p>
          </div>
          <div className="rounded-lg bg-[var(--cn-surface-2)] p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--cn-muted)]">
              <BarChart3 className="h-3.5 w-3.5" />
              Avg Score
            </div>
            <p className="mt-1 text-2xl font-bold text-[var(--cn-text)]">{avgScore.toFixed(1)}<span className="text-sm font-normal text-[var(--cn-muted)]">/10</span></p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Trophy className="h-3.5 w-3.5" />
              Strong Fit
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{strongFit}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Flagged
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-400">{flaggedCount}</p>
          </div>
        </div>
      </div>

      {/* Rankings list */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--cn-accent)]" />
          <h3 className="text-lg font-semibold text-[var(--cn-text)]">Rankings</h3>
        </div>
        <div className="space-y-3">
          {items.map((result, idx) => (
            <CandidateCard key={result.screening_id} result={result} rank={result.rank ?? idx + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
