import { AuthHeroIllustration } from "@/components/auth/AuthHeroIllustration";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Log in | Cashewnut",
  description: "Log in to your Cashewnut account"
};

export default function LoginPage() {
  return (
    <div className="w-full">
      <AuthHeroIllustration className="mb-6 h-44 w-full rounded-2xl object-cover md:hidden" />
      <LoginForm />
    </div>
  );
}

