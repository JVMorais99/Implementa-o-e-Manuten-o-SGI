import { prisma } from "@/lib/prisma";
import type { AccessContext } from "@/lib/session";
import type { ActivityAction } from "@/lib/enums";

// Trilha de atividades (accountability). Registra quem fez o quê e quando, com
// escopo opcional por cliente/projeto. A gravação é best-effort: qualquer falha é
// engolida para nunca quebrar a ação principal que disparou o log.

interface LogInput {
  action: ActivityAction;
  entityType: string; // ex.: "requirement", "document", "client", "member"
  entityId: string;
  summary: string; // texto PT-BR pronto para exibir
  clientId?: string | null; // escopo p/ visão do supervisor (clientWhere)
  projectId?: string | null;
}

export async function logActivity(ctx: AccessContext, input: LogInput): Promise<void> {
  if (!ctx.orgId) return;
  try {
    await prisma.activityLog.create({
      data: {
        organizationId: ctx.orgId,
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? ctx.user.email ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        clientId: input.clientId ?? null,
        projectId: input.projectId ?? null,
        summary: input.summary,
      },
    });
  } catch {
    // best-effort — não propaga erro de log
  }
}

export interface ActivityEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  clientId: string | null;
  projectId: string | null;
  summary: string;
  createdAt: Date;
}

// Feed de atividades escopado pelo acesso do usuário: ADMIN vê tudo da organização;
// os demais veem apenas atividades dos clientes a que têm acesso. `actorId` filtra
// por um membro específico (usado no painel do consultor).
export async function getRecentActivity(
  ctx: AccessContext,
  opts: { limit?: number; actorId?: string } = {}
): Promise<ActivityEntry[]> {
  if (!ctx.orgId) return [];
  const where: {
    organizationId: string;
    clientId?: { in: string[] };
    actorId?: string;
  } = { organizationId: ctx.orgId };
  // clientIds nulo (ADMIN) → sem restrição; array → só os clientes do usuário.
  if (ctx.clientIds) {
    where.clientId = { in: ctx.clientIds.length ? ctx.clientIds : ["__none__"] };
  }
  if (opts.actorId) where.actorId = opts.actorId;
  return prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 12,
  });
}
