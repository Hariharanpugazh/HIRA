"use client";

import { useState } from "react";
import { Upload, FileText, Zap, AlertCircle } from "lucide-react";
import type { FrontendScreeningResponse } from "@/lib/api-types";
import { ScreeningResults } from "./ScreeningResults";

export function ResumeAnalyzerInput() {
  const [resume, setResume] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FrontendScreeningResponse | null>(null);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResume(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleJobDescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJobDescription(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError("Please fill in both resume and job description");
      return;
    }
    if (!jobTitle.trim()) {
      setError("Please provide a job title (at least 3 characters)");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/screening/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle.trim(),
          description: jobDescription.trim(),
          candidates: [
            {
              display_name: "Candidate",
              resume_text: resume.trim(),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Analysis failed. Please try again.");
        return;
      }

      setResults(data as FrontendScreeningResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Is the backend running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--cn-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--cn-border)] bg-[var(--cn-surface)] px-6 py-4">
        <h1 className="text-2xl font-bold text-[var(--cn-text)]">Resume Analyzer</h1>
        <p className="mt-1 text-sm text-[var(--cn-muted)]">
          Compare candidate resume with job description to get AI-powered insights
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Show results or input form */}
          {results ? (
            <ScreeningResults
              data={results}
              onReset={() => {
                setResults(null);
                setResume("");
                setJobTitle("");
                setJobDescription("");
              }}
            />
          ) : (
          <>
          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Section A - Input */}
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)]">
                <span className="text-sm font-bold text-[var(--cn-text)]">A</span>
              </div>
              <h2 className="text-lg font-semibold text-[var(--cn-text)]">Input</h2>
            </div>

            {/* Job Title */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-[var(--cn-text)]">
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-4 py-2.5 text-sm text-[var(--cn-text)] placeholder-[var(--cn-muted)] focus:border-[var(--cn-accent)] focus:outline-none"
              />
            </div>

            {/* Side-by-side Layout */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Resume Section */}
              <div className="flex flex-col rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)]">
                <div className="border-b border-[var(--cn-border)] px-6 py-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--cn-text)]">
                    <FileText className="h-5 w-5 text-[var(--cn-accent)]" />
                    Resume
                  </h3>
                  <p className="mt-1 text-xs text-[var(--cn-muted)]">
                    Paste or upload candidate's resume
                  </p>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {resume ? (
                    <div className="flex-1">
                      <div className="mb-4 rounded-lg bg-[var(--cn-surface-2)] p-4 max-h-96 overflow-y-auto">
                        <p className="whitespace-pre-wrap text-sm text-[var(--cn-text)] font-mono">
                          {resume}
                        </p>
                      </div>
                      <button
                        onClick={() => setResume("")}
                        className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[var(--cn-text)] bg-[var(--cn-surface-2)] hover:bg-[var(--cn-hover)] transition"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cn-surface-2)]">
                        <Upload className="h-6 w-6 text-[var(--cn-muted)]" />
                      </div>
                      <textarea
                        placeholder="Paste resume text here..."
                        value={resume}
                        onChange={(e) => setResume(e.target.value)}
                        className="flex-1 w-full resize-none rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-4 py-3 text-sm text-[var(--cn-text)] placeholder-[var(--cn-muted)] focus:border-[var(--cn-accent)] focus:outline-none"
                      />
                      <label className="w-full cursor-pointer">
                        <div className="rounded-lg border border-dashed border-[var(--cn-border)] px-4 py-3 text-center hover:bg-[var(--cn-hover)] transition">
                          <p className="text-xs text-[var(--cn-muted)]">
                            Or upload a file
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".txt,.pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description Section */}
              <div className="flex flex-col rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)]">
                <div className="border-b border-[var(--cn-border)] px-6 py-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--cn-text)]">
                    <FileText className="h-5 w-5 text-[var(--cn-accent)]" />
                    Job Description
                  </h3>
                  <p className="mt-1 text-xs text-[var(--cn-muted)]">
                    Paste or upload the job description
                  </p>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {jobDescription ? (
                    <div className="flex-1">
                      <div className="mb-4 rounded-lg bg-[var(--cn-surface-2)] p-4 max-h-96 overflow-y-auto">
                        <p className="whitespace-pre-wrap text-sm text-[var(--cn-text)] font-mono">
                          {jobDescription}
                        </p>
                      </div>
                      <button
                        onClick={() => setJobDescription("")}
                        className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[var(--cn-text)] bg-[var(--cn-surface-2)] hover:bg-[var(--cn-hover)] transition"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cn-surface-2)]">
                        <Upload className="h-6 w-6 text-[var(--cn-muted)]" />
                      </div>
                      <textarea
                        placeholder="Paste job description text here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="flex-1 w-full resize-none rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-4 py-3 text-sm text-[var(--cn-text)] placeholder-[var(--cn-muted)] focus:border-[var(--cn-accent)] focus:outline-none"
                      />
                      <label className="w-full cursor-pointer">
                        <div className="rounded-lg border border-dashed border-[var(--cn-border)] px-4 py-3 text-center hover:bg-[var(--cn-hover)] transition">
                          <p className="text-xs text-[var(--cn-muted)]">
                            Or upload a file
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".txt,.pdf,.doc,.docx"
                          onChange={handleJobDescriptionUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !resume.trim() || !jobDescription.trim() || !jobTitle.trim()}
              className="flex items-center gap-2 rounded-xl bg-[var(--cn-accent)] px-8 py-3 font-semibold text-[var(--cn-accent-fg)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-5 w-5" />
              {isAnalyzing ? "Analyzing..." : "Analyze Candidate"}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
