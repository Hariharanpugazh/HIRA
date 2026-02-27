import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cn-bg)] text-[var(--cn-text)]">
      <div className="w-full max-w-md rounded-3xl border border-[var(--cn-border)] bg-[var(--cn-surface)] p-6 sm:p-7">
        {children}
      </div>
    </main>
  );
}

