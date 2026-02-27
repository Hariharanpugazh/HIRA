"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardTopBar } from "./DashboardTopBar";
import { useDashboard } from "./DashboardProvider";

export const workspaceTabs = ["models", "prompts", "tools", "functions", "skills", "knowledge"] as const;
export type WorkspaceTabValue = (typeof workspaceTabs)[number];
const workspaceRouteByTab: Record<WorkspaceTabValue, string> = {
  models: "/dashboard/workspace/models",
  prompts: "/dashboard/workspace/prompts",
  tools: "/dashboard/workspace/tools",
  functions: "/dashboard/workspace/functions",
  skills: "/dashboard/workspace/skills",
  knowledge: "/dashboard/workspace/knowledge"
};

interface WorkspacePageViewProps {
  initialTab?: WorkspaceTabValue;
  lockTab?: boolean;
}

export function WorkspacePageView({ initialTab = "models", lockTab = false }: WorkspacePageViewProps) {
  const router = useRouter();
  const { state, actions } = useDashboard();
  const [tab, setTab] = useState<WorkspaceTabValue>(initialTab);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    if (tab === "models") {
      actions.addModel({ name, provider: "Custom", description, supportsTools: true });
    }
    if (tab === "prompts") {
      actions.addPromptTemplate({ title: name, prompt: description, category: "custom" });
    }
    if (tab === "tools") {
      actions.addToolServer({ name, description, scope: "workspace" });
    }
    if (tab === "functions") {
      actions.addWorkspaceFunction({ name, description });
    }
    if (tab === "skills") {
      actions.addWorkspaceSkill({ name, description });
    }
    if (tab === "knowledge") {
      actions.addKnowledgeSource({ name, description, type: "docs" });
    }

    setName("");
    setDescription("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardTopBar title="Workspace" subtitle="Manage models, prompts, tools, functions, skills, and knowledge" />

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        {!lockTab ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {workspaceTabs.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => {
                  setTab(entry);
                  router.push(workspaceRouteByTab[entry]);
                }}
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] transition ${tab === entry
                    ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)]"
                    : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                  }`}
              >
                {entry}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_360px]">
          <section className="min-h-0 overflow-y-auto rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
            {tab === "models" &&
              state.models.map((model) => (
                <AssetRow
                  key={model.id}
                  title={model.name}
                  description={`${model.provider} · ${model.connectionType} · ${model.contextWindow.toLocaleString()} tokens`}
                  actions={
                    <>
                      <MiniButton
                        label={state.selectedModelId === model.id ? "Active" : "Use"}
                        onClick={() => actions.setSelectedModel(model.id)}
                        active={state.selectedModelId === model.id}
                      />
                      <MiniButton
                        label={state.defaultModelId === model.id ? "Default" : "Set Default"}
                        onClick={() => actions.setDefaultModel(model.id)}
                        active={state.defaultModelId === model.id}
                      />
                      <MiniButton
                        label={model.pinned ? "Unpin" : "Pin"}
                        onClick={() => actions.togglePinModel(model.id)}
                        active={model.pinned}
                      />
                      <MiniButton
                        label={model.hidden ? "Show" : "Hide"}
                        onClick={() => actions.setModelHidden(model.id, !model.hidden)}
                        active={model.hidden}
                      />
                      <MiniButton label="Delete" tone="danger" onClick={() => actions.removeModel(model.id)} />
                    </>
                  }
                />
              ))}

            {tab === "prompts" &&
              state.promptTemplates.map((template) => (
                <AssetRow
                  key={template.id}
                  title={template.title}
                  description={template.prompt}
                  actions={
                    <>
                      <MiniButton
                        label="Run"
                        onClick={() => {
                          const chatId = actions.createChat({ title: template.title });
                          actions.sendMessage(template.prompt);
                          router.push(`/dashboard/c/${chatId}`);
                        }}
                      />
                      <MiniButton
                        label="Delete"
                        tone="danger"
                        onClick={() => actions.deletePromptTemplate(template.id)}
                      />
                    </>
                  }
                />
              ))}

            {tab === "tools" &&
              state.toolServers.map((tool) => (
                <AssetRow
                  key={tool.id}
                  title={tool.name}
                  description={tool.description}
                  actions={
                    <>
                      <MiniButton
                        label={tool.enabled ? "Enabled" : "Disabled"}
                        onClick={() => actions.toggleToolServer(tool.id)}
                        active={tool.enabled}
                      />
                      <MiniButton label="Delete" tone="danger" onClick={() => actions.deleteToolServer(tool.id)} />
                    </>
                  }
                />
              ))}

            {tab === "functions" &&
              state.workspaceFunctions.map((entry) => (
                <AssetRow
                  key={entry.id}
                  title={entry.name}
                  description={entry.description}
                  actions={
                    <>
                      <MiniButton
                        label={entry.enabled ? "Enabled" : "Disabled"}
                        onClick={() => actions.toggleWorkspaceFunction(entry.id)}
                        active={entry.enabled}
                      />
                      <MiniButton
                        label="Delete"
                        tone="danger"
                        onClick={() => actions.deleteWorkspaceFunction(entry.id)}
                      />
                    </>
                  }
                />
              ))}

            {tab === "skills" &&
              state.workspaceSkills.map((entry) => (
                <AssetRow
                  key={entry.id}
                  title={entry.name}
                  description={entry.description}
                  actions={
                    <>
                      <MiniButton
                        label={entry.enabled ? "Enabled" : "Disabled"}
                        onClick={() => actions.toggleWorkspaceSkill(entry.id)}
                        active={entry.enabled}
                      />
                      <MiniButton
                        label="Delete"
                        tone="danger"
                        onClick={() => actions.deleteWorkspaceSkill(entry.id)}
                      />
                    </>
                  }
                />
              ))}

            {tab === "knowledge" &&
              state.knowledgeSources.map((entry) => (
                <AssetRow
                  key={entry.id}
                  title={entry.name}
                  description={`${entry.type} · ${entry.description}`}
                  actions={
                    <>
                      <MiniButton
                        label={entry.enabled ? "Enabled" : "Disabled"}
                        onClick={() => actions.toggleKnowledgeSource(entry.id)}
                        active={entry.enabled}
                      />
                      <MiniButton
                        label="Delete"
                        tone="danger"
                        onClick={() => actions.deleteKnowledgeSource(entry.id)}
                      />
                    </>
                  }
                />
              ))}
          </section>

          <aside className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
            <h3 className="text-sm font-semibold text-[var(--cn-text)]">Add {tab.slice(0, 1).toUpperCase() + tab.slice(1)}</h3>
            <form onSubmit={submit} className="mt-3 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 text-sm text-[var(--cn-text)] outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-24 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-2 text-sm text-[var(--cn-text)] outline-none"
                />
              </label>
              <button
                type="submit"
                className="h-10 w-full rounded-lg bg-[var(--cn-accent)] text-sm font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
              >
                Add
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AssetRow({
  title,
  description,
  actions
}: {
  title: string;
  description: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="mb-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-3)] p-3">
      <div className="text-sm font-medium text-[var(--cn-text)]">{title}</div>
      <div className="mt-1 text-xs text-[var(--cn-muted)]">{description}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">{actions}</div>
    </div>
  );
}

function MiniButton({
  label,
  onClick,
  tone = "default",
  active = false
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs transition ${tone === "danger"
          ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
          : active
            ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)]"
            : "bg-[var(--cn-surface)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
        }`}
    >
      {label}
    </button>
  );
}


