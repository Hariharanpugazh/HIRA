"use client";

import { FormEvent, useMemo, useState } from "react";
import { DashboardTopBar } from "./DashboardTopBar";
import { useDashboard } from "./DashboardProvider";

const modes = ["chat", "completions", "images"] as const;
type PlaygroundMode = (typeof modes)[number];

interface PlaygroundPageViewProps {
  initialMode?: PlaygroundMode;
}

export function PlaygroundPageView({ initialMode = "chat" }: PlaygroundPageViewProps) {
  const { state, actions } = useDashboard();
  const [mode, setMode] = useState<PlaygroundMode>(initialMode);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  const selectedModel = useMemo(
    () => state.models.find((model) => model.id === state.selectedModelId) ?? state.models[0],
    [state.models, state.selectedModelId]
  );

  const run = (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) {
      return;
    }

    if (mode === "chat") {
      actions.sendMessage(text, { toolIds: [] });
      setResult("Message sent to active chat session.");
      return;
    }

    if (mode === "completions") {
      setResult([
        `Model: ${selectedModel?.name ?? "unknown"}`,
        "Completion preview:",
        `- ${text.slice(0, 180)}`,
        "- Deterministic preview mode is active in local state."
      ].join("\n"));
      return;
    }

    setResult([
      "Image generation preview:",
      `Prompt: ${text}`,
      "Output: Connector required for real image generation API."
    ].join("\n"));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardTopBar title="Playground" subtitle="Test chat, completions, and image prompts" />

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {modes.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setMode(entry)}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] transition ${mode === entry
                  ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)]"
                  : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                }`}
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
            <form onSubmit={run} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Mode</span>
                <input
                  readOnly
                  value={mode}
                  className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 text-sm text-[var(--cn-text)]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Model</span>
                <input
                  readOnly
                  value={selectedModel?.name ?? "None"}
                  className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 text-sm text-[var(--cn-text)]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Prompt</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="h-48 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-2 text-sm text-[var(--cn-text)] outline-none"
                />
              </label>

              <button
                type="submit"
                className="h-10 w-full rounded-lg bg-[var(--cn-accent)] text-sm font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
              >
                Run
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Output</div>
            <pre className="mt-2 h-[calc(100%-22px)] whitespace-pre-wrap rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] p-3 text-sm text-[var(--cn-text)]">
              {result || "Run a prompt to see output."}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}


