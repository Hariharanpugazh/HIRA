"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AppSettings,
  ChatAttachment,
  ChatMessage,
  ChatThread,
  DashboardPersistentState,
  KnowledgeSource,
  ModelItem,
  PresenceStatus,
  ProjectFramework,
  ProjectItem,
  ProjectStatus,
  SearchEntityType,
  SearchResult,
  ToolServer,
  UserProfile
} from "./types";

const STORAGE_KEY = "cashewnut.dashboard.state.v2";

type SearchFilter = SearchEntityType | "all";

interface DashboardUI {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  settingsOpen: boolean;
  profileOpen: boolean;
  quickSearchOpen: boolean;
  incognitoMode: boolean;
}

interface DashboardDerived {
  activeChat: ChatThread | null;
  visibleChats: ChatThread[];
  archivedChats: ChatThread[];
  activeNote: DashboardPersistentState["notes"][number] | null;
  selectedModel: ModelItem;
}

interface DashboardActions {
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  openQuickSearch: () => void;
  closeQuickSearch: () => void;
  toggleIncognitoMode: () => void;
  setActiveChat: (chatId: string | null) => void;
  createChat: (options?: { title?: string; channelId?: string | null; folderId?: string | null; projectId?: string | null; temporary?: boolean }) => string;
  sendMessage: (content: string, options?: { attachments?: ChatAttachment[]; toolIds?: string[] }) => void;
  renameChat: (chatId: string, nextTitle: string) => void;
  archiveChat: (chatId: string, archived?: boolean) => void;
  deleteChat: (chatId: string) => void;
  toggleChatPin: (chatId: string) => void;
  setActiveChannel: (channelId: string | null) => void;
  addChannel: (name: string) => void;
  setActiveFolder: (folderId: string | null) => void;
  addFolder: (name: string) => void;
  setActiveProject: (projectId: string | null) => void;
  createProject: (payload: { name: string; description: string; framework: ProjectFramework }) => string;
  updateProject: (projectId: string, patch: Partial<Omit<ProjectItem, "id">>) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  deleteProject: (projectId: string) => void;
  createProjectChat: (projectId: string) => string;
  setActiveNote: (noteId: string | null) => void;
  createNote: (title?: string) => string;
  updateNote: (noteId: string, patch: Partial<{ title: string; content: string }>) => void;
  deleteNote: (noteId: string) => void;
  togglePinNote: (noteId: string) => void;
  setSelectedModel: (modelId: string) => void;
  setDefaultModel: (modelId: string) => void;
  addModel: (payload: {
    name: string;
    provider: string;
    description?: string;
    contextWindow?: number;
    supportsTools?: boolean;
    connectionType?: ModelItem["connectionType"];
    tags?: string[];
  }) => void;
  removeModel: (modelId: string) => void;
  togglePinModel: (modelId: string) => void;
  setModelHidden: (modelId: string, hidden: boolean) => void;
  addPromptTemplate: (payload: { title: string; prompt: string; category: string }) => void;
  deletePromptTemplate: (id: string) => void;
  addToolServer: (payload: { name: string; description: string; scope: ToolServer["scope"] }) => void;
  toggleToolServer: (id: string) => void;
  deleteToolServer: (id: string) => void;
  addWorkspaceFunction: (payload: { name: string; description: string }) => void;
  toggleWorkspaceFunction: (id: string) => void;
  deleteWorkspaceFunction: (id: string) => void;
  addWorkspaceSkill: (payload: { name: string; description: string }) => void;
  toggleWorkspaceSkill: (id: string) => void;
  deleteWorkspaceSkill: (id: string) => void;
  addKnowledgeSource: (payload: { name: string; description: string; type: KnowledgeSource["type"] }) => void;
  toggleKnowledgeSource: (id: string) => void;
  deleteKnowledgeSource: (id: string) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  hireAgent: (agentId: string) => void;
  fireAgent: (agentId: string) => void;
  setPresenceStatus: (status: PresenceStatus) => void;
  updateSettingsSection: <K extends keyof AppSettings>(section: K, patch: Partial<AppSettings[K]>) => void;
  search: (query: string, filter?: SearchFilter) => SearchResult[];
  exportWorkspace: () => string;
  resetWorkspace: () => void;
}

interface DashboardContextValue {
  hydrated: boolean;
  state: DashboardPersistentState;
  ui: DashboardUI;
  derived: DashboardDerived;
  actions: DashboardActions;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function id(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

function deriveTitle(prompt: string) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  return compact.length > 44 ? `${compact.slice(0, 44)}...` : compact || "New Chat";
}

function sortChats(a: ChatThread, b: ChatThread) {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function assistantReply(input: string, model: ModelItem, toolNames: string[], project?: ProjectItem) {
  const intent = input.toLowerCase();
  if (intent.includes("deploy") || intent.includes("release")) {
    return [
      `Deployment workflow ready with ${model.name}.`,
      "1. Build + test in workspace.",
      "2. Publish preview and rollout checklist.",
      "3. Promote with rollback + monitoring."
    ].join("\n");
  }
  if (intent.includes("react native") || intent.includes("mobile") || intent.includes("expo")) {
    return [
      "Mobile intent detected.",
      "I can scaffold Expo structure, navigation, and preview instructions.",
      "Share target user flows and I will map tasks in order."
    ].join("\n");
  }
  return [
    `${model.name} is active${toolNames.length ? ` with ${toolNames.join(", ")}` : ""}.`,
    project ? `Project context: ${project.name} (${project.framework}).` : "No project context attached yet.",
    "I can generate architecture, code tasks, and validation steps from your next prompt."
  ].join("\n");
}

function seed(): DashboardPersistentState {
  const createdAt = now();
  const modelMain = "model-gpt41nano";
  return {
    chats: [
      {
        id: id("chat"),
        title: "Roman Concrete Durability",
        createdAt,
        updatedAt: createdAt,
        archived: false,
        pinned: true,
        channelId: "channel-general",
        folderId: "folder-study",
        projectId: null,
        messages: [
          {
            id: id("msg"),
            role: "assistant",
            content: "Welcome to Cashewnut. Ask for architecture, code generation, or deployment workflows and I will map next steps.",
            createdAt,
            modelId: modelMain,
            attachments: [],
            toolIds: []
          }
        ]
      }
    ],
    activeChatId: null,
    channels: [
      { id: "channel-general", name: "general", description: "Shared conversation channel" },
      { id: "channel-builds", name: "builds", description: "Build and release updates" },
      { id: "channel-research", name: "research", description: "Architecture and discovery" }
    ],
    activeChannelId: null,
    folders: [
      { id: "folder-finance", name: "Finance", color: "#74b1e8" },
      { id: "folder-study", name: "Study", color: "#226DB3" },
      { id: "folder-products", name: "Products", color: "#f59e0b" }
    ],
    activeFolderId: null,
    projects: [
      {
        id: "project-web-core",
        name: "Cashewnut Web Core",
        description: "Next.js workspace foundation and chat runtime",
        framework: "nextjs",
        status: "building",
        updatedAt: createdAt
      },
      {
        id: "project-mobile-preview",
        name: "Mobile Preview Pipeline",
        description: "Expo preview orchestration and session handoff",
        framework: "react-native",
        status: "planning",
        updatedAt: createdAt
      }
    ],
    activeProjectId: null,
    notes: [
      {
        id: id("note"),
        title: "MVP Loop",
        content: "Prompt -> Generate -> Preview -> Iterate -> Deploy.\n\nTarget first preview under 45 seconds for web projects.",
        pinned: true,
        updatedAt: createdAt
      },
      {
        id: id("note"),
        title: "Collaboration",
        content: "Track AI coworker status and next actions in workspace panels.",
        pinned: false,
        updatedAt: createdAt
      }
    ],
    activeNoteId: null,
    models: [
      {
        id: modelMain,
        name: "gpt-4.1-nano",
        provider: "OpenAI",
        description: "Fast default model for iterative coding flows",
        contextWindow: 128000,
        supportsTools: true,
        pinned: true,
        connectionType: "external",
        tags: ["chat", "fast", "default"]
      },
      {
        id: "model-claude-sonnet",
        name: "claude-sonnet-4",
        provider: "Anthropic",
        description: "Strong architecture reasoning and long-form planning",
        contextWindow: 200000,
        supportsTools: true,
        pinned: true,
        connectionType: "external",
        tags: ["reasoning", "architecture"]
      },
      {
        id: "model-llama-local",
        name: "llama-3.3-local",
        provider: "Local",
        description: "Self-hosted fallback model for private workloads",
        contextWindow: 64000,
        supportsTools: false,
        pinned: false,
        connectionType: "local",
        tags: ["local", "private"]
      }
    ],
    selectedModelId: modelMain,
    defaultModelId: modelMain,
    promptTemplates: [
      {
        id: id("prompt"),
        title: "Cross-platform MVP",
        category: "generation",
        prompt: "Generate a Next.js + FastAPI MVP with auth, dashboard, and deployment checklist."
      },
      {
        id: id("prompt"),
        title: "Code Review",
        category: "quality",
        prompt: "Review this feature for regressions, edge cases, and missing tests with severity ranking."
      },
      {
        id: id("prompt"),
        title: "Incident Runbook",
        category: "ops",
        prompt: "Create a runbook for a production outage including triage, rollback, and verification steps."
      }
    ],
    toolServers: [
      {
        id: "tool-web-search",
        name: "Web Search",
        description: "Fetch current web sources for unstable facts",
        enabled: true,
        scope: "global"
      },
      {
        id: "tool-code-runner",
        name: "Code Runner",
        description: "Run and verify generated snippets in sandbox",
        enabled: true,
        scope: "workspace"
      },
      {
        id: "tool-git-ops",
        name: "Git Ops",
        description: "Generate commit plans and release notes",
        enabled: false,
        scope: "chat"
      }
    ],
    workspaceFunctions: [
      { id: id("fn"), name: "generate_react_native", description: "Generate Expo-ready React Native structure", enabled: true },
      { id: id("fn"), name: "deploy_vercel", description: "Build and deploy selected project to Vercel", enabled: true }
    ],
    workspaceSkills: [
      { id: id("skill"), name: "Architecture Planner", description: "Maps requirements to stack and module boundaries", enabled: true },
      { id: id("skill"), name: "QA Regression", description: "Creates test plans and failure triage summaries", enabled: true }
    ],
    knowledgeSources: [
      { id: id("knowledge"), name: "Cashewnut PRD", description: "Product requirements and roadmap", type: "docs", enabled: true },
      { id: id("knowledge"), name: "Engineering Wiki", description: "Internal implementation standards", type: "url", enabled: false }
    ],
    agents: [
      { id: "product-agent", name: "Product Pro", role: "Product Manager", description: "Expert in product strategy and requirements.", avatar: "🎯", hired: true },
      { id: "architect-agent", name: "ArchiTech", role: "System Architect", description: "Designs robust and scalable system architectures.", avatar: "🏗️", hired: true },
      { id: "coder-agent", name: "FastCode", role: "Lead Developer", description: "Rapidly generates high-quality code across stacks.", avatar: "💻", hired: false },
      { id: "qa-agent", name: "TestMaster", role: "QA Engineer", description: "Ensures code quality and handles edge cases.", avatar: "🧪", hired: false }
    ],
    profile: {
      name: "Tim Baek",
      handle: "@tim",
      email: "tim@cashewnut.dev",
      role: "Product Engineer",
      status: "online",
      avatarColor: "#f59e0b"
    },
    settings: {
      general: { autoTitle: true, saveHistory: true, confirmDelete: true },
      interface: {
        theme: "dark",
        highContrastMode: false,
        compactMode: false,
        animations: true,
        showSuggestedPrompts: true,
        sidebarDefaultCollapsed: false,
        chatBubbleUi: false,
        autoCopyResponse: false
      },
      personalization: {
        systemPrompt: "You are Cashewnut, a pragmatic AI engineering partner focused on production quality and speed.",
        preferredLanding: "chat",
        responseStyle: "balanced"
      },
      audio: { voiceInput: false, voiceOutput: false, autoPlayResponseAudio: false },
      data: { syncEnabled: true, telemetryEnabled: true },
      connections: { anthropicApiKey: "", openAiApiKey: "", localModelEndpoint: "http://localhost:11434" }
    }
  };
}

function selectedModel(models: ModelItem[], idValue: string) {
  return models.find((model) => model.id === idValue && !model.hidden) ?? models.find((model) => !model.hidden) ?? models[0]!;
}

function normalizeState(input: unknown): DashboardPersistentState {
  const base = seed();
  if (!input || typeof input !== "object") {
    return base;
  }

  const parsed = input as Partial<DashboardPersistentState>;

  const models = (Array.isArray(parsed.models) ? parsed.models : base.models).map((model, index) => {
    const fallback = base.models[index % base.models.length] ?? base.models[0]!;
    return {
      ...fallback,
      ...model,
      connectionType: model?.connectionType ?? fallback.connectionType ?? "direct",
      tags: Array.isArray(model?.tags) ? model.tags.filter(Boolean) : fallback.tags,
      hidden: Boolean(model?.hidden)
    };
  });

  const chats = Array.isArray(parsed.chats) ? parsed.chats : base.chats;
  const notes = Array.isArray(parsed.notes) ? parsed.notes : base.notes;
  const projects = Array.isArray(parsed.projects) ? parsed.projects : base.projects;

  const selectedModelId =
    typeof parsed.selectedModelId === "string" && models.some((model) => model.id === parsed.selectedModelId)
      ? parsed.selectedModelId
      : models[0]!.id;
  const defaultModelId =
    typeof parsed.defaultModelId === "string" && models.some((model) => model.id === parsed.defaultModelId)
      ? parsed.defaultModelId
      : selectedModelId;

  const next: DashboardPersistentState = {
    ...base,
    ...parsed,
    chats,
    activeChatId:
      typeof parsed.activeChatId === "string" && chats.some((chat) => chat.id === parsed.activeChatId)
        ? parsed.activeChatId
        : chats[0]?.id ?? null,
    channels: Array.isArray(parsed.channels) ? parsed.channels : base.channels,
    activeChannelId:
      typeof parsed.activeChannelId === "string" &&
        (Array.isArray(parsed.channels) ? parsed.channels : base.channels).some(
          (channel) => channel.id === parsed.activeChannelId
        )
        ? parsed.activeChannelId
        : null,
    folders: Array.isArray(parsed.folders) ? parsed.folders : base.folders,
    activeFolderId:
      typeof parsed.activeFolderId === "string" &&
        (Array.isArray(parsed.folders) ? parsed.folders : base.folders).some(
          (folder) => folder.id === parsed.activeFolderId
        )
        ? parsed.activeFolderId
        : null,
    projects,
    activeProjectId:
      typeof parsed.activeProjectId === "string" && projects.some((project) => project.id === parsed.activeProjectId)
        ? parsed.activeProjectId
        : null,
    notes,
    activeNoteId:
      typeof parsed.activeNoteId === "string" && notes.some((note) => note.id === parsed.activeNoteId)
        ? parsed.activeNoteId
        : null,
    models,
    selectedModelId,
    defaultModelId,
    promptTemplates: Array.isArray(parsed.promptTemplates) ? parsed.promptTemplates : base.promptTemplates,
    toolServers: Array.isArray(parsed.toolServers) ? parsed.toolServers : base.toolServers,
    workspaceFunctions: Array.isArray(parsed.workspaceFunctions)
      ? parsed.workspaceFunctions
      : base.workspaceFunctions,
    workspaceSkills: Array.isArray(parsed.workspaceSkills) ? parsed.workspaceSkills : base.workspaceSkills,
    knowledgeSources: Array.isArray(parsed.knowledgeSources) ? parsed.knowledgeSources : base.knowledgeSources,
    agents: Array.isArray(parsed.agents) ? parsed.agents : base.agents,
    profile: {
      ...base.profile,
      ...(parsed.profile ?? {})
    },
    settings: {
      ...base.settings,
      ...(parsed.settings ?? {}),
      general: {
        ...base.settings.general,
        ...(parsed.settings?.general ?? {})
      },
      interface: {
        ...base.settings.interface,
        ...(parsed.settings?.interface ?? {})
      },
      personalization: {
        ...base.settings.personalization,
        ...(parsed.settings?.personalization ?? {})
      },
      audio: {
        ...base.settings.audio,
        ...(parsed.settings?.audio ?? {})
      },
      data: {
        ...base.settings.data,
        ...(parsed.settings?.data ?? {})
      },
      connections: {
        ...base.settings.connections,
        ...(parsed.settings?.connections ?? {})
      }
    }
  };

  return next;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DashboardPersistentState>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        const next = normalizeState(parsed);
        if (next && typeof next === "object") {
          setState(next);
          setSidebarCollapsed(Boolean(next.settings?.interface?.sidebarDefaultCollapsed));
        }
      }
    } catch {
      setState(seed());
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !state.settings.general.saveHistory) {
      return;
    }
    const stateToSave = {
      ...state,
      chats: state.chats.filter((chat) => !chat.temporary)
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state, hydrated]);

  const derived = useMemo<DashboardDerived>(() => {
    const activeChat = state.chats.find((chat) => chat.id === state.activeChatId) ?? null;
    const visibleChats = state.chats
      .filter((chat) => !chat.archived)
      .filter((chat) => (state.activeChannelId ? chat.channelId === state.activeChannelId : true))
      .filter((chat) => (state.activeFolderId ? chat.folderId === state.activeFolderId : true))
      .filter((chat) => (state.activeProjectId ? chat.projectId === state.activeProjectId : true))
      .sort(sortChats);
    const archivedChats = state.chats.filter((chat) => chat.archived).sort(sortChats);
    const activeNote = state.notes.find((note) => note.id === state.activeNoteId) ?? null;
    return {
      activeChat,
      visibleChats,
      archivedChats,
      activeNote,
      selectedModel: selectedModel(state.models, state.selectedModelId)
    };
  }, [state]);

  const setStatePatch = useCallback((patch: Partial<DashboardPersistentState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const hireAgent = useCallback((agentId: string) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === agentId ? { ...a, hired: true } : a))
    }));
  }, []);

  const fireAgent = useCallback((agentId: string) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === agentId ? { ...a, hired: false } : a))
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }, []);

  const actions: DashboardActions = {
    setSidebarCollapsed: (collapsed) => {
      setSidebarCollapsed(collapsed);
      setState((current) => ({
        ...current,
        settings: {
          ...current.settings,
          interface: {
            ...current.settings.interface,
            sidebarDefaultCollapsed: collapsed
          }
        }
      }));
    },
    toggleSidebarCollapsed: () =>
      setSidebarCollapsed((current) => {
        const next = !current;
        setState((stateCurrent) => ({
          ...stateCurrent,
          settings: {
            ...stateCurrent.settings,
            interface: {
              ...stateCurrent.settings.interface,
              sidebarDefaultCollapsed: next
            }
          }
        }));
        return next;
      }),
    openMobileSidebar: () => setMobileSidebarOpen(true),
    closeMobileSidebar: () => setMobileSidebarOpen(false),
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    openProfile: () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
    openQuickSearch: () => setQuickSearchOpen(true),
    closeQuickSearch: () => setQuickSearchOpen(false),
    toggleIncognitoMode: () => {
      setIncognitoMode((prev) => {
        const next = !prev;
        // If enabling, ensure we have an empty temporary chat
        if (next) {
          actions.createChat({ temporary: true });
        }
        return next;
      });
    },

    setActiveChat: (chatId) => setStatePatch({ activeChatId: chatId }),

    createChat: (options) => {
      const isTemporary = options?.temporary ?? incognitoMode;
      // Find if an empty chat already exists in the current state
      const targetChannelId = options?.channelId ?? state.activeChannelId;
      const existingEmptyChat = state.chats.find(c =>
        c.messages.length === 0 &&
        c.temporary === isTemporary &&
        c.channelId === targetChannelId
      );

      const targetChatId = existingEmptyChat ? existingEmptyChat.id : id("chat");

      setState((current) => {
        // Re-check inside setState to avoid duplicates if called in rapid succession
        const innerExisting = current.chats.find(c =>
          c.messages.length === 0 &&
          c.temporary === isTemporary &&
          c.channelId === (options?.channelId ?? current.activeChannelId)
        );

        if (innerExisting) {
          return { ...current, activeChatId: innerExisting.id };
        }

        const createdAt = now();
        const nextChat: ChatThread = {
          id: targetChatId,
          title: options?.title?.trim() || "New Chat",
          createdAt,
          updatedAt: createdAt,
          archived: false,
          pinned: false,
          channelId: options?.channelId ?? current.activeChannelId,
          folderId: options?.folderId ?? current.activeFolderId,
          projectId: options?.projectId ?? current.activeProjectId,
          messages: [],
          temporary: isTemporary
        };
        return { ...current, activeChatId: targetChatId, chats: [nextChat, ...current.chats].sort(sortChats) };
      });

      return existingEmptyChat ? existingEmptyChat.id : targetChatId;
    },
    sendMessage: (content, options) => {
      const next = content.trim();
      if (!next) {
        return;
      }
      setState((current) => {
        const chats = [...current.chats];
        let activeChatId = current.activeChatId;
        if (!activeChatId || !chats.some((chat) => chat.id === activeChatId)) {
          const createdAt = now();
          chats.unshift({
            id: id("chat"),
            title: "New Chat",
            createdAt,
            updatedAt: createdAt,
            archived: false,
            pinned: false,
            channelId: current.activeChannelId,
            folderId: current.activeFolderId,
            projectId: current.activeProjectId,
            messages: []
          });
          activeChatId = chats[0]!.id;
        }

        const index = chats.findIndex((chat) => chat.id === activeChatId);
        if (index < 0) {
          return current;
        }

        const chat = chats[index]!;
        const model = selectedModel(current.models, current.selectedModelId);
        const toolIds = (options?.toolIds ?? []).filter((toolId) =>
          current.toolServers.some((tool) => tool.id === toolId && tool.enabled)
        );
        const toolNames = toolIds
          .map((toolId) => current.toolServers.find((tool) => tool.id === toolId)?.name)
          .filter((name): name is string => Boolean(name));
        const project = chat.projectId ? current.projects.find((entry) => entry.id === chat.projectId) : undefined;

        const userMessage: ChatMessage = {
          id: id("msg"),
          role: "user",
          content: next,
          createdAt: now(),
          attachments: options?.attachments ?? [],
          toolIds
        };
        const assistantMessage: ChatMessage = {
          id: id("msg"),
          role: "assistant",
          content: assistantReply(next, model, toolNames, project),
          createdAt: now(),
          modelId: model.id,
          attachments: [],
          toolIds
        };

        chats[index] = {
          ...chat,
          title: current.settings.general.autoTitle && chat.messages.length === 0 ? deriveTitle(next) : chat.title,
          archived: false,
          updatedAt: now(),
          messages: [...chat.messages, userMessage, assistantMessage]
        };

        return { ...current, activeChatId, chats: chats.sort(sortChats) };
      });
    },
    renameChat: (chatId, nextTitle) =>
      setState((current) => ({
        ...current,
        chats: current.chats
          .map((chat) => (chat.id === chatId ? { ...chat, title: nextTitle.trim() || chat.title } : chat))
          .sort(sortChats)
      })),
    archiveChat: (chatId, archived = true) =>
      setState((current) => ({
        ...current,
        chats: current.chats
          .map((chat) => (chat.id === chatId ? { ...chat, archived, updatedAt: now() } : chat))
          .sort(sortChats)
      })),
    deleteChat: (chatId) =>
      setState((current) => {
        const chats = current.chats.filter((chat) => chat.id !== chatId);
        return {
          ...current,
          chats,
          activeChatId: current.activeChatId === chatId ? chats[0]?.id ?? null : current.activeChatId
        };
      }),
    toggleChatPin: (chatId) =>
      setState((current) => ({
        ...current,
        chats: current.chats
          .map((chat) => (chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat))
          .sort(sortChats)
      })),
    setActiveChannel: (channelId) => setStatePatch({ activeChannelId: channelId }),
    addChannel: (name) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      setState((current) => ({
        ...current,
        channels: [...current.channels, { id: id("channel"), name: trimmed.toLowerCase(), description: "Custom channel" }]
      }));
    },
    setActiveFolder: (folderId) => setStatePatch({ activeFolderId: folderId }),
    addFolder: (name) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      const colors = ["#226DB3", "#3081c7", "#4a95d6", "#74b1e8", "#99c7f0"];
      setState((current) => ({
        ...current,
        folders: [
          ...current.folders,
          { id: id("folder"), name: trimmed, color: colors[Math.floor(Math.random() * colors.length)] ?? "#60a5fa" }
        ]
      }));
    },
    setActiveProject: (projectId) => setStatePatch({ activeProjectId: projectId }),
    createProject: (payload) => {
      const projectId = id("project");
      setState((current) => ({
        ...current,
        activeProjectId: projectId,
        projects: [
          {
            id: projectId,
            name: payload.name.trim(),
            description: payload.description.trim(),
            framework: payload.framework,
            status: "idea",
            updatedAt: now()
          },
          ...current.projects
        ]
      }));
      return projectId;
    },
    updateProject: (projectId, patch) =>
      setState((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId ? { ...project, ...patch, updatedAt: now() } : project
        )
      })),
    updateProjectStatus: (projectId, status) =>
      setState((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId ? { ...project, status, updatedAt: now() } : project
        )
      })),
    deleteProject: (projectId) =>
      setState((current) => ({
        ...current,
        activeProjectId: current.activeProjectId === projectId ? null : current.activeProjectId,
        projects: current.projects.filter((project) => project.id !== projectId),
        chats: current.chats.map((chat) =>
          chat.projectId === projectId ? { ...chat, projectId: null, updatedAt: now() } : chat
        )
      })),
    createProjectChat: (projectId) => {
      const chatId = id("chat");
      setState((current) => {
        const project = current.projects.find((entry) => entry.id === projectId);
        const createdAt = now();
        return {
          ...current,
          activeProjectId: projectId,
          activeChatId: chatId,
          chats: [
            {
              id: chatId,
              title: project ? `${project.name} Build Session` : "Project Chat",
              createdAt,
              updatedAt: createdAt,
              archived: false,
              pinned: false,
              channelId: current.activeChannelId,
              folderId: current.activeFolderId,
              projectId,
              messages: []
            },
            ...current.chats
          ].sort(sortChats)
        };
      });
      return chatId;
    },
    setActiveNote: (noteId) => setStatePatch({ activeNoteId: noteId }),
    createNote: (title) => {
      const noteId = id("note");
      setState((current) => ({
        ...current,
        activeNoteId: noteId,
        notes: [
          { id: noteId, title: title?.trim() || "Untitled Note", content: "", pinned: false, updatedAt: now() },
          ...current.notes
        ]
      }));
      return noteId;
    },
    updateNote: (noteId, patch) =>
      setState((current) => ({
        ...current,
        notes: current.notes
          .map((note) => (note.id === noteId ? { ...note, ...patch, updatedAt: now() } : note))
          .sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
      })),
    deleteNote: (noteId) =>
      setState((current) => {
        const notes = current.notes.filter((note) => note.id !== noteId);
        return { ...current, notes, activeNoteId: current.activeNoteId === noteId ? notes[0]?.id ?? null : current.activeNoteId };
      }),
    togglePinNote: (noteId) =>
      setState((current) => ({
        ...current,
        notes: current.notes
          .map((note) => (note.id === noteId ? { ...note, pinned: !note.pinned, updatedAt: now() } : note))
          .sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
      })),
    setSelectedModel: (modelId) => setState((current) => (current.models.some((model) => model.id === modelId) ? { ...current, selectedModelId: modelId } : current)),
    setDefaultModel: (modelId) => setState((current) => (current.models.some((model) => model.id === modelId) ? { ...current, defaultModelId: modelId, selectedModelId: modelId } : current)),
    addModel: (payload) => {
      const name = payload.name.trim();
      if (!name) return;
      setState((current) => ({
        ...current,
        models: [
          {
            id: id("model"),
            name,
            provider: payload.provider || "Custom",
            description: payload.description || "Custom model",
            contextWindow: payload.contextWindow ?? 128000,
            supportsTools: payload.supportsTools ?? true,
            pinned: false,
            connectionType: payload.connectionType ?? "direct",
            tags: payload.tags ?? ["custom"],
            hidden: false
          },
          ...current.models
        ]
      }));
    },
    removeModel: (modelId) =>
      setState((current) => {
        if (current.models.length <= 1 || current.defaultModelId === modelId) return current;
        const models = current.models.filter((model) => model.id !== modelId);
        return { ...current, models, selectedModelId: current.selectedModelId === modelId ? current.defaultModelId : current.selectedModelId };
      }),
    togglePinModel: (modelId) =>
      setState((current) => ({
        ...current,
        models: current.models.map((model) => (model.id === modelId ? { ...model, pinned: !model.pinned } : model))
      })),
    setModelHidden: (modelId, hidden) =>
      setState((current) => {
        const models = current.models.map((model) => (model.id === modelId ? { ...model, hidden } : model));
        const fallback = models.find((model) => !model.hidden)?.id ?? current.defaultModelId;
        const nextSelected =
          current.selectedModelId === modelId && hidden ? fallback : current.selectedModelId;
        return { ...current, models, selectedModelId: nextSelected };
      }),
    addPromptTemplate: (payload) => {
      if (!payload.title.trim() || !payload.prompt.trim()) return;
      setState((current) => ({ ...current, promptTemplates: [{ id: id("prompt"), title: payload.title.trim(), prompt: payload.prompt.trim(), category: payload.category.trim() || "general" }, ...current.promptTemplates] }));
    },
    deletePromptTemplate: (templateId) => setState((current) => ({ ...current, promptTemplates: current.promptTemplates.filter((entry) => entry.id !== templateId) })),
    addToolServer: (payload) => {
      if (!payload.name.trim()) return;
      setState((current) => ({ ...current, toolServers: [{ id: id("tool"), name: payload.name.trim(), description: payload.description.trim() || "Custom tool server", enabled: true, scope: payload.scope }, ...current.toolServers] }));
    },
    toggleToolServer: (toolId) => setState((current) => ({ ...current, toolServers: current.toolServers.map((tool) => (tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool)) })),
    deleteToolServer: (toolId) => setState((current) => ({ ...current, toolServers: current.toolServers.filter((tool) => tool.id !== toolId) })),
    addWorkspaceFunction: (payload) => setState((current) => ({ ...current, workspaceFunctions: [{ id: id("fn"), name: payload.name.trim(), description: payload.description.trim() || "Custom function", enabled: true }, ...current.workspaceFunctions] })),
    toggleWorkspaceFunction: (functionId) => setState((current) => ({ ...current, workspaceFunctions: current.workspaceFunctions.map((entry) => (entry.id === functionId ? { ...entry, enabled: !entry.enabled } : entry)) })),
    deleteWorkspaceFunction: (functionId) => setState((current) => ({ ...current, workspaceFunctions: current.workspaceFunctions.filter((entry) => entry.id !== functionId) })),
    addWorkspaceSkill: (payload) => setState((current) => ({ ...current, workspaceSkills: [{ id: id("skill"), name: payload.name.trim(), description: payload.description.trim() || "Custom skill", enabled: true }, ...current.workspaceSkills] })),
    toggleWorkspaceSkill: (skillId) => setState((current) => ({ ...current, workspaceSkills: current.workspaceSkills.map((entry) => (entry.id === skillId ? { ...entry, enabled: !entry.enabled } : entry)) })),
    deleteWorkspaceSkill: (skillId) => setState((current) => ({ ...current, workspaceSkills: current.workspaceSkills.filter((entry) => entry.id !== skillId) })),
    addKnowledgeSource: (payload) => setState((current) => ({ ...current, knowledgeSources: [{ id: id("knowledge"), name: payload.name.trim(), description: payload.description.trim() || "Knowledge source", type: payload.type, enabled: true }, ...current.knowledgeSources] })),
    toggleKnowledgeSource: (knowledgeId) => setState((current) => ({ ...current, knowledgeSources: current.knowledgeSources.map((entry) => (entry.id === knowledgeId ? { ...entry, enabled: !entry.enabled } : entry)) })),
    deleteKnowledgeSource: (knowledgeId) => setState((current) => ({ ...current, knowledgeSources: current.knowledgeSources.filter((entry) => entry.id !== knowledgeId) })),
    updateProfile,
    hireAgent,
    fireAgent,
    setPresenceStatus: (status) => setState((current) => ({ ...current, profile: { ...current.profile, status } })),
    updateSettingsSection: (section, patch) =>
      setState((current) => {
        const next = { ...current, settings: { ...current.settings, [section]: { ...current.settings[section], ...patch } } };
        if (section === "interface" && "sidebarDefaultCollapsed" in patch) {
          const nextPatch = patch as Partial<AppSettings["interface"]>;
          if (typeof nextPatch.sidebarDefaultCollapsed === "boolean") {
            setSidebarCollapsed(nextPatch.sidebarDefaultCollapsed);
          }
        }
        return next;
      }),
    search: (query, filter = "all") => {
      const term = query.trim().toLowerCase();
      if (!term) return [];
      const allow = (type: SearchEntityType) => filter === "all" || filter === type;
      const contains = (value: string) => value.toLowerCase().includes(term);
      const out: SearchResult[] = [];

      if (allow("channel")) {
        state.channels.forEach((channel) => {
          if (contains(channel.name) || contains(channel.description)) {
            out.push({
              id: channel.id,
              type: "channel",
              title: channel.name,
              description: channel.description || "Channel",
              route: `/dashboard/channels/${channel.id}`
            });
          }
        });
      }

      if (allow("chat")) {
        state.chats.forEach((chat) => {
          const body = chat.messages.map((message) => message.content).join("\n");
          if (contains(chat.title) || contains(body)) {
            out.push({
              id: chat.id,
              type: "chat",
              title: chat.title,
              description: `${chat.messages.length} messages`,
              route: `/dashboard/c/${chat.id}`
            });
          }
        });
      }
      if (allow("note")) {
        state.notes.forEach((note) => {
          if (contains(note.title) || contains(note.content)) {
            out.push({ id: note.id, type: "note", title: note.title, description: note.content.slice(0, 120) || "Empty note", route: "/dashboard/notes" });
          }
        });
      }
      if (allow("project")) {
        state.projects.forEach((project) => {
          if (contains(project.name) || contains(project.description) || contains(project.framework)) {
            out.push({ id: project.id, type: "project", title: project.name, description: `${project.framework} · ${project.status}`, route: "/dashboard/projects" });
          }
        });
      }
      if (allow("model")) {
        state.models.forEach((model) => {
          if (!model.hidden && (contains(model.name) || contains(model.provider) || contains(model.description))) {
            out.push({
              id: model.id,
              type: "model",
              title: model.name,
              description: model.description,
              route: "/dashboard/workspace/models"
            });
          }
        });
      }
      if (allow("prompt")) {
        state.promptTemplates.forEach((template) => {
          if (contains(template.title) || contains(template.prompt) || contains(template.category)) {
            out.push({
              id: template.id,
              type: "prompt",
              title: template.title,
              description: template.category,
              route: "/dashboard/workspace/prompts"
            });
          }
        });
      }
      if (allow("tool")) {
        state.toolServers.forEach((tool) => {
          if (contains(tool.name) || contains(tool.description)) {
            out.push({
              id: tool.id,
              type: "tool",
              title: tool.name,
              description: tool.description,
              route: "/dashboard/workspace/tools"
            });
          }
        });
      }
      if (allow("function")) {
        state.workspaceFunctions.forEach((entry) => {
          if (contains(entry.name) || contains(entry.description)) {
            out.push({
              id: entry.id,
              type: "function",
              title: entry.name,
              description: entry.description,
              route: "/dashboard/workspace/functions"
            });
          }
        });
      }
      if (allow("skill")) {
        state.workspaceSkills.forEach((entry) => {
          if (contains(entry.name) || contains(entry.description)) {
            out.push({
              id: entry.id,
              type: "skill",
              title: entry.name,
              description: entry.description,
              route: "/dashboard/workspace/skills"
            });
          }
        });
      }
      if (allow("knowledge")) {
        state.knowledgeSources.forEach((entry) => {
          if (contains(entry.name) || contains(entry.description) || contains(entry.type)) {
            out.push({
              id: entry.id,
              type: "knowledge",
              title: entry.name,
              description: `${entry.type} source`,
              route: "/dashboard/workspace/knowledge"
            });
          }
        });
      }
      return out.slice(0, 120);
    },
    exportWorkspace: () => JSON.stringify(state, null, 2),
    resetWorkspace: () => {
      const next = seed();
      setState(next);
      setSidebarCollapsed(next.settings.interface.sidebarDefaultCollapsed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const value: DashboardContextValue = {
    hydrated,
    state,
    ui: { sidebarCollapsed, mobileSidebarOpen, settingsOpen, profileOpen, quickSearchOpen, incognitoMode },
    derived,
    actions
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}




