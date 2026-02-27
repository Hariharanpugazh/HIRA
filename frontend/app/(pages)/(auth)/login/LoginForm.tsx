"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallbackUrl = searchParams.get("callbackUrl") || searchParams.get("returnUrl");
  const callbackUrl = requestedCallbackUrl?.startsWith("/") ? requestedCallbackUrl : "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const isLoading = isPending || isGooglePending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          callbackUrl,
          redirect: false, // Prevent automatic redirect so we can handle it ourselves
        });

        if (result?.error) {
          setError(result.error);
        } else if (result?.ok) {
          router.push(callbackUrl);
          router.refresh(); // Refresh to update the session context
        }
      } catch (error) {
        console.error("Login error:", error);
        setError("An unexpected error occurred during login.");
      }
    });
  };

  const handleGoogleSignIn = () => {
    setError(null);
    startGoogleTransition(async () => {
      try {
        await signIn("google", {
          callbackUrl,
        });
      } catch (error) {
        console.error("Google sign-in error:", error);
        setError("An unexpected error occurred during Google sign-in.");
      }
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--cn-text)]">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--cn-muted)]">Sign in to continue to Cashewnut.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
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
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[var(--cn-border-strong)] bg-[var(--cn-surface)] px-4 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)]/40"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cn-muted)]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={isLoading}
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

            <div className="flex justify-end pt-1">
              <Link href="/(pages)/(auth)/forgot-password" title="Forgot Password" className="text-xs font-medium text-[var(--cn-accent)] hover:opacity-80">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--cn-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--cn-surface-2)] disabled:text-[var(--cn-muted)]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Signing in..." : "Login"}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-[var(--cn-border)]" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--cn-muted-2)]">or</span>
          <div className="h-px flex-1 bg-[var(--cn-border)]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--cn-border)] bg-transparent px-4 text-sm font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGooglePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
          Continue with Google
        </button>

        <p className="pt-2 text-center text-xs text-[var(--cn-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/(pages)/(auth)/signup" className="font-semibold text-[var(--cn-text)] hover:opacity-80">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}