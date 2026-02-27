"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardTopBar } from "./DashboardTopBar";
import { useDashboard } from "./DashboardProvider";
import { ProjectFramework, ProjectStatus } from "./types";

const frameworkOptions: ProjectFramework[] = ["nextjs", "react-native", "flutter", "tauri", "fastapi"];
const statusOptions: ProjectStatus[] = ["idea", "planning", "building", "review", "deployed"];

export function ProjectsPageView() {
  const router = useRouter();
  const { state, actions } = useDashboard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState<ProjectFramework>("nextjs");

  const createProject = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    actions.createProject({
      name,
      description,
      framework
    });

    setName("");
    setDescription("");
    setFramework("nextjs");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardTopBar title="Projects" subtitle="Track generated products and route work into chat sessions" />

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_340px] sm:p-4">
        <section className="min-h-0 overflow-y-auto rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
          {state.projects.length === 0 ? (
            <div className="rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-2 text-sm text-[var(--cn-muted)]">
              No projects yet.
            </div>
          ) : null}

          {state.projects.map((project) => (
            <div key={project.id} className="mb-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-3)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-[var(--cn-text)]">{project.name}</div>
                  <div className="mt-1 text-xs text-[var(--cn-muted)]">{project.description || "No description"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const chatId = actions.createProjectChat(project.id);
                    router.push(`/dashboard/c/${chatId}`);
                  }}
                  className="h-8 rounded-lg bg-[var(--cn-accent)] px-3 text-xs font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
                >
                  Open Chat
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={project.status}
                  onChange={(event) => actions.updateProjectStatus(project.id, event.target.value as ProjectStatus)}
                  className="h-8 rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface)] px-2 text-xs text-[var(--cn-text)]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="rounded-full border border-[var(--cn-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--cn-muted)]">
                  {project.framework}
                </span>
                <button
                  type="button"
                  onClick={() => actions.setActiveProject(state.activeProjectId === project.id ? null : project.id)}
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] transition ${state.activeProjectId === project.id
                      ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)]"
                      : "bg-[var(--cn-surface)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                    }`}
                >
                  {state.activeProjectId === project.id ? "Filtered" : "Filter"}
                </button>
                <button
                  type="button"
                  onClick={() => actions.deleteProject(project.id)}
                  className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>

        <aside className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
          <h3 className="text-sm font-semibold text-[var(--cn-text)]">Create Project</h3>
          <form onSubmit={createProject} className="mt-3 space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 text-sm text-[var(--cn-text)] outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Framework</span>
              <select
                value={framework}
                onChange={(event) => setFramework(event.target.value as ProjectFramework)}
                className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 text-sm text-[var(--cn-text)] outline-none"
              >
                {frameworkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
              Create Project
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}


