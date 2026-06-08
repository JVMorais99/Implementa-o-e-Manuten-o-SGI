import { prisma } from "@/lib/prisma";
import { projectProgress } from "@/lib/progress";

// KPIs do dashboard, calculados no nível da ORGANIZAÇÃO (visão ADMIN). Os mesmos
// critérios de status usados no dashboard e em src/lib/notifications.ts.
const PENDING_REQUIREMENT_STATUSES = ["NAO_INICIADO", "EM_ANALISE"];
const ACTIVE_PROJECT_STATUS = "EM_ANDAMENTO";
const ACTION_CLOSED_STATUSES = ["CONCLUIDO", "CANCELADO"];

export interface OrgMetrics {
  clients: number;
  activeProjects: number;
  pendingReqs: number;
  overdueActions: number;
  avgProgress: number;
}

export type KpiKey = keyof OrgMetrics;

// Para estes KPIs, MENOS é melhor (queda = verde).
const LOWER_IS_BETTER: KpiKey[] = ["pendingReqs", "overdueActions"];

export interface KpiDelta {
  direction: "up" | "down";
  label: string; // ex.: "6%", "1" ou "5 pts"
  tone: "good" | "bad";
  baselineAgeDays: number;
}

function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Calcula os 5 KPIs da organização com queries dedicadas (count) — escopo
// `client.organizationId = orgId`, equivalente à visão do ADMIN.
export async function computeOrgMetrics(orgId: string): Promise<OrgMetrics> {
  const now = new Date();
  const clientScope = { organizationId: orgId };

  const [clients, activeProjects, pendingReqs, overdueActions, projects] =
    await Promise.all([
      prisma.client.count({ where: clientScope }),
      prisma.isoProject.count({
        where: { client: clientScope, status: ACTIVE_PROJECT_STATUS },
      }),
      prisma.projectRequirement.count({
        where: {
          project: { client: clientScope },
          status: { in: PENDING_REQUIREMENT_STATUSES },
        },
      }),
      prisma.actionPlan.count({
        where: {
          projectRequirement: { project: { client: clientScope } },
          dueDate: { lt: now },
          status: { notIn: ACTION_CLOSED_STATUSES },
        },
      }),
      prisma.isoProject.findMany({
        where: { client: clientScope },
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

  return { clients, activeProjects, pendingReqs, overdueActions, avgProgress };
}

// Grava (de forma idempotente) o snapshot do dia para a organização. Chamado no
// load do dashboard: a 1ª visita do dia registra o histórico — sem necessidade de
// cron. Visitas seguintes no mesmo dia atualizam a linha.
export async function recordDailySnapshot(orgId: string): Promise<OrgMetrics> {
  const date = startOfDay();
  const m = await computeOrgMetrics(orgId);
  await prisma.metricSnapshot.upsert({
    where: { organizationId_date: { organizationId: orgId, date } },
    create: { organizationId: orgId, date, ...m },
    update: { ...m },
  });
  return m;
}

// Calcula a variação de cada KPI vs. o snapshot mais próximo de ~30 dias atrás.
// Sem baseline (histórico ainda não acumulado) → retorna {} e os cards mostram só
// o hint, sem inventar número.
export async function getKpiDeltas(
  orgId: string,
  current: OrgMetrics
): Promise<Partial<Record<KpiKey, KpiDelta>>> {
  const baseline =
    (await prisma.metricSnapshot.findFirst({
      where: {
        organizationId: orgId,
        date: { lte: new Date(Date.now() - 28 * DAY_MS) },
      },
      orderBy: { date: "desc" },
    })) ??
    (await prisma.metricSnapshot.findFirst({
      where: { organizationId: orgId },
      orderBy: { date: "asc" },
    }));

  if (!baseline) return {};
  const ageDays = Math.round(
    (startOfDay().getTime() - startOfDay(baseline.date).getTime()) / DAY_MS
  );
  if (ageDays <= 0) return {}; // baseline é de hoje (recém-criado): nada a comparar

  const keys: KpiKey[] = [
    "clients",
    "activeProjects",
    "pendingReqs",
    "overdueActions",
    "avgProgress",
  ];
  const out: Partial<Record<KpiKey, KpiDelta>> = {};

  for (const k of keys) {
    const prev = baseline[k];
    const curr = current[k];
    if (prev === curr) continue; // sem mudança → sem pill

    const diff = curr - prev;
    const direction: "up" | "down" = diff > 0 ? "up" : "down";

    let label: string;
    if (k === "avgProgress") {
      label = `${Math.abs(diff)} pts`;
    } else if (prev > 0) {
      label = `${Math.round((Math.abs(diff) / prev) * 100)}%`;
    } else {
      label = `${Math.abs(diff)}`;
    }

    const lowerBetter = LOWER_IS_BETTER.includes(k);
    const good = lowerBetter ? diff < 0 : diff > 0;

    out[k] = { direction, label, tone: good ? "good" : "bad", baselineAgeDays: ageDays };
  }

  return out;
}
