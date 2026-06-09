import { prisma } from "@/lib/prisma";
import { clientWhere, type AccessContext } from "@/lib/session";
import { getMaintenanceReminders } from "@/lib/certifications";

// Notificações derivadas (calculadas em tempo real, sem tabela própria): pendências
// com prazo estourado ou etapas paradas, escopadas pelos clientes visíveis ao
// usuário (clientWhere). Servem ao sino da Topbar e à página /notificacoes.

export type NotificationKind =
  | "ACTION_OVERDUE"
  | "DOC_AWAITING_SIGNATURE"
  | "DOC_AWAITING_APPROVAL"
  | "FINDING_OVERDUE"
  | "CERT_EXPIRING"
  | "SURVEILLANCE_DUE";

export type NotificationSeverity = "high" | "medium" | "low";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  description: string;
  href: string;
  date: Date | null;
  read: boolean;
}

// Dias que um documento pode ficar enviado sem retorno antes de virar alerta.
const SIGNATURE_GRACE_DAYS = 3;

export async function getNotifications(
  ctx: AccessContext
): Promise<AppNotification[]> {
  const now = new Date();
  const signatureThreshold = new Date(
    now.getTime() - SIGNATURE_GRACE_DAYS * 24 * 60 * 60 * 1000
  );
  const clientScope = clientWhere(ctx);
  const reqScope = { projectRequirement: { project: { client: clientScope } } };

  const [overdueActions, sentDocs, signedDocs, openFindings] = await Promise.all([
    prisma.actionPlan.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ["CONCLUIDO", "CANCELADO"] },
        ...reqScope,
      },
      orderBy: { dueDate: "asc" },
      include: {
        projectRequirement: {
          select: { id: true, projectId: true, requirement: { select: { code: true } } },
        },
      },
    }),
    prisma.generatedDocument.findMany({
      where: {
        sentToClientAt: { lt: signatureThreshold },
        signedReceivedAt: null,
        ...reqScope,
      },
      orderBy: { sentToClientAt: "asc" },
      include: {
        projectRequirement: {
          select: { id: true, projectId: true, requirement: { select: { code: true } } },
        },
      },
    }),
    prisma.generatedDocument.findMany({
      where: {
        signedReceivedAt: { not: null },
        status: { not: "APROVADO" },
        ...reqScope,
      },
      orderBy: { signedReceivedAt: "asc" },
      include: {
        projectRequirement: {
          select: { id: true, projectId: true, requirement: { select: { code: true } } },
        },
      },
    }),
    prisma.auditFinding.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "ENCERRADA" },
        audit: { project: { client: clientScope } },
      },
      orderBy: { dueDate: "asc" },
      include: { audit: { select: { id: true, title: true } } },
    }),
  ]);

  // Lembretes de manutenção (recertificação / vigilância) derivados das certificações.
  const maintenance = await getMaintenanceReminders(ctx);

  const reqHref = (pr: { projectId: string; id: string }) =>
    `/projetos/${pr.projectId}/requisitos/${pr.id}`;

  const raw: Omit<AppNotification, "read">[] = [
    ...maintenance.map((m) => ({
      id: m.id,
      kind: (m.kind === "RECERT" ? "CERT_EXPIRING" : "SURVEILLANCE_DUE") as NotificationKind,
      severity: m.severity,
      title: m.title,
      description: m.description,
      href: m.href,
      date: m.date,
    })),
    ...overdueActions.map((a) => ({
      id: `action-${a.id}`,
      kind: "ACTION_OVERDUE" as const,
      severity: "high" as const,
      title: "Plano de ação vencido",
      description: `Requisito ${a.projectRequirement.requirement.code}: ${a.action}`,
      href: reqHref(a.projectRequirement),
      date: a.dueDate,
    })),
    ...sentDocs.map((d) => ({
      id: `docsign-${d.id}`,
      kind: "DOC_AWAITING_SIGNATURE" as const,
      severity: "medium" as const,
      title: "Documento aguardando assinatura",
      description: `Requisito ${d.projectRequirement.requirement.code}: "${d.title}" enviado ao cliente sem retorno.`,
      href: reqHref(d.projectRequirement),
      date: d.sentToClientAt,
    })),
    ...signedDocs.map((d) => ({
      id: `docappr-${d.id}`,
      kind: "DOC_AWAITING_APPROVAL" as const,
      severity: "low" as const,
      title: "Documento assinado aguardando aprovação",
      description: `Requisito ${d.projectRequirement.requirement.code}: "${d.title}" recebido assinado.`,
      href: reqHref(d.projectRequirement),
      date: d.signedReceivedAt,
    })),
    ...openFindings.map((f) => ({
      id: `finding-${f.id}`,
      kind: "FINDING_OVERDUE" as const,
      severity: "high" as const,
      title: "Constatação de auditoria vencida",
      description: `${f.requirementCode ? `Requisito ${f.requirementCode}: ` : ""}${f.description}`,
      href: `/auditorias/${f.audit.id}`,
      date: f.dueDate,
    })),
  ];

  // Estado lido/não-lido (persistido por usuário): marca as notificações cuja chave
  // o usuário já leu (src/lib/notifications: NotificationRead).
  const readRows = await prisma.notificationRead.findMany({
    where: { userId: ctx.user.id, key: { in: raw.map((n) => n.id) } },
    select: { key: true },
  });
  const readKeys = new Set(readRows.map((r) => r.key));
  const notifications: AppNotification[] = raw.map((n) => ({
    ...n,
    read: readKeys.has(n.id),
  }));

  // Não lidas primeiro; depois mais severas; dentro do mesmo nível, mais antigas.
  const rank: Record<NotificationSeverity, number> = { high: 0, medium: 1, low: 2 };
  return notifications.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    return (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
  });
}

// O sino conta apenas as NÃO lidas.
export async function getNotificationCount(ctx: AccessContext): Promise<number> {
  return (await getNotifications(ctx)).filter((n) => !n.read).length;
}

// Marca um conjunto de chaves de notificação como lidas para o usuário (idempotente).
export async function markNotificationsRead(
  userId: string,
  keys: string[]
): Promise<void> {
  if (keys.length === 0) return;
  await prisma.$transaction(
    keys.map((key) =>
      prisma.notificationRead.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key },
        update: {},
      })
    )
  );
}

// Marca todas as notificações atuais do usuário como lidas.
export async function markAllNotificationsRead(ctx: AccessContext): Promise<number> {
  const notifications = await getNotifications(ctx);
  const unreadKeys = notifications.filter((n) => !n.read).map((n) => n.id);
  await markNotificationsRead(ctx.user.id, unreadKeys);
  return unreadKeys.length;
}
