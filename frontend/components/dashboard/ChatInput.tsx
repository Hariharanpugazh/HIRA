import React, { useEffect, useRef } from "react";
import { ArrowUp, Mic, Paperclip, Sparkles, X } from "lucide-react";
import { ChatAttachment, ToolServer } from "./types";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  attachments: ChatAttachment[];
  onAttachFiles: (files: FileList) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  toolsExpanded: boolean;
  onToggleTools: () => void;
  availableTools: ToolServer[];
  selectedToolIds: string[];
  onToggleTool: (toolId: string) => void;
  listening: boolean;
  onToggleListening: () => void;
  compact?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "How can I help you today?",
  attachments,
  onAttachFiles,
  onRemoveAttachment,
  toolsExpanded,
  onToggleTools,
  availableTools,
  selectedToolIds,
  onToggleTool,
  listening,
  onToggleListening,
  compact = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, compact ? 180 : 220)}px`;
  }, [value, compact]);

  return (
    <div className="w-full bg-[var(--cn-surface)] px-4 py-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex flex-col rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] transition-shadow duration-200 focus-within:shadow-sm">
          <textarea
            ref={textareaRef}
            className={`w-full resize-none rounded-t-2xl border-none bg-transparent px-4 pt-3 pb-1 text-sm leading-relaxed text-[var(--cn-text)] outline-none placeholder:text-[var(--cn-muted)] ${compact ? "min-h-[48px]" : "min-h-[56px]"
              }`}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={1}
            disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
          />

          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-2 py-1 text-xs text-[var(--cn-muted)]"
                >
                  {attachment.name}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="text-[var(--cn-muted)] transition hover:text-[var(--cn-text)]"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {toolsExpanded ? (
            <div className="mx-3 mb-2 flex flex-wrap gap-2 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-3)] p-2">
              {availableTools.map((tool) => {
                const selected = selectedToolIds.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onToggleTool(tool.id)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium transition ${selected
                      ? "bg-[var(--cn-surface-2)] text-[var(--cn-text)] shadow-sm"
                      : "text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                      }`}
                  >
                    {tool.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1 text-[var(--cn-muted)]">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    onAttachFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
              />

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--cn-hover)]"
                aria-label="Attach"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${toolsExpanded
                  ? "bg-[var(--cn-surface-3)] text-[var(--cn-text)]"
                  : "hover:bg-[var(--cn-hover)]"
                  }`}
                aria-label="Tools"
                onClick={onToggleTools}
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${listening
                  ? "bg-red-500/10 text-red-500"
                  : "text-[var(--cn-text)] hover:bg-[var(--cn-hover)]"
                  }`}
                aria-label="Dictate"
                onClick={onToggleListening}
              >
                <Mic className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg transition shadow-sm",
                  value.trim() && !disabled
                    ? "bg-[var(--cn-text)] text-[var(--cn-bg)]"
                    : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)]"
                ].join(" ")}
                onClick={onSend}
                disabled={disabled || !value.trim()}
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


