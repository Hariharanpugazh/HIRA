"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardTopBar } from "./DashboardTopBar";
import { useDashboard } from "./DashboardProvider";
import { ChatAttachment } from "./types";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface ChannelPageViewProps {
  channelId: string;
}

function sortByUpdatedAtDesc(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime();
}

export function ChannelPageView({ channelId }: ChannelPageViewProps) {
  const { state, actions } = useDashboard();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [toolTrayOpen, setToolTrayOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
    state.toolServers.filter((tool) => tool.enabled && tool.scope !== "global").map((tool) => tool.id)
  );
  const seededRef = useRef(false);

  const channel = useMemo(
    () => state.channels.find((entry) => entry.id === channelId) ?? null,
    [channelId, state.channels]
  );

  const channelChats = useMemo(() => {
    return state.chats
      .filter((chat) => !chat.archived && chat.channelId === channelId)
      .sort((a, b) => sortByUpdatedAtDesc(a.updatedAt, b.updatedAt));
  }, [channelId, state.chats]);

  useEffect(() => {
    actions.setActiveChannel(channelId);
  }, [actions, channelId]);

  useEffect(() => {
    if (!channel) {
      return;
    }

    if (channelChats.length === 0 && !seededRef.current) {
      seededRef.current = true;
      const chatId = actions.createChat({
        title: `${channel.name} discussion`,
        channelId: channel.id
      });
      actions.setActiveChat(chatId);
      return;
    }

    const activeInChannel = channelChats.some((chat) => chat.id === state.activeChatId);
    if (!activeInChannel && channelChats[0]) {
      actions.setActiveChat(channelChats[0].id);
    }
  }, [actions, channel, channelChats, state.activeChatId]);

  const selectedChatId = useMemo(() => {
    if (state.activeChatId && channelChats.some((chat) => chat.id === state.activeChatId)) {
      return state.activeChatId;
    }
    return channelChats[0]?.id ?? null;
  }, [channelChats, state.activeChatId]);

  const selectedChat = useMemo(
    () => state.chats.find((chat) => chat.id === selectedChatId) ?? null,
    [selectedChatId, state.chats]
  );

  const enabledToolIds = useMemo(
    () => state.toolServers.filter((tool) => tool.enabled && tool.scope !== "global").map((tool) => tool.id),
    [state.toolServers]
  );

  const effectiveSelectedToolIds = useMemo(() => {
    const valid = selectedToolIds.filter((toolId) => enabledToolIds.includes(toolId));
    return valid.length > 0 ? valid : enabledToolIds;
  }, [enabledToolIds, selectedToolIds]);

  const onSend = () => {
    if (!selectedChat || !input.trim()) {
      return;
    }

    actions.setActiveChat(selectedChat.id);
    actions.sendMessage(input, {
      attachments,
      toolIds: effectiveSelectedToolIds
    });
    setInput("");
    setAttachments([]);
    setIsListening(false);
  };

  if (!channel) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <DashboardTopBar title="Channel" subtitle="Channel not found" />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--cn-muted)]">Unknown channel.</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardTopBar title={`# ${channel.name}`} subtitle={channel.description || "Channel workspace"} />

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[320px_1fr] sm:p-4">
        <aside className="min-h-0 overflow-y-auto rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-2">
          <button
            type="button"
            onClick={() => {
              const chatId = actions.createChat({
                title: `${channel.name} thread`,
                channelId: channel.id
              });
              actions.setActiveChat(chatId);
            }}
            className="mb-2 h-10 w-full rounded-lg bg-[var(--cn-accent)] text-sm font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
          >
            New Thread
          </button>

          <div className="space-y-1">
            {channelChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => actions.setActiveChat(chat.id)}
                className={`block w-full rounded-lg border px-3 py-2 text-left transition ${chat.id === selectedChatId
                  ? "border-[var(--cn-accent)] bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)] shadow-sm"
                  : "border-[var(--cn-border)] bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                  }`}
              >
                <div className="truncate text-sm font-medium">{chat.title}</div>
                <div className="mt-1 text-xs opacity-80">{chat.messages.length} messages</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)]">
          {selectedChat ? (
            <>
              <ChatMessages
                messages={selectedChat.messages}
                models={state.models}
              />
              <div className="border-t border-[var(--cn-border)] px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={onSend}
                  placeholder={`Message #${channel.name}`}
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
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--cn-muted)]">
              Select a thread to start messaging.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

