"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpenText,
  Briefcase,
  Upload,
  FlaskConical,
  FolderOpen,
  Hash,
  LayoutGrid,
  Library,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  PencilLine,
  Pin,
  Plus,
  Search,
  Sun,
  Trash2,
  X
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";

const navItems = [
  { key: "resume-analyzer", label: "Resume Analyzer", icon: BookOpenText, href: "/dashboard/resume-analyzer" },
  { key: "bulk-upload", label: "Bulk Upload", icon: Upload, href: "/dashboard/bulk-upload" },
  { key: "jobs", label: "Jobs History", icon: Briefcase, href: "/dashboard/jobs" },
] as const;

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, ui, derived, actions } = useDashboard();
  const { data: session } = useSession();

  const isDark = state.settings.interface.theme === "dark" ||
    (state.settings.interface.theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    actions.updateSettingsSection("interface", { theme: next });
  };

  const closeMobileAndNavigate = (href: string) => {
    router.push(href);
    actions.closeMobileSidebar();
  };

  // Use the actual logged-in user's name if available
  const displayName = session?.user?.name || state.profile.name;
  const displayEmail = session?.user?.email || state.profile.email;

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {ui.mobileSidebarOpen ? (
        <button
          type="button"
          onClick={actions.closeMobileSidebar}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-[var(--cn-border)] bg-[var(--cn-sidebar-bg)] text-[var(--cn-text)] transition-all duration-200 md:static",
          ui.sidebarCollapsed ? "w-[80px]" : "w-[280px]",
          ui.mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2 px-1">
            {!ui.sidebarCollapsed ? <div className="text-base font-semibold text-[var(--cn-text)]">HIRA</div> : null}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
              aria-label="Toggle theme"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={actions.toggleSidebarCollapsed}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)] md:inline-flex"
              aria-label="Toggle sidebar"
            >
              {ui.sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={actions.closeMobileSidebar}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)] md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-3 pb-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => actions.closeMobileSidebar()}
                className={`mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition ${isNavActive(pathname, item.href)
                  ? "bg-[var(--cn-surface-3)] text-[var(--cn-text)]"
                  : "text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                  } ${ui.sidebarCollapsed ? "justify-center" : "gap-3"}`}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
                {!ui.sidebarCollapsed ? <span>{item.label}</span> : null}
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={actions.openProfile}
            className={`group flex w-full items-center rounded-2xl p-2 transition-all duration-200 hover:bg-[var(--cn-hover)] ${ui.sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            title={displayName}
          >
            <div className="flex-shrink-0">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                style={{ backgroundColor: state.profile.avatarColor }}
              >
                {initials}
              </div>
            </div>
            {!ui.sidebarCollapsed ? (
              <div className="min-w-0 text-left">
                <div className="truncate text-[14px] font-semibold tracking-tight text-[var(--cn-text)]">{displayName}</div>
                {displayEmail && <div className="truncate text-[11px] text-[var(--cn-muted)]">{displayEmail}</div>}
              </div>
            ) : null}
          </button>
        </div>
      </aside>
    </>
  );
}

function SectionHeader({
  label,
  onAdd,
  actionLabel = "+"
}: {
  label: string;
  onAdd?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="mt-3 flex items-center justify-between px-6 text-[11px] uppercase tracking-[0.14em] text-[var(--cn-muted)]">
      <span>{label}</span>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md px-1 py-0.5 text-[var(--cn-muted)] transition hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}


