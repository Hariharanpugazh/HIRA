"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AppWindow,
  Bot,
  Cable,
  CircleUserRound,
  Database,
  Download,
  Eye,
  EyeOff,
  Info,
  Palette,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Volume2,
  Wrench
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import { Modal } from "./Modal";

type SettingsTab =
  | "general"
  | "interface"
  | "connections"
  | "tools"
  | "personalization"
  | "audio"
  | "data_controls"
  | "account"
  | "about";

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const tabs: TabDef[] = [
  {
    id: "general",
    label: "General",
    icon: SlidersHorizontal,
    keywords: ["general", "defaults", "history", "confirm", "title"]
  },
  {
    id: "interface",
    label: "Interface",
    icon: AppWindow,
    keywords: ["theme", "layout", "light", "dark", "contrast", "sidebar", "model"]
  },
  {
    id: "connections",
    label: "Connections",
    icon: Cable,
    keywords: ["connection", "api", "key", "endpoint", "provider"]
  },
  {
    id: "tools",
    label: "External Tools",
    icon: Wrench,
    keywords: ["tool", "server", "mcp", "workspace"]
  },
  {
    id: "personalization",
    label: "Personalization",
    icon: Palette,
    keywords: ["prompt", "style", "memory", "landing", "personality"]
  },
  {
    id: "audio",
    label: "Audio",
    icon: Volume2,
    keywords: ["audio", "voice", "speech", "playback"]
  },
  {
    id: "data_controls",
    label: "Data Controls",
    icon: Database,
    keywords: ["data", "sync", "telemetry", "export", "reset"]
  },
  {
    id: "account",
    label: "Account",
    icon: CircleUserRound,
    keywords: ["account", "profile", "identity", "email", "status"]
  },
  {
    id: "about",
    label: "About",
    icon: Info,
    keywords: ["about", "version", "stack", "cashewnut"]
  }
];

export function SettingsModal() {
  const { ui, state, actions } = useDashboard();
  const [tab, setTab] = useState<SettingsTab>("general");
  const [searchValue, setSearchValue] = useState("");
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [showHiddenModels, setShowHiddenModels] = useState(false);

  const filteredTabs = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return tabs;
    }

    return tabs.filter((entry) => {
      return (
        entry.label.toLowerCase().includes(term) ||
        entry.keywords.some((keyword) => keyword.toLowerCase().includes(term))
      );
    });
  }, [searchValue]);

  const activeTab: SettingsTab = filteredTabs.some((entry) => entry.id === tab)
    ? tab
    : filteredTabs[0]?.id ?? "general";

  const visibleModels = useMemo(() => {
    return state.models
      .filter((model) => (showHiddenModels ? true : !model.hidden))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [state.models, showHiddenModels]);

  const enabledToolCount = useMemo(
    () => state.toolServers.filter((tool) => tool.enabled).length,
    [state.toolServers]
  );

  const downloadData = () => {
    const blob = new Blob([actions.exportWorkspace()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cashewnut-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const addTool = (event: FormEvent) => {
    event.preventDefault();
    if (!newToolName.trim()) {
      return;
    }

    actions.addToolServer({
      name: newToolName,
      description: newToolDescription,
      scope: "workspace"
    });

    setNewToolName("");
    setNewToolDescription("");
  };

  return (
    <Modal open={ui.settingsOpen} onClose={actions.closeSettings} title="Settings" widthClassName="max-w-5xl">
      <div className="grid gap-0 md:grid-cols-[230px_1fr]">
        <aside className="border-b border-[var(--cn-border)] p-3 md:border-b-0 md:border-r">
          <div className="mb-2 flex items-center gap-2 rounded-full border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3">
            <Search className="h-3.5 w-3.5 text-[var(--cn-muted)]" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search"
              className="h-8 w-full bg-transparent text-sm text-[var(--cn-text)] outline-none placeholder:text-[var(--cn-muted)]"
            />
          </div>

          <nav className="grid grid-cols-2 gap-1 md:grid-cols-1" role="tablist">
            {filteredTabs.length === 0 ? (
              <div className="px-2 py-3 text-sm text-[var(--cn-muted)]">No results found.</div>
            ) : null}

            {filteredTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${activeTab === item.id
                    ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)] shadow-sm"
                    : "text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                  }`}
                role="tab"
                aria-selected={activeTab === item.id}
                aria-controls={`settings-tab-${item.id}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section id={`settings-tab-${activeTab}`} className="p-4 sm:p-5">
          {activeTab === "general" ? (
            <div className="space-y-3">
              <SettingsCard
                title="Behavior"
                description="Control default chat and workspace behavior."
              >
                <SettingSwitch
                  label="Auto-title new chats"
                  value={state.settings.general.autoTitle}
                  onChange={(checked) => actions.updateSettingsSection("general", { autoTitle: checked })}
                />
                <SettingSwitch
                  label="Save workspace history"
                  value={state.settings.general.saveHistory}
                  onChange={(checked) => actions.updateSettingsSection("general", { saveHistory: checked })}
                />
                <SettingSwitch
                  label="Confirm destructive actions"
                  value={state.settings.general.confirmDelete}
                  onChange={(checked) => actions.updateSettingsSection("general", { confirmDelete: checked })}
                />
              </SettingsCard>

              <SettingsCard
                title="Landing"
                description="Choose which page loads by default."
              >
                <SettingsSelect
                  label="Preferred landing page"
                  value={state.settings.personalization.preferredLanding}
                  onChange={(value) =>
                    actions.updateSettingsSection("personalization", {
                      preferredLanding: value as
                        | "chat"
                        | "search"
                        | "notes"
                        | "workspace"
                        | "projects"
                    })
                  }
                  options={[
                    { value: "chat", label: "Chat" },
                    { value: "search", label: "Search" },
                    { value: "notes", label: "Notes" },
                    { value: "workspace", label: "Workspace" },
                    { value: "projects", label: "Projects" }
                  ]}
                />
              </SettingsCard>
            </div>
          ) : null}

          {activeTab === "interface" ? (
            <div className="space-y-3">
              <SettingsCard title="Theme" description="Control display and accessibility modes.">
                <div className="flex flex-wrap gap-2">
                  {(["dark", "light", "system"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => actions.updateSettingsSection("interface", { theme: mode })}
                      className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${state.settings.interface.theme === mode
                          ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)]"
                          : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <SettingSwitch
                  label="High contrast mode"
                  value={state.settings.interface.highContrastMode}
                  onChange={(checked) =>
                    actions.updateSettingsSection("interface", { highContrastMode: checked })
                  }
                />
                <SettingSwitch
                  label="Compact mode"
                  value={state.settings.interface.compactMode}
                  onChange={(checked) => actions.updateSettingsSection("interface", { compactMode: checked })}
                />
                <SettingSwitch
                  label="Enable animations"
                  value={state.settings.interface.animations}
                  onChange={(checked) => actions.updateSettingsSection("interface", { animations: checked })}
                />
                <SettingSwitch
                  label="Default collapsed sidebar"
                  value={state.settings.interface.sidebarDefaultCollapsed}
                  onChange={(checked) =>
                    actions.updateSettingsSection("interface", {
                      sidebarDefaultCollapsed: checked
                    })
                  }
                />
              </SettingsCard>

              <SettingsCard title="Chat UI" description="Chat controls and quality-of-life toggles.">
                <SettingSwitch
                  label="Chat bubble UI"
                  value={state.settings.interface.chatBubbleUi}
                  onChange={(checked) => actions.updateSettingsSection("interface", { chatBubbleUi: checked })}
                />
                <SettingSwitch
                  label="Auto copy latest response"
                  value={state.settings.interface.autoCopyResponse}
                  onChange={(checked) =>
                    actions.updateSettingsSection("interface", { autoCopyResponse: checked })
                  }
                />
                <SettingSwitch
                  label="Show suggested prompts"
                  value={state.settings.interface.showSuggestedPrompts}
                  onChange={(checked) =>
                    actions.updateSettingsSection("interface", { showSuggestedPrompts: checked })
                  }
                />
              </SettingsCard>

              <SettingsCard
                title="Model Preferences"
                description="Set defaults and control model visibility."
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHiddenModels((current) => !current)}
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] transition ${showHiddenModels
                        ? "bg-[var(--cn-accent-soft)] text-[var(--cn-accent-fg)]"
                        : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)]"
                      }`}
                  >
                    {showHiddenModels ? "Including hidden" : "Visible only"}
                  </button>
                  <div className="text-xs text-[var(--cn-muted)]">{state.models.length} models</div>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {visibleModels.map((model) => {
                    const isActive = model.id === state.selectedModelId;
                    const isDefault = model.id === state.defaultModelId;

                    return (
                      <div
                        key={model.id}
                        className={`rounded-xl border p-3 ${isActive
                            ? "border-[var(--cn-accent)] bg-[var(--cn-surface-2)] shadow-sm"
                            : "border-[var(--cn-border)] bg-[var(--cn-surface-3)]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-[var(--cn-text)]">{model.name}</p>
                              {isDefault ? <Pill label="default" /> : null}
                              {model.pinned ? <Pill label="pinned" /> : null}
                              {model.hidden ? <Pill label="hidden" /> : null}
                            </div>
                            <p className="text-xs text-[var(--cn-muted)]">
                              {model.provider} · {model.connectionType} · {model.contextWindow.toLocaleString()} context
                            </p>
                            <p className="mt-1 text-xs text-[var(--cn-muted)]">{model.description}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5">
                            <TinyIconButton
                              label={model.pinned ? "Unpin" : "Pin"}
                              onClick={() => actions.togglePinModel(model.id)}
                            >
                              {model.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            </TinyIconButton>
                            <TinyIconButton
                              label={model.hidden ? "Show" : "Hide"}
                              onClick={() => actions.setModelHidden(model.id, !model.hidden)}
                            >
                              {model.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </TinyIconButton>
                            <TinyIconButton
                              label="Delete"
                              danger
                              onClick={() => actions.removeModel(model.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </TinyIconButton>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <ActionPill
                            active={isActive}
                            label={isActive ? "Active" : "Use"}
                            onClick={() => actions.setSelectedModel(model.id)}
                          />
                          <ActionPill
                            active={isDefault}
                            label={isDefault ? "Default" : "Set Default"}
                            onClick={() => actions.setDefaultModel(model.id)}
                          />
                          {model.tags.map((tag) => (
                            <Pill key={`${model.id}-${tag}`} label={tag} subtle />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SettingsCard>
            </div>
          ) : null}

          {activeTab === "connections" ? (
            <SettingsCard title="Model Provider Keys" description="Configure external provider connections.">
              <SettingsInput
                label="Anthropic API Key"
                value={state.settings.connections.anthropicApiKey}
                onChange={(value) =>
                  actions.updateSettingsSection("connections", { anthropicApiKey: value })
                }
              />
              <SettingsInput
                label="OpenAI API Key"
                value={state.settings.connections.openAiApiKey}
                onChange={(value) => actions.updateSettingsSection("connections", { openAiApiKey: value })}
              />
              <SettingsInput
                label="Local Endpoint"
                value={state.settings.connections.localModelEndpoint}
                onChange={(value) =>
                  actions.updateSettingsSection("connections", { localModelEndpoint: value })
                }
              />
            </SettingsCard>
          ) : null}

          {activeTab === "tools" ? (
            <div className="space-y-3">
              <SettingsCard
                title={`Tool Servers (${enabledToolCount}/${state.toolServers.length} enabled)`}
                description="Enable and manage direct tool connections."
              >
                <div className="space-y-2">
                  {state.toolServers.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-medium text-[var(--cn-text)]">{tool.name}</div>
                        <div className="text-xs text-[var(--cn-muted)]">{tool.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionPill
                          active={tool.enabled}
                          label={tool.enabled ? "Enabled" : "Disabled"}
                          onClick={() => actions.toggleToolServer(tool.id)}
                        />
                        <button
                          type="button"
                          onClick={() => actions.deleteToolServer(tool.id)}
                          className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SettingsCard>

              <SettingsCard title="Add Tool Server" description="Register a workspace-scoped tool server.">
                <form onSubmit={addTool} className="space-y-2">
                  <SettingsInput label="Name" value={newToolName} onChange={setNewToolName} />
                  <SettingsInput
                    label="Description"
                    value={newToolDescription}
                    onChange={setNewToolDescription}
                  />
                  <button
                    type="submit"
                    className="h-10 w-full rounded-lg bg-[var(--cn-accent)] text-sm font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
                  >
                    Add Tool Server
                  </button>
                </form>
              </SettingsCard>
            </div>
          ) : null}

          {activeTab === "personalization" ? (
            <SettingsCard title="Prompting & Preferences" description="Control AI tone and context defaults.">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">
                  System Prompt
                </span>
                <textarea
                  value={state.settings.personalization.systemPrompt}
                  onChange={(event) =>
                    actions.updateSettingsSection("personalization", {
                      systemPrompt: event.target.value
                    })
                  }
                  className="h-36 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-2 text-sm text-[var(--cn-text)] outline-none"
                />
              </label>

              <SettingsSelect
                label="Response Style"
                value={state.settings.personalization.responseStyle}
                onChange={(value) =>
                  actions.updateSettingsSection("personalization", {
                    responseStyle: value as "concise" | "balanced" | "detailed"
                  })
                }
                options={[
                  { value: "concise", label: "Concise" },
                  { value: "balanced", label: "Balanced" },
                  { value: "detailed", label: "Detailed" }
                ]}
              />
            </SettingsCard>
          ) : null}

          {activeTab === "audio" ? (
            <SettingsCard title="Voice & Playback" description="Configure dictation and response audio behavior.">
              <SettingSwitch
                label="Voice input"
                value={state.settings.audio.voiceInput}
                onChange={(checked) => actions.updateSettingsSection("audio", { voiceInput: checked })}
              />
              <SettingSwitch
                label="Voice output"
                value={state.settings.audio.voiceOutput}
                onChange={(checked) => actions.updateSettingsSection("audio", { voiceOutput: checked })}
              />
              <SettingSwitch
                label="Autoplay spoken responses"
                value={state.settings.audio.autoPlayResponseAudio}
                onChange={(checked) =>
                  actions.updateSettingsSection("audio", { autoPlayResponseAudio: checked })
                }
              />
            </SettingsCard>
          ) : null}

          {activeTab === "data_controls" ? (
            <SettingsCard title="Data Controls" description="Manage data sync, telemetry, and exports.">
              <SettingSwitch
                label="Enable sync"
                value={state.settings.data.syncEnabled}
                onChange={(checked) => actions.updateSettingsSection("data", { syncEnabled: checked })}
              />
              <SettingSwitch
                label="Enable telemetry"
                value={state.settings.data.telemetryEnabled}
                onChange={(checked) =>
                  actions.updateSettingsSection("data", { telemetryEnabled: checked })
                }
              />
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={downloadData}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--cn-border)] px-3 py-2 text-sm text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)]"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
                <button
                  type="button"
                  onClick={actions.resetWorkspace}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Workspace
                </button>
              </div>
            </SettingsCard>
          ) : null}

          {activeTab === "account" ? (
            <SettingsCard title="Account" description="Update profile and presence status.">
              <SettingsInput
                label="Name"
                value={state.profile.name}
                onChange={(value) => actions.updateProfile({ name: value })}
              />
              <SettingsInput
                label="Handle"
                value={state.profile.handle}
                onChange={(value) => actions.updateProfile({ handle: value })}
              />
              <SettingsInput
                label="Email"
                value={state.profile.email}
                onChange={(value) => actions.updateProfile({ email: value })}
              />
              <SettingsInput
                label="Role"
                value={state.profile.role}
                onChange={(value) => actions.updateProfile({ role: value })}
              />

              <div className="flex flex-wrap gap-2">
                {(["online", "away", "focus", "offline"] as const).map((status) => (
                  <ActionPill
                    key={status}
                    active={state.profile.status === status}
                    label={status}
                    onClick={() => actions.setPresenceStatus(status)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={actions.openProfile}
                className="h-10 w-full rounded-lg border border-[var(--cn-border)] text-sm font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)]"
              >
                Open Profile Panel
              </button>
            </SettingsCard>
          ) : null}

          {activeTab === "about" ? (
            <SettingsCard title="About Cashewnut" description="Build details and dashboard scope.">
              <div className="space-y-2 text-sm text-[var(--cn-muted)]">
                <p className="text-[var(--cn-text)]">Cashewnut Workspace v0.4</p>
                <p>
                  Cashewnut chat, settings, model picker, and workspace controls built for the
                  Next.js app and aligned to the product requirements.
                </p>
                <p>
                  Includes search, notes, workspace assets, projects, profile controls, and local
                  persistence.
                </p>
                <div className="pt-2 text-xs uppercase tracking-[0.12em] text-[var(--cn-muted)]">
                  Core stack
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cn-border)] px-3 py-1 text-xs text-[var(--cn-text)]">
                  <Bot className="h-3.5 w-3.5" />
                  Next.js + React + Tailwind
                </div>
              </div>
            </SettingsCard>
          ) : null}
        </section>
      </div>
    </Modal>
  );
}

function SettingsCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--cn-text)]">{title}</h3>
      {description ? <p className="mt-1 text-xs text-[var(--cn-muted)]">{description}</p> : null}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function SettingSwitch({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-xl bg-[var(--cn-surface-2)] px-3 py-2">
      <span className="text-sm text-[var(--cn-text)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${value
            ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)] shadow-sm"
            : "bg-[var(--cn-hover)] text-[var(--cn-muted)]"
          }`}
      >
        {value ? "On" : "Off"}
      </button>
    </label>
  );
}

function SettingsInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-3 text-sm text-[var(--cn-text)] outline-none"
      />
    </label>
  );
}

function SettingsSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-3 text-sm text-[var(--cn-text)] outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionPill({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.12em] transition ${active
          ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)] shadow-sm"
          : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
        }`}
    >
      {label}
    </button>
  );
}

function TinyIconButton({
  label,
  onClick,
  danger,
  children
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md p-1 transition ${danger
          ? "text-[var(--cn-muted)] hover:bg-red-500/10 hover:text-red-300"
          : "text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
        }`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function Pill({ label, subtle }: { label: string; subtle?: boolean }) {
  return (
    <span
      className={`rounded-full border border-[var(--cn-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${subtle ? "text-[var(--cn-muted)]" : "text-[var(--cn-muted)]"
        }`}
    >
      {label}
    </span>
  );
}


