import { UserRole } from "@prisma/client";
import { auth } from "../auth";
import { NextResponse } from "next/server";

// Define role hierarchy
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.MODERATOR]: 60,
  [UserRole.USER]: 40,
  [UserRole.GUEST]: 20,
};

// Define permissions for each role
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ["*"], // All permissions
  [UserRole.ADMIN]: [
    "users.read",
    "users.write",
    "users.delete",
    "calls.read",
    "calls.write",
    "calls.delete",
    "analytics.read",
    "settings.read",
    "settings.write",
    "billing.read",
    "billing.write",
  ],
  [UserRole.MODERATOR]: [
    "users.read",
    "users.write",
    "calls.read",
    "calls.write",
    "analytics.read",
    "settings.read",
  ],
  [UserRole.USER]: [
    "profile.read",
    "profile.write",
    "calls.read",
    "calls.write",
    "analytics.read:own",
    "billing.read:own",
  ],
  [UserRole.GUEST]: [
    "profile.read:own",
    "calls.read:own",
  ],
};

// Check if user has a specific permission
export function hasPermission(
  userRole: UserRole,
  userPermissions: string[],
  requiredPermission: string,
  context?: { ownerId?: string; userId?: string }
): boolean {
  // Super admin has all permissions
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Check if permission ends with :own and validate ownership
  if (requiredPermission.endsWith(":own")) {
    if (!context?.ownerId || !context?.userId) {
      return false;
    }
    if (context.ownerId !== context.userId) {
      return false;
    }
    // Remove :own suffix for further checking
    requiredPermission = requiredPermission.replace(":own", "");
  }

  // Check user's custom permissions first
  if (userPermissions.includes(requiredPermission) || userPermissions.includes("*")) {
    return true;
  }

  // Check role-based permissions
  const rolePerms = rolePermissions[userRole] || [];
  return rolePerms.includes(requiredPermission) || rolePerms.includes("*");
}

// Check if user has minimum role level
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

// Middleware to check permissions
export async function requirePermission(
  permission: string,
  context?: { ownerId?: string }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const hasAccess = hasPermission(
    session.user.role,
    session.user.permissions || [],
    permission,
    {
      user_id: session.user.id,
      ownerId: context?.ownerId,
    }
  );

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return null; // Access granted
}

// Middleware to check minimum role
export async function requireRole(minimumRole: UserRole) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!hasMinimumRole(session.user.role, minimumRole)) {
    return NextResponse.json(
      { error: "Insufficient role privileges" },
      { status: 403 }
    );
  }

  return null; // Access granted
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): string[] {
  return rolePermissions[role] || [];
}

// Check multiple permissions (AND logic)
export function hasAllPermissions(
  userRole: UserRole,
  userPermissions: string[],
  requiredPermissions: string[],
  context?: { ownerId?: string; userId?: string }
): boolean {
  return requiredPermissions.every((permission) =>
    hasPermission(userRole, userPermissions, permission, context)
  );
}

// Check multiple permissions (OR logic)
export function hasAnyPermission(
  userRole: UserRole,
  userPermissions: string[],
  requiredPermissions: string[],
  context?: { ownerId?: string; userId?: string }
): boolean {
  return requiredPermissions.some((permission) =>
    hasPermission(userRole, userPermissions, permission, context)
  );
}