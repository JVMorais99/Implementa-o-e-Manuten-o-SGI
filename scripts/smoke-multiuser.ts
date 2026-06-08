// Smoke multiusuário: valida a matriz de permissões (RBAC) e o isolamento de
// dados por organização (escopo). Cria duas organizações de teste e confirma que
// uma não enxerga os clientes da outra; e que o papel CLIENTE só vê o seu cliente.
//   npx tsx scripts/smoke-multiuser.ts

import { PrismaClient } from "@prisma/client";
import { can } from "../src/lib/permissions";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

// Réplica do clientWhere (src/lib/session.ts) sem depender do next/auth.
function clientWhere(orgId: string | null, clientId?: string | null) {
  return {
    organizationId: orgId ?? "__no_org__",
    ...(clientId ? { id: clientId } : {}),
  };
}

async function main() {
  // ---- (1) Matriz de permissões ----
  assert(can("ADMIN", "manage_members"), "ADMIN deve gerenciar membros");
  assert(can("CONSULTOR", "manage_projects"), "CONSULTOR deve gerenciar projetos");
  assert(!can("CONSULTOR", "manage_members"), "CONSULTOR não gerencia membros");
  assert(can("AUDITOR", "manage_audits"), "AUDITOR deve gerenciar auditorias");
  assert(!can("AUDITOR", "manage_projects"), "AUDITOR não gerencia projetos");
  assert(!can("AUDITOR", "edit_requirements"), "AUDITOR não edita a trilha");
  assert(can("LEITOR", "view"), "LEITOR deve ler");
  assert(!can("LEITOR", "manage_documents"), "LEITOR não gerencia documentos");
  assert(can("CLIENTE", "upload_evidence"), "CLIENTE deve enviar evidências");
  assert(!can("CLIENTE", "manage_documents"), "CLIENTE não gerencia documentos");
  assert(!can("CLIENTE", "manage_audits"), "CLIENTE não gerencia auditorias");

  // ---- (2) Isolamento por organização ----
  await prisma.organization.deleteMany({
    where: { name: { in: ["SMOKE Org A", "SMOKE Org B"] } },
  });

  const userA = await prisma.user.upsert({
    where: { email: "smoke-a@test.com" },
    update: {},
    create: { name: "Smoke A", email: "smoke-a@test.com", passwordHash: "x" },
  });
  const userB = await prisma.user.upsert({
    where: { email: "smoke-b@test.com" },
    update: {},
    create: { name: "Smoke B", email: "smoke-b@test.com", passwordHash: "x" },
  });

  const orgA = await prisma.organization.create({
    data: {
      name: "SMOKE Org A",
      members: { create: { userId: userA.id, role: "ADMIN" } },
      clients: {
        create: [
          { name: "Cliente A1", userId: userA.id },
          { name: "Cliente A2", userId: userA.id },
        ],
      },
    },
    include: { clients: true },
  });
  const orgB = await prisma.organization.create({
    data: {
      name: "SMOKE Org B",
      members: { create: { userId: userB.id, role: "ADMIN" } },
      clients: { create: [{ name: "Cliente B1", userId: userB.id }] },
    },
    include: { clients: true },
  });

  const seenByA = await prisma.client.findMany({ where: clientWhere(orgA.id) });
  const seenByB = await prisma.client.findMany({ where: clientWhere(orgB.id) });
  assert(seenByA.length === 2, `Org A deve ver 2 clientes (viu ${seenByA.length})`);
  assert(seenByB.length === 1, `Org B deve ver 1 cliente (viu ${seenByB.length})`);
  assert(
    !seenByA.some((c) => c.name === "Cliente B1"),
    "Org A NÃO pode ver o cliente da Org B (vazamento entre organizações!)"
  );

  // ---- (3) Portal do cliente: vê apenas o seu cliente ----
  const portalClientId = orgA.clients[0].id;
  const seenByPortal = await prisma.client.findMany({
    where: clientWhere(orgA.id, portalClientId),
  });
  assert(
    seenByPortal.length === 1 && seenByPortal[0].id === portalClientId,
    "Portal CLIENTE deve ver somente o cliente que representa"
  );

  // Limpeza
  await prisma.organization.deleteMany({
    where: { id: { in: [orgA.id, orgB.id] } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["smoke-a@test.com", "smoke-b@test.com"] } },
  });

  console.log("OK multiusuário:");
  console.log("  matriz de permissões (ADMIN/CONSULTOR/AUDITOR/LEITOR/CLIENTE): consistente");
  console.log("  isolamento por organização: Org A=2, Org B=1, sem vazamento");
  console.log("  portal do cliente: restrito a 1 cliente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
