"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronDown,
  CircleDashed,
  Eye,
  EyeOff,
  Menu,
  Pin,
  PinOff,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import { ModelItem } from "./types";

interface DashboardTopBarProps {
  title?: string;
  subtitle?: string;
  showModelSelector?: boolean;
}

type ConnectionFilter = "all" | ModelItem["connectionType"];

const connectionFilterLabels: Record<ConnectionFilter, string> = {
  all: "All",
  local: "Local",
  external: "External",
  direct: "Direct"
};

export function DashboardTopBar({ title, subtitle, showModelSelector = true }: DashboardTopBarProps) {
  const router = useRouter();
  const { state, ui, derived, actions } = useDashboard();
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [showHiddenModels, setShowHiddenModels] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelProvider, setNewModelProvider] = useState("Custom");
  const [newModelDescription, setNewModelDescription] = useState("");
  const [newModelTags, setNewModelTags] = useState("custom");
  const [newModelConnectionType, setNewModelConnectionType] = useState<ModelItem["connectionType"]>("direct");

  const menuRef = useRef<HTMLDivElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setModelMenuOpen(false);
        setAddFormOpen(false);
      }
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node)) {
        setAgentMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModelMenuOpen(false);
        setAgentMenuOpen(false);
        setAddFormOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onEscape);
    };
  }, []); // Remove dependency so it runs once and handles both menus

  const initials = useMemo(() => {
    return state.profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [state.profile.name]);

  const allTags = useMemo(() => {
    const tags = state.models.flatMap((model) => model.tags ?? []);
    return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [state.models]);

  const filteredModels = useMemo(() => {
    const term = modelSearch.trim().toLowerCase();
    return [...state.models]
      .filter((model) => (showHiddenModels ? true : !model.hidden))
      .filter((model) => (connectionFilter === "all" ? true : model.connectionType === connectionFilter))
      .filter((model) =>
        tagFilter === "all" ? true : model.tags.map((tag) => tag.toLowerCase()).includes(tagFilter)
      )
      .filter((model) => {
        if (!term) {
          return true;
        }
        return (
          model.name.toLowerCase().includes(term) ||
          model.provider.toLowerCase().includes(term) ||
          model.description.toLowerCase().includes(term) ||
          model.tags.some((tag) => tag.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [state.models, showHiddenModels, connectionFilter, tagFilter, modelSearch]);

  const hiredAgents = useMemo(() => state.agents.filter((a) => a.hired), [state.agents]);
  const availableAgents = useMemo(() => state.agents.filter((a) => !a.hired), [state.agents]);

  const filteredHired = useMemo(() => hiredAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase())
  ), [hiredAgents, agentSearch]);

  const filteredAvailable = useMemo(() => availableAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase())
  ), [availableAgents, agentSearch]);

  const addModel = () => {
    const name = newModelName.trim();
    if (!name) {
      return;
    }

    const tags = newModelTags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    actions.addModel({
      name,
      provider: newModelProvider.trim() || "Custom",
      description: newModelDescription.trim() || "Custom model",
      supportsTools: true,
      connectionType: newModelConnectionType,
      tags: tags.length > 0 ? tags : ["custom"]
    });

    setNewModelName("");
    setNewModelProvider("Custom");
    setNewModelDescription("");
    setNewModelTags("custom");
    setNewModelConnectionType("direct");
    setAddFormOpen(false);
  };

  return (
    <header className="relative z-20 flex items-start justify-between gap-3 px-3 py-3 sm:px-5">
      <div className="flex min-w-0 items-start gap-2">
        <button
          type="button"
          onClick={actions.openMobileSidebar}
          className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)] md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        {showModelSelector ? (
          <div ref={menuRef} className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModelMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 text-[18px] font-medium text-[var(--cn-text)]"
              >
                <span>{derived.selectedModel.name}</span>
                <ChevronDown className="h-4 w-4 text-[var(--cn-muted)]" />
              </button>
              <button
                type="button"
                onClick={() => setAddFormOpen((current) => !current)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                aria-label="Add model"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => actions.setDefaultModel(derived.selectedModel.id)}
              className="mt-0.5 text-xs text-[var(--cn-muted)] transition hover:text-[var(--cn-text)]"
            >
              {state.defaultModelId === derived.selectedModel.id ? "Default model" : "Set as default"}
            </button>

            {modelMenuOpen ? (
              <div className="absolute left-0 top-full z-30 mt-2 w-[420px] max-w-[calc(100vw-1.75rem)] rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-2">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] px-3 py-2">
                  <Search className="h-4 w-4 text-[var(--cn-muted)]" />
                  <input
                    value={modelSearch}
                    onChange={(event) => setModelSearch(event.target.value)}
                    placeholder="Search models"
                    className="h-6 w-full bg-transparent text-sm text-[var(--cn-text)] outline-none placeholder:text-[var(--cn-muted)]"
                  />
                </div>

                <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hidden">
                  {(Object.keys(connectionFilterLabels) as ConnectionFilter[]).map((filterValue) => (
                    <button
                      key={filterValue}
                      type="button"
                      onClick={() => setConnectionFilter(filterValue)}
                      className={`rounded-full px-2.5 py-1 text-[11px] transition ${connectionFilter === filterValue
                        ? "bg-[var(--cn-surface-2)] text-[var(--cn-text)]"
                        : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                        }`}
                    >
                      {connectionFilterLabels[filterValue]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowHiddenModels((current) => !current)}
                    className={`rounded-full px-2.5 py-1 text-[11px] transition ${showHiddenModels
                      ? "bg-[var(--cn-surface-2)] text-[var(--cn-text)]"
                      : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                      }`}
                  >
                    {showHiddenModels ? "Including hidden" : "Visible only"}
                  </button>
                </div>

                {allTags.length > 0 ? (
                  <div className="mt-1 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hidden">
                    <button
                      type="button"
                      onClick={() => setTagFilter("all")}
                      className={`rounded-full px-2 py-0.5 text-[11px] transition ${tagFilter === "all"
                        ? "bg-[var(--cn-surface-2)] text-[var(--cn-text)]"
                        : "text-[var(--cn-muted)] hover:bg-[var(--cn-surface-3)] hover:text-[var(--cn-text)]"
                        }`}
                    >
                      all
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagFilter(tag)}
                        className={`rounded-full px-2 py-0.5 text-[11px] transition ${tagFilter === tag
                          ? "bg-[var(--cn-surface-2)] text-[var(--cn-text)]"
                          : "text-[var(--cn-muted)] hover:bg-[var(--cn-surface-3)] hover:text-[var(--cn-text)]"
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2 max-h-64 overflow-y-auto pr-1">
                  {filteredModels.length === 0 ? (
                    <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-2 text-sm text-[var(--cn-muted)]">
                      No models found.
                    </div>
                  ) : null}

                  {filteredModels.map((model) => {
                    const active = model.id === state.selectedModelId;
                    const isDefault = model.id === state.defaultModelId;
                    return (
                      <div
                        key={model.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          actions.setSelectedModel(model.id);
                          setModelMenuOpen(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            actions.setSelectedModel(model.id);
                            setModelMenuOpen(false);
                          }
                        }}
                        className={`mb-1 block w-full rounded-xl border px-3 py-2 text-left transition ${active
                          ? "border-[var(--cn-accent)] bg-[var(--cn-surface)] text-[var(--cn-text)]"
                          : "border-[var(--cn-border)] bg-[var(--cn-surface)] text-[var(--cn-text)] hover:bg-[var(--cn-hover)]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium">{model.name}</span>
                              {isDefault ? (
                                <span className="rounded-full border border-[var(--cn-border)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[var(--cn-muted)]">
                                  default
                                </span>
                              ) : null}
                              {model.pinned ? (
                                <span className="rounded-full border border-[var(--cn-border)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[var(--cn-muted)]">
                                  pinned
                                </span>
                              ) : null}
                              {model.hidden ? (
                                <span className="rounded-full border border-[var(--cn-border)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[var(--cn-muted)]">
                                  hidden
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--cn-muted)]">
                              {model.provider} · {model.connectionType}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs text-[var(--cn-muted)]">{model.description}</div>
                            {model.tags.length > 0 ? (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {model.tags.slice(0, 4).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-[var(--cn-border)] px-1.5 py-0.5 text-[10px] text-[var(--cn-muted)]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="ml-2 flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                actions.togglePinModel(model.id);
                              }}
                              className="rounded-md p-1 text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                              aria-label={model.pinned ? "Unpin model" : "Pin model"}
                            >
                              {model.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                actions.setModelHidden(model.id, !model.hidden);
                              }}
                              className="rounded-md p-1 text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                              aria-label={model.hidden ? "Show model" : "Hide model"}
                            >
                              {model.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                actions.removeModel(model.id);
                              }}
                              className="rounded-md p-1 text-[var(--cn-muted)] transition hover:bg-red-500/10 hover:text-red-300"
                              aria-label="Delete model"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {addFormOpen ? (
              <div className="absolute left-0 top-full z-30 mt-2 w-[420px] max-w-[calc(100vw-1.75rem)] rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">
                  Add Model
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-xs text-[var(--cn-muted)]">Name</span>
                    <input
                      value={newModelName}
                      onChange={(event) => setNewModelName(event.target.value)}
                      className="h-9 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-2.5 text-sm text-[var(--cn-text)] outline-none"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs text-[var(--cn-muted)]">Provider</span>
                    <input
                      value={newModelProvider}
                      onChange={(event) => setNewModelProvider(event.target.value)}
                      className="h-9 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-2.5 text-sm text-[var(--cn-text)] outline-none"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs text-[var(--cn-muted)]">Connection</span>
                    <select
                      value={newModelConnectionType}
                      onChange={(event) => setNewModelConnectionType(event.target.value as ModelItem["connectionType"])}
                      className="h-9 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-2.5 text-sm text-[var(--cn-text)] outline-none"
                    >
                      <option value="direct">Direct</option>
                      <option value="external">External</option>
                      <option value="local">Local</option>
                    </select>
                  </label>

                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-xs text-[var(--cn-muted)]">Description</span>
                    <input
                      value={newModelDescription}
                      onChange={(event) => setNewModelDescription(event.target.value)}
                      className="h-9 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-2.5 text-sm text-[var(--cn-text)] outline-none"
                    />
                  </label>

                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-xs text-[var(--cn-muted)]">Tags (comma separated)</span>
                    <input
                      value={newModelTags}
                      onChange={(event) => setNewModelTags(event.target.value)}
                      className="h-9 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-2.5 text-sm text-[var(--cn-text)] outline-none"
                    />
                  </label>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddFormOpen(false)}
                    className="h-8 rounded-lg border border-[var(--cn-border)] px-3 text-xs font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addModel}
                    className="h-8 rounded-lg bg-[var(--cn-accent)] px-3 text-xs font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
                  >
                    Add Model
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-[var(--cn-text)]">{title}</h1>
            {subtitle ? <p className="text-sm text-[var(--cn-muted)]">{subtitle}</p> : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div ref={agentMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setAgentMenuOpen((prev) => !prev)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--cn-hover)] ${agentMenuOpen ? "bg-[var(--cn-hover)] text-[var(--cn-text)]" : "text-[var(--cn-muted)] hover:text-[var(--cn-text)]"}`}
            aria-label="Team of Agents"
            title="Team of Agents"
          >
            <Bot className="h-4 w-4" />
          </button>

          {agentMenuOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-[340px] max-w-[calc(100vw-1.75rem)] rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-2 shadow-2xl">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] px-3 py-2">
                <Search className="h-3.5 w-3.5 text-[var(--cn-muted)]" />
                <input
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  placeholder="Search agents"
                  className="h-5 w-full bg-transparent text-sm text-[var(--cn-text)] outline-none placeholder:text-[var(--cn-muted)]"
                />
              </div>

              <div className="mt-2 max-h-[400px] overflow-y-auto pr-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--cn-muted)]">
                  Working Now
                </div>
                {filteredHired.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--cn-muted)] italic">No agents active</div>
                ) : (
                  filteredHired.map((agent) => (
                    <div
                      key={agent.id}
                      className="group mb-1 flex items-center justify-between rounded-xl border border-transparent bg-transparent p-2 transition hover:bg-[var(--cn-hover)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)] text-lg">
                          {agent.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--cn-text)]">{agent.name}</div>
                          <div className="text-[11px] text-[var(--cn-muted)]">{agent.role}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => actions.fireAgent(agent.id)}
                        className="rounded-lg bg-[var(--cn-surface-3)] px-2.5 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-500/10"
                      >
                        Fire
                      </button>
                    </div>
                  ))
                )}

                <div className="mt-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--cn-muted)]">
                  Hire Coworkers
                </div>
                {filteredAvailable.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--cn-muted)] italic">All agents hired</div>
                ) : (
                  filteredAvailable.map((agent) => (
                    <div
                      key={agent.id}
                      className="group mb-1 flex items-center justify-between rounded-xl border border-transparent bg-transparent p-2 transition hover:bg-[var(--cn-hover)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)] text-lg opacity-60">
                          {agent.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--cn-text)]">{agent.name}</div>
                          <div className="text-[11px] text-[var(--cn-muted)]">{agent.role}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => actions.hireAgent(agent.id)}
                        className="rounded-lg bg-[var(--cn-accent)] px-3 py-1.5 text-[10px] font-bold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
                      >
                        Hire
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={actions.openQuickSearch}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
          aria-label="Search"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={actions.toggleIncognitoMode}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--cn-hover)] ${ui.incognitoMode ? "text-[var(--cn-accent-fg)]" : "text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
            }`}
          aria-label="Toggle Incognito Mode"
          title={ui.incognitoMode ? "Disable Incognito Mode" : "Enable Incognito Mode"}
        >
          <CircleDashed className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={actions.openSettings}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
          aria-label="Settings"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={actions.openProfile}
          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: state.profile.avatarColor }}
          aria-label="Profile"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}


