"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
  hideHeader?: boolean;
  glass?: boolean;
  position?: "top" | "center";
}

export function Modal({
  open,
  title,
  onClose,
  children,
  widthClassName = "max-w-3xl",
  hideHeader = false,
  glass = false,
  position = "center"
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const positionClasses = position === "top"
    ? "items-start pt-[10vh] sm:pt-[15vh]"
    : "items-center";

  return (
    <div className={`fixed inset-0 z-50 flex justify-center p-3 sm:p-5 ${positionClasses}`}>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
      />

      <section
        className={`relative z-10 max-h-[85vh] w-full overflow-hidden rounded-2xl border border-[var(--cn-border-strong)] transition-all duration-200 ${glass ? "bg-[var(--cn-surface)]/80 backdrop-blur-2xl shadow-2xl" : "bg-[var(--cn-surface)] shadow-xl"
          } ${widthClassName}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {!hideHeader && (
          <header className="flex items-center justify-between border-b border-[var(--cn-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--cn-text)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
        )}
        <div className={`overflow-y-auto ${hideHeader ? "max-h-[85vh]" : "max-h-[calc(85vh-56px)]"}`}>
          {children}
        </div>
      </section>
    </div>
  );
}



