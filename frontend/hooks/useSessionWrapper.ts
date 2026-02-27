'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';

export const useAuthSession = () => {
  const { data: session, status, update } = useSession();

  return {
    session: session as Session & {
      user: {
        id: string;
        role?: string;
        tenantId?: string;
        onboardingCompleted?: boolean;
        onboardingStep?: number;
      } & Session['user'];
      accessToken?: string;
      error?: 'RefreshAccessTokenError';
    } | null,
    status,
    signIn,
    signOut,
    update
  };
};