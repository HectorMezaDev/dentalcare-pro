import prisma from "../lib/prisma";

export const logAudit = async (action: string, entity: string, entityId: string, userId: string, details?: string) => {
  try {
    await prisma.auditLog.create({
      data: { action, entity, entityId, userId, details }
    });
  } catch (error) {
    console.error("Audit Log Error:", error);
  }
};
