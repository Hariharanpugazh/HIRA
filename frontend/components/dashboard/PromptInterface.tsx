"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import { DashboardTopBar } from "./DashboardTopBar";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { ChatAttachment } from "./types";

const fallbackPrompts = [
  {
    title: "Generate a production-ready Next.js dashboard",
    subtitle: "with role-based auth and test coverage"
  },
  {
    title: "Design a cross-platform roadmap",
    subtitle: "for web, mobile, and desktop releases"
  },
  {
    title: "Create a deployment runbook",
    subtitle: "with rollback, alerts, and post-mortem template"
  }
];

export function PromptInterface() {
  const { state, ui, derived, actions } = useDashboard();
  const [input, setInput] = useState("");
  const [toolTrayOpen, setToolTrayOpen] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
    state.toolServers.filter((tool) => tool.enabled && tool.scope !== "global").map((tool) => tool.id)
  );
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const lastAutoCopiedMessageId = useRef<string | null>(null);

  const activeChat = derived.activeChat;
  const messages = activeChat?.messages ?? [];
  const isEmpty = messages.length === 0;
  const enabledToolIds = useMemo(
    () => state.toolServers.filter((tool) => tool.enabled && tool.scope !== "global").map((tool) => tool.id),
    [state.toolServers]
  );
  const effectiveSelectedToolIds = useMemo(() => {
    const valid = selectedToolIds.filter((toolId) => enabledToolIds.includes(toolId));
    return valid.length > 0 ? valid : enabledToolIds;
  }, [enabledToolIds, selectedToolIds]);

  useEffect(() => {
    if (!state.settings.interface.autoCopyResponse) {
      return;
    }

    const lastAssistantMessage = [...(activeChat?.messages ?? [])]
      .reverse()
      .find((message) => message.role === "assistant");
    if (!lastAssistantMessage || lastAutoCopiedMessageId.current === lastAssistantMessage.id) {
      return;
    }

    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      return;
    }

    navigator.clipboard
      .writeText(lastAssistantMessage.content)
      .then(() => {
        lastAutoCopiedMessageId.current = lastAssistantMessage.id;
      })
      .catch(() => {
        // Silently ignore clipboard permission failures.
      });
  }, [activeChat, state.settings.interface.autoCopyResponse]);

  const suggestedPrompts = useMemo(() => {
    const templates = state.promptTemplates.slice(0, 3).map((template) => ({
      title: template.title,
      subtitle: template.prompt
    }));
    return templates.length > 0 ? templates : fallbackPrompts;
  }, [state.promptTemplates]);

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }

    actions.sendMessage(input, {
      attachments,
      toolIds: effectiveSelectedToolIds
    });
    setInput("");
    setAttachments([]);
    setIsListening(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardTopBar showModelSelector />

      <main className="flex min-h-0 flex-1 flex-col">
        {isEmpty ? (
          <div className="m-auto w-full max-w-3xl px-4 pb-14 sm:px-6">
            <div className="mb-10 flex flex-col items-center justify-center text-center">
              {ui.incognitoMode ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--cn-text)] sm:text-4xl">
                    Temporary Chat
                  </h1>
                  <p className="mt-2 text-sm text-[var(--cn-muted)]">
                    This chat won't appear in your chat history, and won't be used to train our models.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--cn-text)] sm:text-4xl">
                    {derived.selectedModel.name}
                  </h1>
                  <p className="mt-2 text-sm text-[var(--cn-muted)]">How can I help you today?</p>
                </>
              )}
            </div>

            <div className="mx-auto mt-2 w-full max-w-2xl px-2">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                attachments={attachments}
                onAttachFiles={(files) => {
                  const next = Array.from(files).map((file) => ({
                    id: `${file.name}-${file.size}-${file.lastModified}`,
                    name: file.name,
                    size: file.size,
                    type: file.type
                  }));
                  setAttachments((current) => [...current, ...next]);
                }}
                onRemoveAttachment={(attachmentId) =>
                  setAttachments((current) => current.filter((item) => item.id !== attachmentId))
                }
                toolsExpanded={toolTrayOpen}
                onToggleTools={() => setToolTrayOpen((current) => !current)}
                availableTools={state.toolServers.filter((tool) => tool.enabled)}
                selectedToolIds={effectiveSelectedToolIds}
                onToggleTool={(toolId) =>
                  setSelectedToolIds((current) =>
                    (current.length > 0 ? current : enabledToolIds).includes(toolId)
                      ? (current.length > 0 ? current : enabledToolIds).filter((item) => item !== toolId)
                      : [...(current.length > 0 ? current : enabledToolIds), toolId]
                  )
                }
                listening={isListening}
                onToggleListening={() =>
                  setIsListening((current) => {
                    if (!state.settings.audio.voiceInput) {
                      return false;
                    }
                    return !current;
                  })
                }
                compact={state.settings.interface.compactMode}
              />
            </div>

            {state.settings.interface.showSuggestedPrompts && !ui.incognitoMode ? (
              <div className="mx-auto mt-7 w-full max-w-xl text-left">
                <div className="mb-3 flex items-center gap-1.5 text-sm text-[var(--cn-muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Suggested</span>
                </div>

                <div className="space-y-3">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt.title}
                      type="button"
                      className="group block text-left"
                      onClick={() => setInput(prompt.subtitle || prompt.title)}
                    >
                      <div className="text-xl font-medium text-[var(--cn-text)] transition group-hover:opacity-90 sm:text-2xl">
                        {prompt.title}
                      </div>
                      <div className="line-clamp-2 text-sm text-[var(--cn-muted)]">{prompt.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <ChatMessages
              messages={messages}
              models={state.models}
            />
            <div className="pb-3 pt-2 sm:pb-4 sm:pt-3">
              <div className="mx-auto w-full max-w-3xl">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  placeholder="Reply"
                  attachments={attachments}
                  onAttachFiles={(files) => {
                    const next = Array.from(files).map((file) => ({
                      id: `${file.name}-${file.size}-${file.lastModified}`,
                      name: file.name,
                      size: file.size,
                      type: file.type
                    }));
                    setAttachments((current) => [...current, ...next]);
                  }}
                  onRemoveAttachment={(attachmentId) =>
                    setAttachments((current) => current.filter((item) => item.id !== attachmentId))
                  }
                  toolsExpanded={toolTrayOpen}
                  onToggleTools={() => setToolTrayOpen((current) => !current)}
                  availableTools={state.toolServers.filter((tool) => tool.enabled)}
                  selectedToolIds={effectiveSelectedToolIds}
                  onToggleTool={(toolId) =>
                    setSelectedToolIds((current) =>
                      (current.length > 0 ? current : enabledToolIds).includes(toolId)
                        ? (current.length > 0 ? current : enabledToolIds).filter((item) => item !== toolId)
                        : [...(current.length > 0 ? current : enabledToolIds), toolId]
                    )
                  }
                  listening={isListening}
                  onToggleListening={() =>
                    setIsListening((current) => {
                      if (!state.settings.audio.voiceInput) {
                        return false;
                      }
                      return !current;
                    })
                  }
                  compact={state.settings.interface.compactMode}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


