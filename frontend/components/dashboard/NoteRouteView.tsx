"use client";

import { useEffect } from "react";
import { NotesPageView } from "./NotesPageView";
import { useDashboard } from "./DashboardProvider";

interface NoteRouteViewProps {
  noteId: string;
}

export function NoteRouteView({ noteId }: NoteRouteViewProps) {
  const { state, actions } = useDashboard();

  useEffect(() => {
    if (!noteId) {
      return;
    }

    const exists = state.notes.some((note) => note.id === noteId);
    if (exists) {
      actions.setActiveNote(noteId);
      return;
    }

    actions.setActiveNote(state.activeNoteId ?? state.notes[0]?.id ?? null);
  }, [actions, noteId, state.activeNoteId, state.notes]);

  return <NotesPageView />;
}


