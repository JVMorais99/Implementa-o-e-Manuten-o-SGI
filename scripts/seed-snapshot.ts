// Insere um snapshot de KPI RETROATIVO para cada organização, com valores
// levemente diferentes dos atuais — serve só para VISUALIZAR as pills de variação
// no dashboard antes de o histórico real acumular. É DADO DE TESTE.
//
//   npx tsx scripts/seed-snapshot.ts            (padrão: 30 dias atrás)
//   npx tsx scripts/seed-snapshot.ts --daysAgo 30
//
// Para remover depois: apague as linhas de MetricSnapshot com a data gerada.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return fallback;
}

async function main() {
  const daysAgo = arg("daysAgo", 30);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  if (orgs.length === 0) {
    console.log("Nenhuma organização encontrada.");
    return;
  }

  for (const org of orgs) {
    // Valores "do mês passado" propositalmente diferentes dos atuais, para gerar
    // deltas visíveis: menos clientes/projetos e MAIS pendências (que caíram).
    const [clients, activeProjects, pendingReqs] = await Promise.all([
      prisma.client.count({ where: { organizationId: org.id } }),
      prisma.isoProject.count({
        where: { client: { organizationId: org.id }, status: "EM_ANDAMENTO" },
      }),
      prisma.projectRequirement.count({
        where: {
          project: { client: { organizationId: org.id } },
          status: { in: ["NAO_INICIADO", "EM_ANALISE"] },
        },
      }),
    ]);

    await prisma.metricSnapshot.upsert({
      where: { organizationId_date: { organizationId: org.id, date } },
      create: {
        organizationId: org.id,
        date,
        clients: Math.max(0, clients - 1),
        activeProjects: Math.max(0, activeProjects - 1),
        pendingReqs: pendingReqs + 5,
        overdueActions: 4,
        avgProgress: 55,
      },
      update: {
        clients: Math.max(0, clients - 1),
        activeProjects: Math.max(0, activeProjects - 1),
        pendingReqs: pendingReqs + 5,
        overdueActions: 4,
        avgProgress: 55,
      },
    });
    console.log(`Snapshot de teste (${daysAgo}d atrás) gravado para "${org.name}".`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
