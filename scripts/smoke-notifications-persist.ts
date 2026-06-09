// Smoke "Avisos proativos" (frente B): persistência lido/não-lido das notificações
// (src/lib/notifications) e montagem do digest por e-mail (src/lib/digest).
//   npx tsx scripts/smoke-notifications-persist.ts
//
// Requer as migrações team_management, certifications e notifications_persist
// aplicadas. Cria dados prefixados "SMOKE NOTIF" e limpa ao final.

import { PrismaClient } from "@prisma/client";
import {
  getNotifications,
  getNotificationCount,
  markAllNotificationsRead,
  markNotificationsRead,
} from "../src/lib/notifications";
import { buildDigestHtml } from "../src/lib/digest";
import type { AccessContext } from "../src/lib/session";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const ORG_NAME = "SMOKE NOTIF Org";
const STD_CODE = "SMOKE NOTIF STD";
const EMAIL = "smoke-notif@test.com";

async function cleanup() {
  await prisma.organization.deleteMany({ where: { name: ORG_NAME } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.isoStandard.deleteMany({ where: { code: STD_CODE } });
}

async function main() {
  await cleanup();

  const user = await prisma.user.create({
    data: { name: "Consultor Notif", email: EMAIL, passwordHash: "x" },
  });
  const std = await prisma.isoStandard.create({
    data: { code: STD_CODE, name: "Norma de teste" },
  });
  const isoReq = await prisma.isoRequirement.create({
    data: {
      standardId: std.id,
      code: "8.1",
      title: "Planejamento operacional",
      description: "x",
      consultantGuidance: "x",
      suggestedQuestion: "x",
      expectedEvidence: "[]",
      order: 1,
    },
  });
  const org = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      members: { create: [{ userId: user.id, role: "CONSULTOR" }] },
      clients: { create: [{ name: "Cliente Notif", userId: user.id }] },
    },
    include: { clients: true },
  });
  const client = org.clients[0];
  const project = await prisma.isoProject.create({
    data: { clientId: client.id, type: "Implantação ISO 9001", status: "EM_ANDAMENTO" },
  });
  const pr = await prisma.projectRequirement.create({
    data: { projectId: project.id, standardId: std.id, requirementId: isoReq.id, status: "EM_ANALISE" },
  });
  // Plano de ação vencido → gera 1 notificação ACTION_OVERDUE.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.actionPlan.create({
    data: { projectRequirementId: pr.id, action: "Corrigir lacuna", status: "ABERTO", dueDate: yesterday },
  });

  const ctx: AccessContext = {
    user: { id: user.id, name: "Consultor Notif", email: EMAIL },
    orgId: org.id,
    role: "CONSULTOR",
    clientIds: [client.id],
  };

  // Estado inicial: 1 notificação, não lida.
  const initial = await getNotifications(ctx);
  assert(initial.length >= 1, `Deve haver ao menos 1 notificação (foi ${initial.length})`);
  assert(initial.every((n) => !n.read), "Tudo deve começar como NÃO lido");
  const countBefore = await getNotificationCount(ctx);
  assert(countBefore === initial.length, "Contagem do sino = total não lido inicialmente");

  // Digest deve listar o título da pendência.
  const html = buildDigestHtml("Consultor Notif", initial);
  assert(html.includes("Plano de ação vencido"), "Digest deve conter o título da pendência");
  assert(html.includes("/notificacoes"), "Digest deve ter o botão para o painel");

  // Marca todas como lidas → sino zera; persistência reflete read=true.
  const marked = await markAllNotificationsRead(ctx);
  assert(marked === countBefore, `markAll deve marcar ${countBefore} (marcou ${marked})`);
  assert((await getNotificationCount(ctx)) === 0, "Sino deve zerar após marcar todas");
  const afterRead = await getNotifications(ctx);
  assert(afterRead.every((n) => n.read), "Todas devem constar como lidas");

  // Idempotência: marcar de novo a mesma chave não duplica nem falha.
  await markNotificationsRead(user.id, [initial[0].id]);
  await markNotificationsRead(user.id, [initial[0].id]);
  const rows = await prisma.notificationRead.count({ where: { userId: user.id, key: initial[0].id } });
  assert(rows === 1, `Upsert idempotente: 1 linha por chave (foi ${rows})`);

  await cleanup();

  console.log("OK avisos proativos:");
  console.log("  notificações começam não lidas; sino conta as não lidas");
  console.log("  digest HTML lista as pendências e linka o painel");
  console.log("  marcar-todas zera o sino; upsert de leitura é idempotente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
