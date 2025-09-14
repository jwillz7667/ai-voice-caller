import { UserRole, UserStatus } from "@prisma/client";
import "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      status: UserStatus;
      permissions: string[];
      emailVerified: boolean;
      twoFactorEnabled: boolean;
      credits: number;
      username?: string | null;
      avatarUrl?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    status: UserStatus;
    permissions: string[];
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    credits: number;
    username?: string | null;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    status: UserStatus;
    permissions: string[];
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    credits: number;
    username?: string | null;
    avatarUrl?: string | null;
  }
}