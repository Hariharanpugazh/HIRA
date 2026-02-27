"use client";

import { useEffect } from "react";
import { useDashboard } from "./DashboardProvider";
import { ProfileModal } from "./ProfileModal";
import { QuickSearchModal } from "./QuickSearchModal";
import { SettingsModal } from "./SettingsModal";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { state, actions } = useDashboard();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        actions.openQuickSearch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const themeMode = state.settings.interface.theme;
      const resolved = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
      root.dataset.theme = resolved;
      root.classList.toggle("dark", resolved === "dark");
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [state.settings.interface.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = state.settings.interface.highContrastMode ? "high" : "normal";
  }, [state.settings.interface.highContrastMode]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--cn-bg)] text-[var(--cn-text)]">
      <WorkspaceSidebar />
      <section className="flex min-w-0 flex-1 flex-col bg-[var(--cn-surface)]">{children}</section>

      <SettingsModal />
      <ProfileModal />
      <QuickSearchModal />
    </div>
  );
}


