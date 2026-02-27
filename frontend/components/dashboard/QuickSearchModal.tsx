"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  MessageSquare,
  FileBox,
  Layout,
  Box,
  Zap,
  DraftingCompass,
  Cpu,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import { Modal } from "./Modal";

const filterDefinitions = [
  { id: "all", label: "All", icon: Command },
  { id: "channel", label: "Channels", icon: MessageSquare },
  { id: "chat", label: "Chats", icon: MessageSquare },
  { id: "note", label: "Notes", icon: FileBox },
  { id: "project", label: "Projects", icon: Layout },
  { id: "model", label: "Models", icon: Cpu },
  { id: "prompt", label: "Prompts", icon: Zap },
  { id: "tool", label: "Tools", icon: Box },
  { id: "function", label: "Functions", icon: DraftingCompass },
  { id: "skill", label: "Skills", icon: Zap },
  { id: "knowledge", label: "Knowledge", icon: BookOpen }
] as const;

type FilterValue = (typeof filterDefinitions)[number]["id"];

export function QuickSearchModal() {
  const router = useRouter();
  const { ui, actions } = useDashboard();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const results = useMemo(() => actions.search(query, filter), [actions, filter, query]);

  const close = () => {
    setQuery("");
    setFilter("all");
    actions.closeQuickSearch();
  };

  const openResult = (result: any) => {
    if (result.type === "channel") actions.setActiveChannel(result.id);
    if (result.type === "chat") actions.setActiveChat(result.id);
    if (result.type === "note") actions.setActiveNote(result.id);
    if (result.type === "project") actions.setActiveProject(result.id);
    if (result.type === "model") actions.setSelectedModel(result.id);

    close();
    router.push(result.route);
  };

  return (
    <Modal
      open={ui.quickSearchOpen}
      onClose={close}
      title="Search"
      widthClassName="max-w-2xl"
      hideHeader
      glass
      position="top"
    >
      <div className="flex flex-col p-2 pt-3">
        {/* Search Launcher Header */}
        <div className="flex items-center gap-2 px-1 pb-3">
          {/* Main Search Pill */}
          <div className="group relative flex flex-1 items-center rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-1.5 shadow-sm transition-all focus-within:border-[var(--cn-border-strong)] focus-within:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center text-[var(--cn-muted-2)]">
              <Search className="h-5 w-5" />
            </div>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  openResult(results[0]);
                }
              }}
              placeholder="Type to search..."
              className="h-10 w-full bg-transparent text-base text-[var(--cn-text)] outline-none placeholder:text-[var(--cn-muted-2)]"
            />
            <div className="mr-2 flex items-center gap-1 rounded-md border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--cn-muted-2)]">
              <Command className="h-3.5 w-3.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-1 pb-3 scrollbar-hidden">
          {filterDefinitions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all ${filter === item.id
                ? "border-[var(--cn-border-strong)] bg-[var(--cn-surface-3)] text-[var(--cn-text)]"
                : "border-[var(--cn-border)] bg-transparent text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-[50vh] min-h-[280px] flex-1 space-y-0.5 overflow-y-auto px-1 pb-2 scrollbar-hidden">
          {query.trim() && results.length === 0 ? (
            <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--cn-border)] bg-[var(--cn-surface-2)]/50 p-8 text-center">
              <div className="mb-2 text-sm font-semibold text-[var(--cn-text)]">No matches found</div>
              <div className="text-xs text-[var(--cn-muted-2)]">Adjust your query or filters and try again.</div>
            </div>
          ) : null}

          {!query.trim() && (
            <div className="px-2 py-3">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--cn-muted-2)] opacity-60">Suggestions</div>
              <div className="grid grid-cols-2 gap-2">
                {filterDefinitions.slice(1, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-3 text-left transition-all hover:border-[var(--cn-border-strong)] hover:bg-[var(--cn-surface-2)] group shadow-sm"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cn-surface-2)] text-[var(--cn-muted-2)] group-hover:text-[var(--cn-text)]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="text-[11px] font-bold text-[var(--cn-text)]">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => openResult(result)}
              className="group flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 transition-all hover:bg-[var(--cn-hover)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cn-surface-2)] text-[var(--cn-muted-2)] group-hover:bg-[var(--cn-surface-3)] group-hover:text-[var(--cn-text)]">
                  {filterDefinitions.find(f => f.id === result.type)?.icon({ className: "h-4.5 w-4.5" }) || <Command className="h-4.5 w-4.5" />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[var(--cn-text)]">{result.title}</div>
                  <div className="text-xs text-[var(--cn-muted-2)] line-clamp-1">{result.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="min-w-[70px] rounded-md border border-[var(--cn-border)] bg-[var(--cn-surface-2)] px-1.5 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-[var(--cn-muted-2)]">
                  {result.type}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--cn-muted-2)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>

        {/* Launcher Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-[var(--cn-border)] px-4 py-3 text-[10px] text-[var(--cn-muted-2)]">
          <div className="flex items-center gap-4 font-bold">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-[var(--cn-border)] bg-[var(--cn-surface-2)] text-[8px] font-bold">↵</span>
              <span className="opacity-80">Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-6 items-center justify-center rounded border border-[var(--cn-border)] bg-[var(--cn-surface-2)] text-[8px] font-bold">ESC</span>
              <span className="opacity-80">Dismiss</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[var(--cn-text)] opacity-40">
            <Search className="h-3 w-3" />
            <span>Workspace Search</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}


