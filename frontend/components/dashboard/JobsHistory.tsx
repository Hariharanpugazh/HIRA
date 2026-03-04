"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trash2,
  Search,
  X,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import type { JobsListResponse, JobResponse } from "@/lib/api-types";

/* ─── Status badge ─── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; bg: string; text: string }> = {
    open: { dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    closed: { dot: "bg-gray-400", bg: "bg-gray-500/10", text: "text-gray-400" },
    archived: { dot: "bg-amber-400", bg: "bg-amber-500/10", text: "text-amber-400" },
  };
  const style = config[status] ?? config.open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

/* ─── Delete confirmation modal ─── */

function DeleteModal({
  job,
  onConfirm,
  onCancel,
  deleting,
}: {
  job: JobResponse;
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
              Are you sure you want to delete <span className="font-semibold text-[var(--cn-text)]">&ldquo;{job.title}&rdquo;</span>? This will permanently remove the job and all associated candidate screenings. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)] border border-[var(--cn-border)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Job
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Relative time helper ─── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ─── Job card ─── */

function JobCard({
  job,
  onClick,
  onDelete,
}: {
  job: JobResponse;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const date = new Date(job.created_at);
  return (
    <div className="group relative rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] transition-all duration-200 hover:border-[var(--cn-accent)]/40 hover:shadow-lg hover:shadow-[var(--cn-accent)]/5">
      <button
        onClick={onClick}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        {/* Icon */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--cn-accent-soft)]">
          <Briefcase className="h-5 w-5 text-[var(--cn-accent-fg)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="truncate text-[15px] font-semibold text-[var(--cn-text)]">{job.title}</p>
            <StatusBadge status={job.status} />
          </div>
          <p className="mt-1.5 line-clamp-1 text-sm text-[var(--cn-muted)]">
            {job.description.slice(0, 150)}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-[var(--cn-muted-2)]">
              <Calendar className="h-3 w-3" />
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--cn-muted-2)]">
              <Clock className="h-3 w-3" />
              {timeAgo(job.created_at)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-[var(--cn-muted-2)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--cn-accent-fg)]" />
      </button>

      {/* Delete button (visible on hover) */}
      <button
        onClick={onDelete}
        className="absolute right-14 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--cn-muted-2)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        title="Delete job"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Skeleton loader ─── */

function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-[var(--cn-surface-2)]" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-48 animate-pulse rounded-lg bg-[var(--cn-surface-2)]" />
          <div className="h-3 w-72 animate-pulse rounded-lg bg-[var(--cn-surface-2)]" />
          <div className="flex gap-3">
            <div className="h-3 w-24 animate-pulse rounded-lg bg-[var(--cn-surface-2)]" />
            <div className="h-3 w-16 animate-pulse rounded-lg bg-[var(--cn-surface-2)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─── */

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--cn-surface-2)]">
        <Briefcase className="h-9 w-9 text-[var(--cn-muted-2)]" />
      </div>
      <p className="mt-5 text-lg font-semibold text-[var(--cn-text)]">
        {filtered ? "No matching jobs" : "No screening jobs yet"}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--cn-muted)]">
        {filtered
          ? "Try adjusting your search query or clear the filter."
          : "Head to Resume Analyzer or Bulk Upload to create your first screening job."}
      </p>
    </div>
  );
}

/* ─── Main component ─── */

export function JobsHistory() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<JobResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const limit = 20;

  const fetchJobs = useCallback(async (off: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs?limit=${limit}&offset=${off}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to load jobs.");
        return;
      }
      const result = data as JobsListResponse;
      setJobs(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(offset);
  }, [offset, fetchJobs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Delete failed");
      }
      setDeleteTarget(null);
      fetchJobs(offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job.");
    } finally {
      setDeleting(false);
    }
  };

  // Client-side search + sort
  const filteredJobs = jobs
    .filter((j) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDesc ? -diff : diff;
    });

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="flex flex-col h-full bg-[var(--cn-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--cn-border)] bg-[var(--cn-surface)] px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--cn-text)]">
                Jobs History
              </h1>
              <p className="mt-1 text-sm text-[var(--cn-muted)]">
                {total} screening job{total !== 1 ? "s" : ""} &middot; Manage and review past screenings
              </p>
            </div>
            <button
              onClick={() => fetchJobs(offset)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--cn-text)] transition-all hover:bg-[var(--cn-hover)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Search & Sort bar */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cn-muted-2)]" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title or description…"
                className="w-full rounded-xl border border-[var(--cn-border)] bg-[var(--cn-bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--cn-text)] placeholder:text-[var(--cn-muted-2)] transition focus:border-[var(--cn-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--cn-accent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--cn-muted-2)] hover:text-[var(--cn-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-bg)] px-4 py-2.5 text-sm text-[var(--cn-muted)] transition hover:text-[var(--cn-text)] hover:bg-[var(--cn-hover)]"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortDesc ? "Newest first" : "Oldest first"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-3">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="flex-1 text-sm text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="rounded-lg p-1 text-red-400/60 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState filtered={searchQuery.trim().length > 0} />
          ) : (
            <>
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  onDelete={(e) => { e.stopPropagation(); setDeleteTarget(job); }}
                />
              ))}

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between pt-6 pb-2">
                  <p className="text-sm text-[var(--cn-muted)]">
                    Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                      className="rounded-xl border border-[var(--cn-border)] px-4 py-2 text-sm font-medium text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="flex items-center gap-1 rounded-xl bg-[var(--cn-surface-2)] px-3.5 py-2 text-sm font-medium text-[var(--cn-text)]">
                      {currentPage} <span className="text-[var(--cn-muted-2)]">/</span> {totalPages}
                    </span>
                    <button
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                      className="rounded-xl border border-[var(--cn-border)] px-4 py-2 text-sm font-medium text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          job={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
