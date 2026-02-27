"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send reset email');
        }

        setSuccess(true);
      } catch (err: any) {
        console.error('Forgot password error:', err);
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h2 className="mt-3 text-lg font-semibold text-[var(--cn-text)]">Check your email</h2>
        <p className="mt-2 text-sm text-[var(--cn-muted)]">
          A password reset link was sent to <span className="font-semibold text-[var(--cn-text)]">{email}</span>.
        </p>
        <button
          onClick={() => router.push("/(pages)/(auth)/login")}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-[var(--cn-border)] bg-transparent px-4 text-sm font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)]"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cn-muted)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isPending}
          className="h-11 w-full rounded-xl border border-[var(--cn-border-strong)] bg-[var(--cn-surface)] px-4 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)]/40"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !email}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--cn-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--cn-surface-2)] disabled:text-[var(--cn-muted)]"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Sending email..." : "Reset password"}
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => router.push("/(pages)/(auth)/login")}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-[var(--cn-border)] bg-transparent px-4 text-sm font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)]"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}

