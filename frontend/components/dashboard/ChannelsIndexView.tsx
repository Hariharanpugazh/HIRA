"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "./DashboardProvider";

export function ChannelsIndexView() {
  const router = useRouter();
  const { state, actions } = useDashboard();

  useEffect(() => {
    if (state.channels.length > 0) {
      const first = state.channels[0]!;
      actions.setActiveChannel(first.id);
      router.replace(`/dashboard/channels/${first.id}`);
      return;
    }

    actions.addChannel("general");
  }, [actions, router, state.channels]);

  return <div className="flex h-full items-center justify-center text-sm text-[var(--cn-muted)]">Loading channels...</div>;
}


