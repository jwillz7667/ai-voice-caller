import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";
import { UserRole, UserStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
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
      authorization: {
        params: {
          scope: "read:user user:email"
        }
      }
    }),

    // Credentials (Email/Password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account locked. Please try again later.");
        }

        // Check account status
        if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
          throw new Error("Account suspended. Please contact support.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Increment failed login count
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: user.failedLoginCount + 1,
              // Lock account after 5 failed attempts
              lockedUntil: user.failedLoginCount >= 4
                ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
                : undefined
            }
          });

          throw new Error("Invalid credentials");
        }

        // Reset failed login count on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lastLoginAt: new Date(),
            lastLoginIp: req?.headers?.["x-forwarded-for"] as string || req?.socket?.remoteAddress,
            loginCount: user.loginCount + 1
          }
        });

        // Create audit log
        await createAuditLog({
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          metadata: {
            method: "credentials",
            ip: req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified
        };
      }
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding"
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! }
      });

      if (existingUser) {
        // Check account status
        if (existingUser.status === UserStatus.BANNED) {
          return false;
        }

        // Update OAuth account info
        if (account?.provider && account.provider !== "credentials") {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId
              }
            },
            update: {
              access_token: account.access_token,
              expires_at: account.expires_at,
              refresh_token: account.refresh_token,
              id_token: account.id_token,
              session_state: account.session_state,
            },
            create: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            }
          });
        }

        // Update login info
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: existingUser.loginCount + 1,
            emailVerified: true, // OAuth users are considered verified
            avatarUrl: profile?.image || existingUser.avatarUrl
          }
        });

        // Create audit log
        await createAuditLog({
          userId: existingUser.id,
          action: "LOGIN",
          entity: "User",
          entityId: existingUser.id,
          metadata: {
            provider: account?.provider || "credentials"
          }
        });
      } else if (account?.provider && account.provider !== "credentials") {
        // Create new user from OAuth
        const newUser = await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name || profile?.name,
            emailVerified: true,
            avatarUrl: profile?.image,
            status: UserStatus.ACTIVE,
            role: UserRole.USER,
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            }
          }
        });

        // Create welcome notification
        await prisma.notification.create({
          data: {
            userId: newUser.id,
            type: "INFO",
            title: "Welcome to Verbio AI!",
            message: "Your account has been created successfully. Start making AI-powered calls today!"
          }
        });

        // Create audit log
        await createAuditLog({
          userId: newUser.id,
          action: "REGISTER",
          entity: "User",
          entityId: newUser.id,
          metadata: {
            provider: account.provider
          }
        });
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session) {
        // Handle session updates
        token = { ...token, ...session };
      }

      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            permissions: true,
            emailVerified: true,
            twoFactorEnabled: true,
            credits: true,
            username: true,
            avatarUrl: true
          }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.permissions = dbUser.permissions;
          token.emailVerified = dbUser.emailVerified;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
          token.credits = dbUser.credits;
          token.username = dbUser.username;
          token.avatarUrl = dbUser.avatarUrl;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.permissions = token.permissions as string[];
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.credits = token.credits as number;
        session.user.username = token.username as string;
        session.user.avatarUrl = token.avatarUrl as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect
      return baseUrl + "/dashboard";
    }
  },

  events: {
    async signOut({ token }) {
      if (token?.id) {
        await createAuditLog({
          userId: token.id as string,
          action: "LOGOUT",
          entity: "User",
          entityId: token.id as string
        });
      }
    }
  },

  debug: process.env.NODE_ENV === "development"
};