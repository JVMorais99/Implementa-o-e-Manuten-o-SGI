// Backfill do consultor responsável dos clientes existentes (Gestão de equipe).
// Para cada cliente SEM responsável, se houver EXATAMENTE UM membership interno
// (não-ADMIN, não-CLIENTE) vinculado via MembershipClient, define-o como responsável.
// Clientes com 0 ou >1 candidatos ficam sem responsável (o supervisor atribui).
//
//   npx tsx scripts/backfill-responsible.ts            # dry-run (não grava)
//   npx tsx scripts/backfill-responsible.ts --apply    # aplica

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const clients = await prisma.client.findMany({
    where: { responsibleMembershipId: null },
    select: {
      id: true,
      name: true,
      memberLinks: {
        select: {
          membershipId: true,
          membership: { select: { role: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  let assigned = 0;
  let skippedNone = 0;
  let skippedAmbiguous = 0;

  for (const c of clients) {
    const candidates = c.memberLinks.filter(
      (l) => l.membership.role !== "ADMIN" && l.membership.role !== "CLIENTE"
    );
    if (candidates.length === 0) {
      skippedNone++;
      continue;
    }
    if (candidates.length > 1) {
      skippedAmbiguous++;
      console.log(
        `  ~ ${c.name}: ${candidates.length} candidatos — deixado sem responsável`
      );
      continue;
    }
    const chosen = candidates[0];
    console.log(
      `  → ${c.name}: responsável = ${chosen.membership.user.name}` +
        (APPLY ? "" : " (dry-run)")
    );
    if (APPLY) {
      await prisma.client.update({
        where: { id: c.id },
        data: { responsibleMembershipId: chosen.membershipId },
      });
    }
    assigned++;
  }

  console.log("");
  console.log(`Clientes sem responsável: ${clients.length}`);
  console.log(`  atribuídos: ${assigned}`);
  console.log(`  sem candidato: ${skippedNone}`);
  console.log(`  ambíguos (>1): ${skippedAmbiguous}`);
  console.log(APPLY ? "APLICADO." : "DRY-RUN — rode com --apply para gravar.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
