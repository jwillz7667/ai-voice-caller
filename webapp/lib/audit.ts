import { prisma } from "@/lib/prisma";

interface AuditLogData {
  userId?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.audit_logs.create({ data: {
        id: crypto.randomUUID(),
        user_id: data.user_id,
        action: data.action,
        entity: data.entity,
        entity_id: data.entity_id,
        oldValues: data.oldValues || undefined,
        newValues: data.newValues || undefined,
        metadata: data.metadata || undefined,
        ip: data.ip,
        user_agent: data.user_agent,
        created_at: new Date(),
        updated_at: new Date()
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

  if (filters.userId) where.user_id = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;

  if (filters.startDate || filters.endDate) {
    where.created_at = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.audit_logs.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: filters.limit || 100,
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
}