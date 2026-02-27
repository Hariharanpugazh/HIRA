"use client";

import { FormEvent, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate that we have a token
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please try again.");
    }
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Missing reset token. Please try again.");
      return;
    }

    startTransition(async () => {
      try {
        // Call your API to reset the password
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to reset password');
        }

        setSuccess(true);
      } catch (err: any) {
        console.error('Password reset error:', err);
        setError(err.message || 'An unexpected error occurred during password reset.');
      }
    });
  };

  if (success) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--cn-text)]">Password updated!</h1>
          <p className="mt-1 text-sm text-[var(--cn-muted)]">Your password has been successfully reset.</p>
        </div>

        <div className="pt-4">
          <Link 
            href="/(pages)/(auth)/login" 
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[var(--cn-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cn-text)]">Reset password</h1>
        <p className="mt-1 text-sm text-[var(--cn-muted)]">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cn-muted)]">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-11 w-full rounded-xl border border-[var(--cn-border-strong)] bg-[var(--cn-surface)] px-4 pr-12 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)]/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cn-muted)]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-11 w-full rounded-xl border border-[var(--cn-border-strong)] bg-[var(--cn-surface)] px-4 pr-12 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)]/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-[var(--cn-muted)] hover:text-[var(--cn-text)]"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !password || !confirmPassword}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--cn-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--cn-surface-2)] disabled:text-[var(--cn-muted)]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Resetting password..." : "Reset password"}
        </button>

        <div className="text-center">
          <Link href="/(pages)/(auth)/login" className="text-xs font-medium text-[var(--cn-muted)] hover:text-[var(--cn-text)]">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}