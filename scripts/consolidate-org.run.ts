// Execução da consolidação de organizações (camada de banco). A lógica pura de
// planejamento está em ./consolidate-org; aqui ficam o carregamento do banco, a
// aplicação transacional e o CLI. Dry-run por padrão; --apply grava as mudanças.
//   npx tsx scripts/consolidate-org.run.ts            (dry-run: só imprime o plano)
//   npx tsx scripts/consolidate-org.run.ts --apply    (executa as mudanças)

import { PrismaClient } from "@prisma/client";
import {
  OWNER_EMAIL,
  FALLBACK_OWNER_EMAIL,
  planConsolidation,
  type ConsolidationInput,
  type ConsolidationPlan,
  type OrgIn,
  type MembershipIn,
} from "./consolidate-org";

const prisma = new PrismaClient();

// Lê orgs e memberships reais do banco para montar o input do planejador.
async function loadInput(): Promise<ConsolidationInput> {
  const orgsRaw = await prisma.organization.findMany({
    select: { id: true, createdAt: true, _count: { select: { clients: true } } },
  });
  const orgs: OrgIn[] = orgsRaw.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    clientCount: o._count.clients,
  }));

  const msRaw = await prisma.membership.findMany({
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
      createdAt: true,
      user: { select: { email: true } },
      clients: { select: { clientId: true } },
    },
  });
  const memberships: MembershipIn[] = msRaw.map((m) => ({
    id: m.id,
    userId: m.userId,
    userEmail: m.user.email,
    organizationId: m.organizationId,
    role: m.role,
    createdAt: m.createdAt,
    clientIds: m.clients.map((c) => c.clientId),
  }));

  return { ownerEmail: OWNER_EMAIL, fallbackOwnerEmail: FALLBACK_OWNER_EMAIL, orgs, memberships };
}

function printPlan(input: ConsolidationInput, plan: ConsolidationPlan) {
  console.log("=== PLANO DE CONSOLIDAÇÃO (dry-run) ===");
  console.log(`Organizações: ${input.orgs.length} → 1`);
  console.log(`Org canônica: ${plan.canonicalOrgId}`);
  console.log(`ADMIN único (dono): ${plan.ownerEmail}`);
  console.log(
    `Memberships mantidos: ${plan.keep.length} | removidos (dedup): ${plan.deleteMembershipIds.length}`
  );
  for (const k of plan.keep) {
    console.log(`  - ${k.userEmail}: role=${k.role}, clientes=${k.clientIds.length}`);
  }
  console.log(`Orgs a remover: ${plan.deleteOrgIds.length} [${plan.deleteOrgIds.join(", ")}]`);
}

// Aplica o plano numa transação. Ordem respeita FKs e o unique (organizationId,userId):
// 1) repontar clientes, 2) apagar snapshots órfãos, 3) apagar memberships duplicados,
// 4) atualizar (org/papel/clientes) os mantidos, 5) apagar orgs vazias.
async function apply(plan: ConsolidationPlan) {
  await prisma.$transaction(async (tx) => {
    if (plan.deleteOrgIds.length) {
      await tx.client.updateMany({
        where: { organizationId: { in: plan.deleteOrgIds } },
        data: { organizationId: plan.canonicalOrgId },
      });
      await tx.metricSnapshot.deleteMany({
        where: { organizationId: { in: plan.deleteOrgIds } },
      });
    }

    if (plan.deleteMembershipIds.length) {
      await tx.membershipClient.deleteMany({
        where: { membershipId: { in: plan.deleteMembershipIds } },
      });
      await tx.membership.deleteMany({
        where: { id: { in: plan.deleteMembershipIds } },
      });
    }

    for (const k of plan.keep) {
      await tx.membership.update({
        where: { id: k.membershipId },
        data: { organizationId: plan.canonicalOrgId, role: k.role },
      });
      await tx.membershipClient.deleteMany({ where: { membershipId: k.membershipId } });
      if (k.clientIds.length) {
        await tx.membershipClient.createMany({
          data: k.clientIds.map((clientId) => ({ membershipId: k.membershipId, clientId })),
        });
      }
    }

    if (plan.deleteOrgIds.length) {
      await tx.organization.deleteMany({ where: { id: { in: plan.deleteOrgIds } } });
    }
  });
}

async function main() {
  const doApply = process.argv.includes("--apply");
  const input = await loadInput();

  // Garante que existe um dono (preferido ou fallback) entre os memberships.
  const emails = new Set(input.memberships.map((m) => m.userEmail));
  if (!emails.has(OWNER_EMAIL) && !emails.has(FALLBACK_OWNER_EMAIL)) {
    throw new Error(
      `Nenhum dono encontrado (${OWNER_EMAIL} nem ${FALLBACK_OWNER_EMAIL}). Abortando.`
    );
  }

  const plan = planConsolidation(input);
  printPlan(input, plan);

  if (!doApply) {
    console.log("\n(dry-run) Nada foi gravado. Reexecute com --apply para aplicar.");
    return;
  }

  await apply(plan);
  console.log("\n✅ Consolidação aplicada. Agora existe 1 organização compartilhada.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
