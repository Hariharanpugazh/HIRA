import { auth } from "@/auth";

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user ?? null;
};

export const getCurrentUserOrRedirect = async () => {
  const session = await auth();
  if (!session?.user) {
    // We can't redirect from here since it would break the return type
    // Instead, components should check if user exists and redirect themselves
    return null;
  }
  return session.user;
};