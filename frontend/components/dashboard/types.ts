export type MessageRole = "user" | "assistant" | "system";

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  modelId?: string;
  attachments: ChatAttachment[];
  toolIds: string[];
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  pinned: boolean;
  channelId: string | null;
  folderId: string | null;
  projectId: string | null;
  messages: ChatMessage[];
  temporary?: boolean;
}

export interface ChannelItem {
  id: string;
  name: string;
  description: string;
}

export interface FolderItem {
  id: string;
  name: string;
  color: string;
}

export type ProjectFramework = "nextjs" | "react-native" | "flutter" | "tauri" | "fastapi";
export type ProjectStatus = "idea" | "planning" | "building" | "review" | "deployed";

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  framework: ProjectFramework;
  status: ProjectStatus;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

export interface ModelItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  supportsTools: boolean;
  pinned: boolean;
  connectionType: "local" | "external" | "direct";
  tags: string[];
  hidden?: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: string;
}

export interface ToolServer {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: "chat" | "workspace" | "global";
}

export interface WorkspaceFunction {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface WorkspaceSkill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  description: string;
  type: "docs" | "repo" | "url";
  enabled: boolean;
}

export interface AgentItem {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  hired: boolean;
}

export type PresenceStatus = "online" | "away" | "focus" | "offline";

export interface UserProfile {
  name: string;
  handle: string;
  email: string;
  role: string;
  status: PresenceStatus;
  avatarColor: string;
}

export interface GeneralSettings {
  autoTitle: boolean;
  saveHistory: boolean;
  confirmDelete: boolean;
}

export interface InterfaceSettings {
  theme: "dark" | "light" | "system";
  highContrastMode: boolean;
  compactMode: boolean;
  animations: boolean;
  showSuggestedPrompts: boolean;
  sidebarDefaultCollapsed: boolean;
  chatBubbleUi: boolean;
  autoCopyResponse: boolean;
}

export interface PersonalizationSettings {
  systemPrompt: string;
  preferredLanding: "chat" | "search" | "notes" | "workspace" | "projects";
  responseStyle: "concise" | "balanced" | "detailed";
}

export interface AudioSettings {
  voiceInput: boolean;
  voiceOutput: boolean;
  autoPlayResponseAudio: boolean;
}

export interface DataSettings {
  syncEnabled: boolean;
  telemetryEnabled: boolean;
}

export interface ConnectionSettings {
  anthropicApiKey: string;
  openAiApiKey: string;
  localModelEndpoint: string;
}

export interface AppSettings {
  general: GeneralSettings;
  interface: InterfaceSettings;
  personalization: PersonalizationSettings;
  audio: AudioSettings;
  data: DataSettings;
  connections: ConnectionSettings;
}

export interface DashboardPersistentState {
  chats: ChatThread[];
  activeChatId: string | null;
  channels: ChannelItem[];
  activeChannelId: string | null;
  folders: FolderItem[];
  activeFolderId: string | null;
  projects: ProjectItem[];
  activeProjectId: string | null;
  notes: NoteItem[];
  activeNoteId: string | null;
  models: ModelItem[];
  selectedModelId: string;
  defaultModelId: string;
  promptTemplates: PromptTemplate[];
  toolServers: ToolServer[];
  workspaceFunctions: WorkspaceFunction[];
  workspaceSkills: WorkspaceSkill[];
  knowledgeSources: KnowledgeSource[];
  agents: AgentItem[];
  profile: UserProfile;
  settings: AppSettings;
}

export type SearchEntityType =
  | "channel"
  | "chat"
  | "note"
  | "project"
  | "model"
  | "prompt"
  | "tool"
  | "function"
  | "skill"
  | "knowledge";

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  description: string;
  route: string;
}




