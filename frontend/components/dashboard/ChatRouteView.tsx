"use client";

import { useEffect } from "react";
import { PromptInterface } from "./PromptInterface";
import { useDashboard } from "./DashboardProvider";

interface ChatRouteViewProps {
  chatId: string;
}

export function ChatRouteView({ chatId }: ChatRouteViewProps) {
  const { state, actions } = useDashboard();

  useEffect(() => {
    if (!chatId) {
      return;
    }

    if (state.activeChatId === chatId) {
      return;
    }

    const exists = state.chats.some((chat) => chat.id === chatId);
    if (exists) {
      actions.setActiveChat(chatId);
      return;
    }

    // fallback if it doesn't exist
    const fallbackId = state.chats[0]?.id ?? null;
    if (state.activeChatId !== fallbackId) {
      actions.setActiveChat(fallbackId);
    }
  }, [actions, chatId, state.activeChatId, state.chats]);

  return <PromptInterface />;
}


