// Migração de dados: cria uma organização por usuário existente (papel ADMIN) e
// vincula seus clientes a ela. Idempotente.
//   npx tsx scripts/backfill-organizations.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { memberships: true } });
  let orgsCreated = 0;
  let clientsLinked = 0;

  for (const user of users) {
    // Reutiliza a organização onde o usuário já é ADMIN, se houver.
    let membership = user.memberships.find((m) => m.role === "ADMIN");
    if (!membership) {
      const org = await prisma.organization.create({
        data: { name: `Organização de ${user.name}` },
      });
      membership = await prisma.membership.create({
        data: { organizationId: org.id, userId: user.id, role: "ADMIN" },
      });
      orgsCreated++;
    }

    const res = await prisma.client.updateMany({
      where: { userId: user.id, organizationId: null },
      data: { organizationId: membership.organizationId },
    });
    clientsLinked += res.count;
  }

  console.log(
    `Backfill concluído: ${orgsCreated} organização(ões) criada(s), ${clientsLinked} cliente(s) vinculado(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
