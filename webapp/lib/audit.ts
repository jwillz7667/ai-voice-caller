import { prisma } from "@/lib/prisma";

interface AuditLogData {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValues: data.oldValues || undefined,
        newValues: data.newValues || undefined,
        metadata: data.metadata || undefined,
        ip: data.ip,
        userAgent: data.userAgent
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit || 100,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
}