import { prisma } from '@/lib/db';

export type AuditEntityType = 'task' | 'board' | 'motivational_message';
export type AuditAction = 'create' | 'delete' | 'update' | 'privacy_change';

export async function writeAuditLog(params: {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    // Do not block the main flow if audit logging fails
    console.error('Failed to write audit log', error);
  }
}


