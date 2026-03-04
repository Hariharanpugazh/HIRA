"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2, File, Zap, Shield, Info, X, FileText } from "lucide-react";
import type { FrontendScreeningResponse } from "@/lib/api-types";
import { ScreeningResults } from "./ScreeningResults";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB per file
const MAX_FILES = 200;
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".doc", ".docx"];

export function BulkUploadAnalyzer() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<FrontendScreeningResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `"${file.name}" has unsupported format. Use: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }
    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const incoming = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const f of incoming) {
      const err = validateFile(f);
      if (err) errors.push(err);
      else validFiles.push(f);
    }

    if (files.length + validFiles.length > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files allowed.`);
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    } else {
      setError(null);
    }

    setFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Please upload at least one resume file.");
      return;
    }
    if (!jobTitle.trim() || jobTitle.trim().length < 3) {
      setError("Job title must be at least 3 characters.");
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 30) {
      setError("Job description must be at least 30 characters.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", jobTitle.trim());
      formData.append("description", jobDescription.trim());
      for (const file of files) {
        formData.append("resumes", file);
      }

      const res = await fetch("/api/screening/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Bulk analysis failed. Please try again.");
        return;
      }

      setResults(data as FrontendScreeningResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Is the backend running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setFiles([]);
    setJobTitle("");
    setJobDescription("");
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--cn-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--cn-border)] bg-[var(--cn-surface)] px-6 py-4">
        <h1 className="text-2xl font-bold text-[var(--cn-text)]">Bulk Upload Analyzer</h1>
        <p className="mt-1 text-sm text-[var(--cn-muted)]">
          Upload multiple resume files and analyze them against a job description
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {results ? (
            <ScreeningResults data={results} onReset={handleReset} />
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Section A - Job Info */}
              <div className="mb-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)]">
                    <span className="text-sm font-bold text-[var(--cn-text)]">A</span>
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--cn-text)]">Job Details</h2>
                </div>

                <div className="rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--cn-text)]">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-4 py-2.5 text-sm text-[var(--cn-text)] placeholder-[var(--cn-muted)] focus:border-[var(--cn-accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--cn-text)]">Job Description</label>
                    <textarea
                      placeholder="Paste the full job description here (minimum 30 characters)..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-4 py-3 text-sm text-[var(--cn-text)] placeholder-[var(--cn-muted)] focus:border-[var(--cn-accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section B - Upload Resumes */}
              <div className="mb-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)]">
                    <span className="text-sm font-bold text-[var(--cn-text)]">B</span>
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--cn-text)]">Upload Resumes</h2>
                </div>

                <div className="rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] overflow-hidden">
                  <div className="p-8">
                    {/* Drop zone */}
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="block cursor-pointer group"
                    >
                      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[var(--cn-border)] px-8 py-12 transition group-hover:bg-[var(--cn-hover)] group-hover:border-[var(--cn-accent)]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--cn-surface-2)] group-hover:bg-[var(--cn-surface-3)] transition">
                          <Upload className="h-8 w-8 text-[var(--cn-accent)]" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[var(--cn-text)]">
                            Drag and drop resume files here
                          </p>
                          <p className="text-sm text-[var(--cn-muted)] mt-1">
                            or click to browse — select multiple files at once
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs text-[var(--cn-muted)] bg-[var(--cn-surface-2)] px-3 py-1.5 rounded-lg">
                          <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                          PDF, DOCX, DOC, TXT • Max 15 MB each • Up to {MAX_FILES} files
                        </div>
                      </div>
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        multiple
                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                        className="hidden"
                      />
                    </label>

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[var(--cn-text)]">
                            {files.length} file{files.length !== 1 ? "s" : ""} selected
                          </p>
                          <button
                            onClick={() => { setFiles([]); setError(null); }}
                            className="text-xs text-[var(--cn-muted)] hover:text-[var(--cn-text)] transition"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
                          {files.map((f, idx) => (
                            <div
                              key={`${f.name}-${idx}`}
                              className="flex items-center gap-3 rounded-lg bg-[var(--cn-surface)] px-3 py-2"
                            >
                              <FileText className="h-4 w-4 flex-shrink-0 text-[var(--cn-accent)]" />
                              <span className="flex-1 truncate text-sm text-[var(--cn-text)]">{f.name}</span>
                              <span className="flex-shrink-0 text-xs text-[var(--cn-muted)]">
                                {(f.size / 1024).toFixed(0)} KB
                              </span>
                              <button
                                onClick={() => removeFile(idx)}
                                className="flex-shrink-0 rounded p-0.5 text-[var(--cn-muted)] hover:text-red-400 transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analyze button */}
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || files.length === 0 || !jobTitle.trim() || !jobDescription.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[var(--cn-accent)] px-8 py-3 font-semibold text-[var(--cn-accent-fg)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-5 w-5" />
                  {isAnalyzing
                    ? `Analyzing ${files.length} resume${files.length !== 1 ? "s" : ""}...`
                    : `Analyze ${files.length} Resume${files.length !== 1 ? "s" : ""}`}
                </button>
              </div>

              {/* Tips */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                    <File className="h-4 w-4 text-[var(--cn-accent)]" />
                    Supported Formats
                  </h4>
                  <ul className="space-y-2.5">
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                      <span><strong>PDF</strong> — Standard resume format</span>
                    </li>
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                      <span><strong>DOCX/DOC</strong> — Word documents</span>
                    </li>
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                      <span><strong>TXT</strong> — Plain text resumes</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                    <Shield className="h-4 w-4 text-[var(--cn-accent)]" />
                    Limits
                  </h4>
                  <ul className="space-y-2.5">
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                      <span><strong>Max files:</strong> {MAX_FILES} per batch</span>
                    </li>
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                      <span><strong>Max size:</strong> 15 MB per file</span>
                    </li>
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">•</span>
                      <span>All resumes screened against same JD</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--cn-text)]">
                    <Info className="h-4 w-4 text-[var(--cn-accent)]" />
                    How It Works
                  </h4>
                  <ul className="space-y-2.5">
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">1.</span>
                      <span>Enter job title &amp; description</span>
                    </li>
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">2.</span>
                      <span>Upload candidate resume files</span>
                    </li>
                    <li className="flex gap-2 text-xs text-[var(--cn-muted)]">
                      <span className="flex-shrink-0 text-[var(--cn-accent)] font-bold">3.</span>
                      <span>AI ranks &amp; scores all candidates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
