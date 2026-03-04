"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  X,
} from "lucide-react";
import type {
  JobResponse,
  RankingListResponse,
  FrontendScreeningResponse,
} from "@/lib/api-types";
import { ScreeningResults } from "@/components/dashboard/ScreeningResults";

/* ─── Relative time ─── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; bg: string; text: string }> = {
    open: { dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    closed: { dot: "bg-gray-400", bg: "bg-gray-500/10", text: "text-gray-400" },
    archived: { dot: "bg-amber-400", bg: "bg-amber-500/10", text: "text-amber-400" },
  };
  const s = config[status] ?? config.open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

/* ─── Delete confirmation modal ─── */
function DeleteModal({
  jobTitle,
  onConfirm,
  onCancel,
  deleting,
}: {
  jobTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-6 shadow-2xl mx-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--cn-text)]">Delete Job</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--cn-muted)]">
              Are you sure you want to delete <span className="font-semibold text-[var(--cn-text)]">&ldquo;{jobTitle}&rdquo;</span>? All candidate screenings and rankings will be permanently removed.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={deleting} className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)] border border-[var(--cn-border)] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {deleting ? <><RefreshCw className="h-4 w-4 animate-spin" />Deleting…</> : <><Trash2 className="h-4 w-4" />Delete Job</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FrontendScreeningResponse | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobRes, rankRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}`),
          fetch(`/api/jobs/${jobId}/rankings`),
        ]);

        if (!jobRes.ok) {
          const e = await jobRes.json();
          throw new Error(e.detail || "Failed to load job");
        }
        if (!rankRes.ok) {
          const e = await rankRes.json();
          throw new Error(e.detail || "Failed to load rankings");
        }

        const job: JobResponse = await jobRes.json();
        const rankings: RankingListResponse = await rankRes.json();

        setData({
          job,
          screening: {
            job_id: job.id,
            processed_count: rankings.total,
            results: rankings.items,
          },
          rankings,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Delete failed");
      }
      router.push("/dashboard/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--cn-bg)]">
      {/* Top navigation bar */}
      <div className="border-b border-[var(--cn-border)] bg-[var(--cn-surface)] px-6 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/jobs")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>

          {data && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[var(--cn-muted-2)] transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cn-surface)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cn-accent)]" />
              </div>
              <p className="mt-4 text-sm text-[var(--cn-muted)]">Loading job details…</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="flex-1 text-sm text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="rounded-lg p-1 text-red-400/60 hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Job detail */}
          {data && (
            <div className="space-y-6">
              {/* Job info header */}
              <div className="rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--cn-accent-soft)]">
                      <Briefcase className="h-6 w-6 text-[var(--cn-accent-fg)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-xl font-bold text-[var(--cn-text)]">{data.job.title}</h1>
                        <StatusBadge status={data.job.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 text-sm text-[var(--cn-muted)]">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(data.job.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-[var(--cn-muted)]">
                          <Clock className="h-3.5 w-3.5" />
                          {timeAgo(data.job.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable description */}
                  {data.job.description && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowDescription(!showDescription)}
                        className="flex items-center gap-1.5 text-sm font-medium text-[var(--cn-accent-fg)] transition hover:text-[var(--cn-accent-light)]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {showDescription ? "Hide" : "View"} job description
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDescription ? "rotate-180" : ""}`} />
                      </button>
                      {showDescription && (
                        <div className="mt-3 rounded-xl bg-[var(--cn-surface-2)] p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--cn-muted)]">
                            {data.job.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Screening results */}
              <ScreeningResults
                data={data}
                onReset={() => router.push("/dashboard/jobs")}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && data && (
        <DeleteModal
          jobTitle={data.job.title}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
