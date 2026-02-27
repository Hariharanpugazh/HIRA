"use client";

import { useRouter } from "next/navigation";
import { DashboardTopBar } from "./DashboardTopBar";
import { useDashboard } from "./DashboardProvider";

export function NotesPageView() {
  const router = useRouter();
  const { state, derived, actions } = useDashboard();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DashboardTopBar title="Notes" subtitle="Capture planning, architecture, and deployment details" />

      <div className="grid min-h-0 flex-1 gap-3 p-3 sm:grid-cols-[300px_1fr] sm:p-4">
        <aside className="min-h-0 overflow-y-auto rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-2">
          <button
            type="button"
            onClick={() => {
              const noteId = actions.createNote("Untitled Note");
              router.push(`/dashboard/notes/${noteId}`);
            }}
            className="mb-2 h-10 w-full rounded-lg bg-[var(--cn-accent)] text-sm font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 shadow-sm"
          >
            New Note
          </button>

          <div className="space-y-1">
            {state.notes.map((note) => (
              <div
                key={note.id}
                className={`rounded-lg border px-3 py-2 transition ${note.id === state.activeNoteId
                    ? "border-[var(--cn-accent)] bg-[var(--cn-surface-2)] shadow-sm"
                    : "border-[var(--cn-border)] bg-[var(--cn-surface-3)] hover:bg-[var(--cn-hover)]"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      actions.setActiveNote(note.id);
                      router.push(`/dashboard/notes/${note.id}`);
                    }}
                    className="min-w-0 text-left"
                  >
                    <div className="truncate text-sm font-medium text-[var(--cn-text)]">{note.title}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.togglePinNote(note.id)}
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] transition ${note.pinned
                        ? "bg-[var(--cn-accent)] text-[var(--cn-accent-contrast)]"
                        : "bg-[var(--cn-surface)] text-[var(--cn-muted)]"
                      }`}
                  >
                    {note.pinned ? "Pinned" : "Pin"}
                  </button>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-[var(--cn-muted)]">{note.content || "Empty note"}</div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-h-0 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-3">
          {derived.activeNote ? (
            <div className="flex h-full min-h-0 flex-col gap-3">
              <input
                value={derived.activeNote.title}
                onChange={(event) =>
                  actions.updateNote(derived.activeNote!.id, {
                    title: event.target.value
                  })
                }
                className="h-11 rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 text-sm text-[var(--cn-text)] outline-none"
              />

              <textarea
                value={derived.activeNote.content}
                onChange={(event) =>
                  actions.updateNote(derived.activeNote!.id, {
                    content: event.target.value
                  })
                }
                placeholder="Write your notes..."
                className="min-h-0 flex-1 rounded-lg border border-[var(--cn-border)] bg-[var(--cn-surface-3)] px-3 py-3 text-sm text-[var(--cn-text)] outline-none placeholder:text-[var(--cn-muted)]"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => actions.togglePinNote(derived.activeNote!.id)}
                  className="h-9 rounded-lg border border-[var(--cn-border)] px-3 text-xs font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)]"
                >
                  {derived.activeNote.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentId = derived.activeNote!.id;
                    actions.deleteNote(currentId);
                    const next = state.notes.find((note) => note.id !== currentId);
                    router.push(next ? `/dashboard/notes/${next.id}` : "/dashboard/notes");
                  }}
                  className="h-9 rounded-lg border border-red-500/30 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--cn-muted)]">
              Select a note or create a new one.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


