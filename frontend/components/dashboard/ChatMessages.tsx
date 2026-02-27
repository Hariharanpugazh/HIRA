import React, { useEffect, useMemo, useRef } from "react";
import { Sparkles } from "lucide-react";
import { ChatMessage, ModelItem } from "./types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  models: ModelItem[];
}

function formatTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  models
}) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const modelMap = useMemo(() => {
    return Object.fromEntries(models.map((model) => [model.id, model.name]));
  }, [models]);

  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hidden">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-8">
        {messages.map((message) => {
          const assistant = message.role === "assistant";
          return (
            <div key={message.id} className="group flex w-full gap-4 px-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cn-surface-3)] text-[var(--cn-muted)]">
                {assistant ? (
                  <Sparkles className="h-5 w-5 text-[var(--cn-accent)]" />
                ) : (
                  <div className="text-xs font-bold uppercase">U</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 h-6">
                  <span className="text-[13px] font-bold tracking-tight text-[var(--cn-text)]">
                    {assistant ? (modelMap[message?.modelId ?? ""] ?? "Assistant") : "You"}
                  </span>
                  {assistant && (
                    <span className="px-1.5 py-0.25 rounded-md bg-[var(--cn-accent-soft)] border border-[var(--cn-accent-soft)] text-[9px] font-bold tracking-wider text-[var(--cn-accent-fg)] uppercase">
                      PRO
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--cn-muted)] opacity-0 transition-opacity group-hover:opacity-100 ml-auto">
                    {formatTime(message.createdAt)}
                  </span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed text-[var(--cn-text)]">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>

                {message.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.attachments.map((attachment) => (
                      <span
                        key={attachment.id}
                        className="rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-2 py-1 text-[11px] text-[var(--cn-muted)]"
                      >
                        {attachment.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {assistant && (message.toolIds.length > 0) ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[var(--cn-surface-3)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--cn-muted)]">
                      {message.toolIds.length} tool(s) used
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={anchorRef} />
      </div>
    </div>
  );
};


