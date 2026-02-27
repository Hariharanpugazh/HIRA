import { AuthHeroIllustration } from "@/components/auth/AuthHeroIllustration";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = {
  title: "Forgot password | Cashewnut",
  description: "Request a password reset email"
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full">
      <AuthHeroIllustration className="mb-6 h-44 w-full rounded-2xl object-cover md:hidden" />

      <div className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--cn-text)]">Forgot password?</h1>
        <p className="mt-2 text-sm text-[var(--cn-muted)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}

