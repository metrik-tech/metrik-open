import { prisma } from "@metrik/db";
import type { AuditType } from "@metrik/db/client";
import { nid } from "@metrik/id";

export async function logItem(
  type: AuditType,
  {
    userId,
    studioId,
    subject,
  }: {
    userId: string;
    studioId: string;
    subject: string | undefined;
  },
) {
  return prisma.auditItem.create({
    data: {
      id: nid(),
      type,
      userId,
      studioId,
      subject,
    },
  });
}
