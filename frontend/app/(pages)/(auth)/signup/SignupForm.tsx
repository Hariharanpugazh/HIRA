"use client";

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const isLoading = isPending || isGooglePending;

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    }),
    [password]
  );

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!isPasswordStrong) {
      nextErrors.password = "Use at least 8 chars with upper, lower, and a number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    // For signup, we need to call your backend API to create the user first
    // Then we can sign in with the credentials
    startTransition(async () => {
      try {
        // First, create the user via your API
        const createUserResponse = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        });

        const createUserResult = await createUserResponse.json();

        if (!createUserResponse.ok) {
          throw new Error(createUserResult.message || 'Failed to create user');
        }

        // Now attempt to sign in with the new credentials
        const result = await signIn("credentials", {
          email,
          password,
          callbackUrl: "/dashboard",
          redirect: false, // Prevent automatic redirect so we can handle it ourselves
        });

        if (result?.error) {
          setError(`Sign in failed: ${result.error}`);
        } else if (result?.ok) {
          router.push("/dashboard");
          router.refresh(); // Refresh to update the session context
        }
      } catch (error: any) {
        console.error("Signup error:", error);
        setError(error.message || "An unexpected error occurred during registration.");
      }
    });
  };

  const handleGoogleSignup = () => {
    setError(null);
    startGoogleTransition(async () => {
      try {
        await signIn("google", {
          callbackUrl: "/dashboard",
        });
      } catch (error) {
        console.error("Google sign-up error:", error);
        setError("An unexpected error occurred during Google sign-up.");
      }
    });
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    if (errors.name) {
      setErrors((current) => ({ ...current, name: undefined }));
    }
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (errors.email) {
      setErrors((current) => ({ ...current, email: undefined }));
    }
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (errors.password) {
      setErrors((current) => ({ ...current, password: undefined }));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--cn-text)]">Create account</h1>
        <p className="mt-2 text-sm text-[var(--cn-muted)]">Create your Cashewnut account and start chatting.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cn-muted)]">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              autoComplete="name"
              placeholder="Enter your full name"
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[var(--cn-border-strong)] bg-[var(--cn-surface)] px-4 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)]/40"
              required
            />
            {errors.name ? <p className="text-xs text-red-300">{errors.name}</p> : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cn-muted)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[var(--cn-border-strong)] bg-[var(--cn-surface)] px-4 text-sm text-[var(--cn-text)] outline-none transition focus:border-[var(--cn-accent)]/40"
              required
            />
            {errors.email ? <p className="text-xs text-red-300">{errors.email}</p> : null}
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
                onChange={handlePasswordChange}
                autoComplete="new-password"
                placeholder="Create a strong password"
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

            <div className="mt-2 space-y-1 rounded-xl border border-[var(--cn-border)] bg-[var(--cn-surface)] px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-[var(--cn-muted)]">
                {passwordChecks.length ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-[var(--cn-muted-2)]" />}
                At least 8 characters
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--cn-muted)]">
                {passwordChecks.uppercase ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-[var(--cn-muted-2)]" />}
                One uppercase letter
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--cn-muted)]">
                {passwordChecks.lowercase ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-[var(--cn-muted-2)]" />}
                One lowercase letter
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--cn-muted)]">
                {passwordChecks.number ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-[var(--cn-muted-2)]" />}
                One number
              </div>
            </div>
            {errors.password ? <p className="text-xs text-red-300">{errors.password}</p> : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !name || !email || !password || !isPasswordStrong}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--cn-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--cn-surface-2)] disabled:text-[var(--cn-muted)]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Creating account..." : "Create account"}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-[var(--cn-border)]" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--cn-muted-2)]">or</span>
          <div className="h-px flex-1 bg-[var(--cn-border)]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--cn-border)] bg-transparent px-4 text-sm font-semibold text-[var(--cn-text)] transition hover:bg-[var(--cn-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGooglePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
          Continue with Google
        </button>

        <p className="pt-2 text-center text-xs text-[var(--cn-muted)]">
          Already have an account?{" "}
          <Link href="/(pages)/(auth)/login" className="font-semibold text-[var(--cn-text)] hover:opacity-80">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}