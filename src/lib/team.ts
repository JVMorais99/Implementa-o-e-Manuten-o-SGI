import { prisma } from "@/lib/prisma";
import { projectProgress } from "@/lib/progress";
import type { OrgRole } from "@/lib/enums";

// Métricas e visão-geral da equipe para o supervisor (ADMIN). Reaproveita os
// mesmos critérios de status do dashboard (src/lib/metrics.ts), mas escopados ao
// conjunto de clientes sob responsabilidade de um consultor.

const PENDING_REQUIREMENT_STATUSES = ["NAO_INICIADO", "EM_ANALISE"];
const ACTIVE_PROJECT_STATUS = "EM_ANDAMENTO";
const ACTION_CLOSED_STATUSES = ["CONCLUIDO", "CANCELADO"];

export interface ConsultantMetrics {
  clients: number;
  activeProjects: number;
  pendingReqs: number;
  overdueActions: number;
  avgProgress: number;
}

const EMPTY_METRICS: ConsultantMetrics = {
  clients: 0,
  activeProjects: 0,
  pendingReqs: 0,
  overdueActions: 0,
  avgProgress: 0,
};

// Calcula os 5 KPIs restritos a um conjunto de clientes (os do consultor).
export async function computeConsultantMetrics(
  clientIds: string[]
): Promise<ConsultantMetrics> {
  if (clientIds.length === 0) return { ...EMPTY_METRICS };
  const now = new Date();
  const projectScope = { clientId: { in: clientIds } };

  const [activeProjects, pendingReqs, overdueActions, projects] =
    await Promise.all([
      prisma.isoProject.count({
        where: { ...projectScope, status: ACTIVE_PROJECT_STATUS },
      }),
      prisma.projectRequirement.count({
        where: {
          project: projectScope,
          status: { in: PENDING_REQUIREMENT_STATUSES },
        },
      }),
      prisma.actionPlan.count({
        where: {
          projectRequirement: { project: projectScope },
          dueDate: { lt: now },
          status: { notIn: ACTION_CLOSED_STATUSES },
        },
      }),
      prisma.isoProject.findMany({
        where: projectScope,
        select: { requirements: { select: { status: true } } },
      }),
    ]);

  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((s, p) => s + projectProgress(p.requirements), 0) /
            projects.length
        );

  return {
    clients: clientIds.length,
    activeProjects,
    pendingReqs,
    overdueActions,
    avgProgress,
  };
}

export interface TeamMemberRow {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  createdAt: Date;
  metrics: ConsultantMetrics;
  lastActivityAt: Date | null;
}

// Visão-geral da equipe: para cada membro interno (não-CLIENTE), resolve os
// clientes sob sua responsabilidade, calcula os KPIs e a data da última atividade.
export async function listTeamOverview(orgId: string): Promise<TeamMemberRow[]> {
  const members = await prisma.membership.findMany({
    where: { organizationId: orgId, role: { not: "CLIENTE" } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      responsibleClients: { select: { id: true } },
    },
  });

  // Última atividade por ator (1 query agregada).
  const lastByActor = new Map<string, Date>();
  const grouped = await prisma.activityLog.groupBy({
    by: ["actorId"],
    where: { organizationId: orgId },
    _max: { createdAt: true },
  });
  for (const g of grouped) {
    if (g.actorId && g._max.createdAt) lastByActor.set(g.actorId, g._max.createdAt);
  }

  const rows = await Promise.all(
    members.map(async (m) => {
      const clientIds = m.responsibleClients.map((c) => c.id);
      const metrics = await computeConsultantMetrics(clientIds);
      return {
        membershipId: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role as OrgRole,
        createdAt: m.createdAt,
        metrics,
        lastActivityAt: lastByActor.get(m.userId) ?? null,
      };
    })
  );

  return rows;
}
