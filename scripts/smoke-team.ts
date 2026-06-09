// Smoke "Gestão de equipe": valida que (1) o acesso segue o consultor responsável
// ("responsável define acesso"), (2) computeConsultantMetrics reflete os dados do
// consultor e (3) o log de atividades grava e é lido com escopo por cliente.
//   npx tsx scripts/smoke-team.ts
//
// Requer a migração 20260609120000_team_management aplicada (ActivityLog + colunas
// responsibleMembershipId). Cria dados prefixados "SMOKE TEAM" e limpa ao final.

import { PrismaClient } from "@prisma/client";
import { computeConsultantMetrics } from "../src/lib/team";
import { logActivity, getRecentActivity } from "../src/lib/activity";
import type { AccessContext } from "../src/lib/session";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

// Réplica de clientWhere (src/lib/session.ts) sem depender do next/auth.
function clientWhere(orgId: string | null, clientIds: string[] | null) {
  return {
    organizationId: orgId ?? "__no_org__",
    ...(clientIds
      ? { id: { in: clientIds.length ? clientIds : ["__none__"] } }
      : {}),
  };
}

const ORG_NAME = "SMOKE TEAM Org";
const EMAILS = ["smoke-team-admin@test.com", "smoke-team-c1@test.com", "smoke-team-c2@test.com"];

async function cleanup() {
  await prisma.organization.deleteMany({ where: { name: ORG_NAME } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
}

async function main() {
  await cleanup();

  const [admin, c1, c2] = await Promise.all(
    EMAILS.map((email, i) =>
      prisma.user.create({
        data: { name: ["Admin", "Consultor 1", "Consultor 2"][i], email, passwordHash: "x" },
      })
    )
  );

  // Org com 1 ADMIN e 2 consultores; 3 clientes.
  const org = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      members: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: c1.id, role: "CONSULTOR" },
          { userId: c2.id, role: "CONSULTOR" },
        ],
      },
      clients: {
        create: [
          { name: "Cliente X", userId: admin.id },
          { name: "Cliente Y", userId: admin.id },
          { name: "Cliente Z", userId: admin.id },
        ],
      },
    },
    include: { members: true, clients: true },
  });

  const memC1 = org.members.find((m) => m.userId === c1.id)!;
  const memC2 = org.members.find((m) => m.userId === c2.id)!;
  const [clientX, clientY, clientZ] = org.clients;

  // "Responsável define acesso": atribui X,Y ao consultor 1 e Z ao consultor 2,
  // sincronizando o vínculo de visibilidade (MembershipClient) — como faz setClientResponsible.
  async function setResponsible(clientId: string, membershipId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.membershipClient.deleteMany({ where: { clientId } });
      await tx.membershipClient.create({ data: { membershipId, clientId } });
      await tx.client.update({ where: { id: clientId }, data: { responsibleMembershipId: membershipId } });
    });
  }
  await setResponsible(clientX.id, memC1.id);
  await setResponsible(clientY.id, memC1.id);
  await setResponsible(clientZ.id, memC2.id);

  // (1) Acesso segue o responsável.
  const c1Ids = (
    await prisma.membershipClient.findMany({ where: { membershipId: memC1.id }, select: { clientId: true } })
  ).map((x) => x.clientId);
  const c2Ids = (
    await prisma.membershipClient.findMany({ where: { membershipId: memC2.id }, select: { clientId: true } })
  ).map((x) => x.clientId);

  const seenByC1 = await prisma.client.findMany({ where: clientWhere(org.id, c1Ids) });
  const seenByC2 = await prisma.client.findMany({ where: clientWhere(org.id, c2Ids) });
  const seenByAdmin = await prisma.client.findMany({ where: clientWhere(org.id, null) });
  assert(seenByC1.length === 2, `Consultor 1 deve ver 2 clientes (viu ${seenByC1.length})`);
  assert(seenByC2.length === 1, `Consultor 2 deve ver 1 cliente (viu ${seenByC2.length})`);
  assert(seenByAdmin.length === 3, `ADMIN deve ver os 3 clientes (viu ${seenByAdmin.length})`);
  assert(!seenByC1.some((c) => c.id === clientZ.id), "Consultor 1 NÃO pode ver o cliente do Consultor 2");

  // (2) Métricas por consultor refletem os clientes responsáveis.
  const m1 = await computeConsultantMetrics(c1Ids);
  const m2 = await computeConsultantMetrics(c2Ids);
  assert(m1.clients === 2, `Métrica do Consultor 1: clients=2 (foi ${m1.clients})`);
  assert(m2.clients === 1, `Métrica do Consultor 2: clients=1 (foi ${m2.clients})`);

  // (3) Log de atividades grava e é lido com escopo por cliente.
  const ctxC1: AccessContext = { user: { id: c1.id, name: "Consultor 1" }, orgId: org.id, role: "CONSULTOR", clientIds: c1Ids };
  const ctxC2: AccessContext = { user: { id: c2.id, name: "Consultor 2" }, orgId: org.id, role: "CONSULTOR", clientIds: c2Ids };
  const ctxAdmin: AccessContext = { user: { id: admin.id, name: "Admin" }, orgId: org.id, role: "ADMIN", clientIds: null };

  await logActivity(ctxC1, { action: "REQ_STATUS", entityType: "requirement", entityId: "r1", clientId: clientX.id, summary: "Atualizou requisito do Cliente X" });
  await logActivity(ctxC2, { action: "REQ_STATUS", entityType: "requirement", entityId: "r2", clientId: clientZ.id, summary: "Atualizou requisito do Cliente Z" });

  const feedC1 = await getRecentActivity(ctxC1);
  const feedC2 = await getRecentActivity(ctxC2);
  const feedAdmin = await getRecentActivity(ctxAdmin);
  assert(feedC1.length === 1 && feedC1[0].clientId === clientX.id, "Consultor 1 vê só a atividade do seu cliente");
  assert(feedC2.length === 1 && feedC2[0].clientId === clientZ.id, "Consultor 2 vê só a atividade do seu cliente");
  assert(feedAdmin.length === 2, `ADMIN vê todas as atividades da org (viu ${feedAdmin.length})`);

  const byActor = await getRecentActivity(ctxAdmin, { actorId: c1.id });
  assert(byActor.length === 1 && byActor[0].actorId === c1.id, "Filtro por ator (painel do consultor) funciona");

  await cleanup();

  console.log("OK gestão de equipe:");
  console.log("  acesso segue o responsável: C1=2, C2=1, ADMIN=3, sem vazamento");
  console.log("  métricas por consultor: C1.clients=2, C2.clients=1");
  console.log("  log de atividades: escopo por cliente + filtro por ator consistentes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
