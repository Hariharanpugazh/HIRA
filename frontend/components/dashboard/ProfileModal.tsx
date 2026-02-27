"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "./DashboardProvider";
import { Modal } from "./Modal";

const statuses = ["online", "away", "focus", "offline"] as const;

export function ProfileModal() {
  const router = useRouter();
  const { ui, state, actions } = useDashboard();

  const initials = useMemo(() => {
    return state.profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [state.profile.name]);

  return (
    <Modal open={ui.profileOpen} onClose={actions.closeProfile} title="Profile" widthClassName="max-w-md">
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: state.profile.avatarColor }}
          >
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--cn-text)]">{state.profile.name}</div>
            <div className="text-xs text-[var(--cn-muted)]">{state.profile.email}</div>
          </div>
        </div>

        <div className="grid gap-3">
          <ProfileInput
            label="Name"
            value={state.profile.name}
            onChange={(value) => actions.updateProfile({ name: value })}
          />
          <ProfileInput
            label="Handle"
            value={state.profile.handle}
            onChange={(value) => actions.updateProfile({ handle: value })}
          />
          <ProfileInput
            label="Email"
            value={state.profile.email}
            onChange={(value) => actions.updateProfile({ email: value })}
          />
          <ProfileInput
            label="Role"
            value={state.profile.role}
            onChange={(value) => actions.updateProfile({ role: value })}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">Status</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => actions.setPresenceStatus(status)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${state.profile.status === status
                  ? "bg-[var(--cn-accent)] text-white shadow-sm"
                  : "bg-[var(--cn-surface-3)] text-[var(--cn-muted)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)]"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[var(--cn-border)] bg-[var(--cn-surface-2)] p-4 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--cn-muted-2)]">
          <div>
            <div className="text-lg font-semibold text-[var(--cn-text)]">{state.chats.length}</div>
            Chats
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--cn-text)]">{state.projects.length}</div>
            Projects
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--cn-text)]">{state.notes.length}</div>
            Notes
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={actions.closeProfile}
            className="flex-1 h-10 rounded-xl bg-[var(--cn-accent)] text-sm font-semibold text-[var(--cn-accent-contrast)] transition hover:opacity-90 active:scale-[0.98] shadow-sm"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => {
              actions.closeProfile();
              router.push("/login");
            }}
            className="flex-1 h-10 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:border-red-200 active:scale-[0.98]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProfileInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cn-muted)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] px-3.5 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)] focus:ring-2 focus:ring-[var(--cn-accent-soft)]"
      />
    </label>
  );
}


