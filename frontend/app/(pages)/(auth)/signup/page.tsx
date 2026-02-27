import { AuthHeroIllustration } from "@/components/auth/AuthHeroIllustration";
import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "Create account | Cashewnut",
  description: "Create your Cashewnut account"
};

export default function SignupPage() {
  return (
    <div className="w-full">
      <AuthHeroIllustration className="mb-6 h-44 w-full rounded-2xl object-cover md:hidden" />
      <SignupForm />
    </div>
  );
}

