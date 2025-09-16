import NextAuth from "next-auth";
import type { NextAuthConfig, Session, User as AuthUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";
import { UserRole, UserStatus } from "@prisma/client";
import type { Account, Profile } from "next-auth";

// Extend the built-in session/user types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      status: UserStatus;
      permissions: string[];
      two_factor_enabled: boolean;
      credits?: number;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    status: UserStatus;
    permissions: string[];
    two_factor_enabled: boolean;
    credits?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    permissions: string[];
    two_factor_enabled: boolean;
    credits?: number;
  }
}

export const authConfig = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Credentials Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            status: true,
            email_verified: true,
            two_factor_enabled: true,
            credits: true
          }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        // Check if user is active
        if (user.status !== UserStatus.ACTIVE) {
          throw new Error("Account is not active");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Create audit log
        await createAuditLog({
          user_id: user.id,
          action: "LOGIN",
          details: {
            method: "credentials",
            timestamp: new Date().toISOString()
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          permissions: [],
          two_factor_enabled: user.two_factor_enabled,
          credits: user.credits || 0
        };
      }
    })
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user, account, profile }: {
      user: AuthUser | any;
      account: Account | null;
      profile?: Profile | any;
    }) {
      // OAuth sign in
      if (account?.provider !== "credentials") {
        const email = user.email || profile?.email;

        if (!email) {
          return false;
        }

        try {
          // Check if user exists
          let dbUser = await prisma.users.findUnique({
            where: { email }
          });

          if (!dbUser) {
            // Create new user for OAuth
            dbUser = await prisma.users.create({
              data: {
                email,
                name: user.name || profile?.name,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                email_verified: new Date(),
                credits: 100, // Initial credits
                image: user.image || profile?.image
              }
            });
          }

          // Create OAuth account link if not exists
          const existingAccount = await prisma.accounts.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                provider_account_id: account.provider_account_id
              }
            }
          });

          if (!existingAccount && account) {
            await prisma.accounts.create({
              data: {
                user_id: dbUser.id,
                type: account.type,
                provider: account.provider,
                provider_account_id: account.provider_account_id,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string
              }
            });
          }

          // Create audit log
          await createAuditLog({
            user_id: dbUser.id,
            action: "LOGIN",
            details: {
              method: account.provider,
              timestamp: new Date().toISOString()
            }
          });

          return true;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }: {
      token: JWT;
      user?: AuthUser | any;
      trigger?: "signIn" | "signUp" | "update";
      session?: any;
    }) {
      if (trigger === "update" && session) {
        // Handle session updates
        token = { ...token, ...session };
      }

      if (user) {
        // Initial sign in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || UserRole.USER;
        token.status = user.status || UserStatus.ACTIVE;
        token.permissions = user.permissions || [];
        token.two_factor_enabled = user.two_factor_enabled || false;
        token.credits = user.credits || 0;
      } else if (token.id) {
        // Subsequent requests - refresh user data
        const dbUser = await prisma.users.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            status: true,
            two_factor_enabled: true,
            credits: true
          }
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.two_factor_enabled = dbUser.twoFactorEnabled;
          token.credits = dbUser.credits || 0;
        }
      }

      return token;
    },

    async session({ session, token }: {
      session: Session;
      token: JWT;
    }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email!;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.permissions = token.permissions;
        session.user.two_factor_enabled = token.twoFactorEnabled;
        session.user.credits = token.credits;
      }

      return session;
    },

    async redirect({ url, baseUrl }: {
      url: string;
      baseUrl: string;
    }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);