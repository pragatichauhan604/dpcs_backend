import { prisma } from "../lib/prisma";

export const audit = async (data: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  description?: string;
}) => {
  await prisma.auditLog.create({ data });
};
