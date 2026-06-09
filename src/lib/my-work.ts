import { prisma } from "@/lib/prisma";
import { clientWhere, type AccessContext } from "@/lib/session";
import { nextSurveillanceDate, daysUntil } from "@/lib/certifications";

// "Meu trabalho": visão pessoal do consultor. Reúne, escopado aos clientes sob sua
// responsabilidade direta (Client.responsibleMembership = o seu membership), tudo
// que exige ação — a fila de tarefas (requisitos a tratar, planos de ação abertos,
// documentos parados) — e a agenda de prazos (vencidos / hoje / semana / adiante).
//
// Difere das notificações (src/lib/notifications.ts): aquelas alertam só o que está
// vencido/parado para o sino; aqui é a carga de trabalho completa do consultor.

// Status de requisito em que a bola está com o consultor (precisa agir).
const REQ_NEEDS_CONSULTANT = [
  "NAO_INICIADO",
  "RECEBIDO_CLIENTE",
  "EM_ANALISE",
  "NAO_CONFORME",
  "PARCIAL",
];
// Status de plano de ação considerados encerrados (saem da fila).
const ACTION_CLOSED = ["CONCLUIDO", "CANCELADO"];
// Status de requisito já concluídos (não geram prazo na agenda).
const REQ_DONE = ["CONFORME", "NAO_APLICAVEL"];

export interface MyScope {
  membershipId: string | null;
  clientIds: string[];
  // true = restrito aos clientes sob responsabilidade direta (dono);
  // false = caiu no fallback dos clientes acessíveis (sem responsabilidade atribuída).
  ownsClients: boolean;
}

// Resolve o escopo de "meu trabalho": prioriza os clientes sob responsabilidade
// direta do usuário; se ainda não há nenhum atribuído, cai nos clientes acessíveis
// (clientWhere) para não deixar a tela vazia em contas recém-configuradas.
export async function resolveMyScope(ctx: AccessContext): Promise<MyScope> {
  if (!ctx.orgId) return { membershipId: null, clientIds: [], ownsClients: false };

  const membership = await prisma.membership.findFirst({
    where: { organizationId: ctx.orgId, userId: ctx.user.id },
    select: { id: true },
  });

  if (membership) {
    const owned = await prisma.client.findMany({
      where: { organizationId: ctx.orgId, responsibleMembershipId: membership.id },
      select: { id: true },
    });
    if (owned.length > 0) {
      return {
        membershipId: membership.id,
        clientIds: owned.map((c) => c.id),
        ownsClients: true,
      };
    }
  }

  const accessible = await prisma.client.findMany({
    where: clientWhere(ctx),
    select: { id: true },
  });
  return {
    membershipId: membership?.id ?? null,
    clientIds: accessible.map((c) => c.id),
    ownsClients: false,
  };
}

export type TaskKind = "REQ" | "ACTION" | "DOC";

export interface WorkTask {
  id: string;
  kind: TaskKind;
  title: string;
  client: string;
  reqCode: string | null;
  status: string; // status cru (para o badge correspondente ao kind)
  href: string;
  dueDate: Date | null;
  overdue: boolean;
}

export type AgendaKind = "ACTION" | "REQ" | "PROJECT" | "AUDIT" | "FINDING" | "CERT";

// Horizonte (dias) para trazer prazos de manutenção à agenda — evita poluir com
// vencimentos a anos de distância.
const CERT_AGENDA_HORIZON_DAYS = 180;

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  date: Date;
  title: string;
  subtitle: string;
  href: string;
}

export type AgendaBucketKey = "overdue" | "today" | "week" | "later";

export interface AgendaBucket {
  key: AgendaBucketKey;
  label: string;
  items: AgendaItem[];
}

export interface MyWork {
  tasks: WorkTask[];
  agenda: AgendaBucket[];
  counts: { open: number; overdue: number; dueThisWeek: number; clients: number };
}

const reqHref = (projectId: string, prId: string) =>
  `/projetos/${projectId}/requisitos/${prId}`;

// Calcula a fila de tarefas e a agenda do consultor para um conjunto de clientes.
export async function getMyWork(clientIds: string[]): Promise<MyWork> {
  const empty: MyWork = {
    tasks: [],
    agenda: [],
    counts: { open: 0, overdue: 0, dueThisWeek: 0, clients: clientIds.length },
  };
  if (clientIds.length === 0) return empty;

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  const weekEnd = new Date(startToday);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const projectScope = { clientId: { in: clientIds } };

  const [reqs, actions, sentDocs, signedDocs, projects, audits, findings, certs] =
    await Promise.all([
      // Requisitos com a bola no consultor.
      prisma.projectRequirement.findMany({
        where: { project: projectScope, status: { in: REQ_NEEDS_CONSULTANT } },
        orderBy: [{ dueDate: "asc" }, { updatedAt: "asc" }],
        include: {
          project: { select: { id: true, client: { select: { name: true } } } },
          requirement: { select: { code: true, title: true } },
        },
      }),
      // Planos de ação abertos.
      prisma.actionPlan.findMany({
        where: {
          projectRequirement: { project: projectScope },
          status: { notIn: ACTION_CLOSED },
        },
        orderBy: { dueDate: "asc" },
        include: {
          projectRequirement: {
            select: {
              id: true,
              projectId: true,
              project: { select: { client: { select: { name: true } } } },
              requirement: { select: { code: true } },
            },
          },
        },
      }),
      // Documentos enviados ao cliente sem retorno (acompanhar).
      prisma.generatedDocument.findMany({
        where: {
          projectRequirement: { project: projectScope },
          sentToClientAt: { not: null },
          signedReceivedAt: null,
        },
        orderBy: { sentToClientAt: "asc" },
        include: {
          projectRequirement: {
            select: {
              id: true,
              projectId: true,
              project: { select: { client: { select: { name: true } } } },
              requirement: { select: { code: true } },
            },
          },
        },
      }),
      // Documentos assinados aguardando aprovação do consultor.
      prisma.generatedDocument.findMany({
        where: {
          projectRequirement: { project: projectScope },
          signedReceivedAt: { not: null },
          status: { not: "APROVADO" },
        },
        orderBy: { signedReceivedAt: "asc" },
        include: {
          projectRequirement: {
            select: {
              id: true,
              projectId: true,
              project: { select: { client: { select: { name: true } } } },
              requirement: { select: { code: true } },
            },
          },
        },
      }),
      // Prazos de projeto (agenda).
      prisma.isoProject.findMany({
        where: { ...projectScope, status: "EM_ANDAMENTO", dueDate: { not: null } },
        select: {
          id: true,
          type: true,
          dueDate: true,
          client: { select: { name: true } },
        },
      }),
      // Auditorias agendadas (agenda).
      prisma.audit.findMany({
        where: {
          project: projectScope,
          status: { in: ["PLANEJADA", "EM_ANDAMENTO"] },
          plannedDate: { not: null },
        },
        select: {
          id: true,
          title: true,
          plannedDate: true,
          project: { select: { client: { select: { name: true } } } },
        },
      }),
      // Constatações de auditoria com prazo em aberto (agenda).
      prisma.auditFinding.findMany({
        where: {
          audit: { project: projectScope },
          status: { not: "ENCERRADA" },
          dueDate: { not: null },
        },
        select: {
          id: true,
          description: true,
          dueDate: true,
          requirementCode: true,
          audit: { select: { id: true, project: { select: { client: { select: { name: true } } } } } },
        },
      }),
      // Certificações ativas (agenda de manutenção: vigilância + recertificação).
      prisma.certification.findMany({
        where: { clientId: { in: clientIds }, status: { not: "CANCELADA" } },
        select: {
          id: true,
          issuedAt: true,
          expiresAt: true,
          surveillanceIntervalMonths: true,
          lastSurveillanceAt: true,
          status: true,
          client: { select: { name: true } },
          standard: { select: { code: true } },
        },
      }),
    ]);

  // ---- Fila de tarefas ----
  const tasks: WorkTask[] = [];

  for (const r of reqs) {
    tasks.push({
      id: `req-${r.id}`,
      kind: "REQ",
      title: `${r.requirement.code} · ${r.requirement.title}`,
      client: r.project.client.name,
      reqCode: r.requirement.code,
      status: r.status,
      href: reqHref(r.project.id, r.id),
      dueDate: r.dueDate,
      overdue: r.dueDate != null && r.dueDate < startToday,
    });
  }
  for (const a of actions) {
    const pr = a.projectRequirement;
    tasks.push({
      id: `action-${a.id}`,
      kind: "ACTION",
      title: a.action,
      client: pr.project.client.name,
      reqCode: pr.requirement.code,
      status: a.status,
      href: reqHref(pr.projectId, pr.id),
      dueDate: a.dueDate,
      overdue: a.dueDate != null && a.dueDate < startToday,
    });
  }
  for (const d of [...signedDocs, ...sentDocs]) {
    const pr = d.projectRequirement;
    const awaitingApproval = d.signedReceivedAt != null;
    tasks.push({
      id: `doc-${d.id}`,
      kind: "DOC",
      title: awaitingApproval
        ? `Aprovar "${d.title}"`
        : `Acompanhar assinatura de "${d.title}"`,
      client: pr.project.client.name,
      reqCode: pr.requirement.code,
      status: d.status,
      href: reqHref(pr.projectId, pr.id),
      dueDate: null,
      overdue: false,
    });
  }

  // Vencidos primeiro; depois por prazo (sem prazo ao fim); por fim, kind.
  const kindRank: Record<TaskKind, number> = { REQ: 0, ACTION: 1, DOC: 2 };
  tasks.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    const at = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bt = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    return kindRank[a.kind] - kindRank[b.kind];
  });

  // ---- Agenda ----
  const agendaItems: AgendaItem[] = [];

  for (const a of actions) {
    if (!a.dueDate) continue;
    const pr = a.projectRequirement;
    agendaItems.push({
      id: `a-action-${a.id}`,
      kind: "ACTION",
      date: a.dueDate,
      title: a.action,
      subtitle: `${pr.project.client.name} · ${pr.requirement.code}`,
      href: reqHref(pr.projectId, pr.id),
    });
  }
  for (const r of reqs) {
    if (!r.dueDate || REQ_DONE.includes(r.status)) continue;
    agendaItems.push({
      id: `a-req-${r.id}`,
      kind: "REQ",
      date: r.dueDate,
      title: `Requisito ${r.requirement.code}`,
      subtitle: `${r.project.client.name} · ${r.requirement.title}`,
      href: reqHref(r.project.id, r.id),
    });
  }
  for (const p of projects) {
    if (!p.dueDate) continue;
    agendaItems.push({
      id: `a-proj-${p.id}`,
      kind: "PROJECT",
      date: p.dueDate,
      title: `Prazo do projeto · ${p.type}`,
      subtitle: p.client.name,
      href: `/projetos/${p.id}`,
    });
  }
  for (const au of audits) {
    if (!au.plannedDate) continue;
    agendaItems.push({
      id: `a-audit-${au.id}`,
      kind: "AUDIT",
      date: au.plannedDate,
      title: `Auditoria · ${au.title}`,
      subtitle: au.project.client.name,
      href: `/auditorias/${au.id}`,
    });
  }
  for (const f of findings) {
    if (!f.dueDate) continue;
    agendaItems.push({
      id: `a-finding-${f.id}`,
      kind: "FINDING",
      date: f.dueDate,
      title: `Constatação${f.requirementCode ? ` ${f.requirementCode}` : ""}`,
      subtitle: `${f.audit.project.client.name} · ${f.description}`,
      href: `/auditorias/${f.audit.id}`,
    });
  }
  for (const c of certs) {
    // Recertificação (validade) dentro do horizonte.
    if (daysUntil(c.expiresAt) <= CERT_AGENDA_HORIZON_DAYS) {
      agendaItems.push({
        id: `a-recert-${c.id}`,
        kind: "CERT",
        date: c.expiresAt,
        title: `Recertificação ${c.standard.code}`,
        subtitle: `${c.client.name} · validade do certificado`,
        href: "/manutencao",
      });
    }
    // Próxima auditoria de vigilância (só para certificações ativas).
    if (c.status === "ATIVA") {
      const next = nextSurveillanceDate(c);
      if (next && daysUntil(next) <= CERT_AGENDA_HORIZON_DAYS) {
        agendaItems.push({
          id: `a-surv-${c.id}`,
          kind: "CERT",
          date: next,
          title: `Vigilância ${c.standard.code}`,
          subtitle: `${c.client.name} · auditoria de manutenção`,
          href: "/manutencao",
        });
      }
    }
  }

  agendaItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  const bucketDefs: { key: AgendaBucketKey; label: string }[] = [
    { key: "overdue", label: "Vencidos" },
    { key: "today", label: "Hoje" },
    { key: "week", label: "Próximos 7 dias" },
    { key: "later", label: "Mais adiante" },
  ];
  const byBucket: Record<AgendaBucketKey, AgendaItem[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
  };
  for (const item of agendaItems) {
    const t = item.date.getTime();
    if (t < startToday.getTime()) byBucket.overdue.push(item);
    else if (t < startTomorrow.getTime()) byBucket.today.push(item);
    else if (t < weekEnd.getTime()) byBucket.week.push(item);
    else byBucket.later.push(item);
  }
  const agenda = bucketDefs
    .map((b) => ({ ...b, items: byBucket[b.key] }))
    .filter((b) => b.items.length > 0);

  const dueThisWeek = agendaItems.filter((i) => {
    const t = i.date.getTime();
    return t >= startToday.getTime() && t < weekEnd.getTime();
  }).length;

  return {
    tasks,
    agenda,
    counts: {
      open: tasks.length,
      overdue: tasks.filter((t) => t.overdue).length,
      dueThisWeek,
      clients: clientIds.length,
    },
  };
}
