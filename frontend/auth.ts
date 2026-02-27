// --- NextAuth.js v5+ custom user fields type augmentation ---
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			role?: string;
			tenantId?: string;
			onboardingCompleted?: boolean;
			onboardingStep?: number;
		};
		accessToken?: string;
		error?: string;
	}
}
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import { compare } from "bcrypt";

export const { auth, handlers, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),
	providers: [
		Google,
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					console.error("Email and password are required for authorization");
					return null;
				}
				const user = await prisma.user.findUnique({
					where: { email: String(credentials.email) }
				});
				if (!user || !user.password) {
					console.error("User not found or no password set");
					return null;
				}
				const isValid = await compare(String(credentials.password), String(user.password));
				if (!isValid) {
					console.error("Invalid password provided");
					return null;
				}
				return {
					id: user.id,
					name: user.name || "",
					email: user.email,
					image: user.image || null,
					role: user.role || "",
					tenantId: user.tenantId || "",
					onboardingCompleted: user.onboardingCompleted ?? false,
					onboardingStep: user.onboardingStep ?? 0,
				};
			}
		})
	],
	callbacks: {
		async session(params) {
			const { session, token } = params;
			if (typeof token?.sub === "string" && session?.user) session.user.id = token.sub;
			if (typeof token?.role === "string" && session?.user) session.user.role = token.role;
			if (typeof token?.tenantId === "string" && session?.user) session.user.tenantId = token.tenantId;
			if (typeof token?.onboardingCompleted === 'boolean' && session?.user) session.user.onboardingCompleted = token.onboardingCompleted;
			if (typeof token?.onboardingStep === 'number' && session?.user) session.user.onboardingStep = Number(token.onboardingStep);
			if (typeof token?.accessToken === "string" && session) session.accessToken = token.accessToken;
			if (typeof token?.error === "string" && session) session.error = token.error;
			return session;
		},
		async jwt(params) {
			const { token, user, account, profile } = params;
			if (user) {
				token.sub = user.id;
				token.role = (user as any).role;
				token.tenantId = (user as any).tenantId;
				token.onboardingCompleted = (user as any).onboardingCompleted;
				token.onboardingStep = (user as any).onboardingStep;
				if ((user as any).accessToken) token.accessToken = (user as any).accessToken;
			}
			if (account && profile) token.provider = account.provider;
			return token;
		}
	},
	session: { strategy: "jwt" },
	pages: {
		signIn: '/(pages)/(auth)/login',
		signOut: '/',
		error: '/(pages)/(auth)/login',
	},
	debug: process.env.NODE_ENV === "development",
});