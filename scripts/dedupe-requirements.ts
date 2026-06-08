// Migração de dados: deduplica requisitos por CÓDIGO em projetos já existentes.
//
// Antes, criar um projeto com N normas materializava N requisitos por código
// (um por norma). Agora a trilha mostra cada código uma única vez. Este script
// reorganiza os projetos antigos: para cada grupo de requisitos com o mesmo código,
// escolhe um canônico, REATRIBUI a ele todos os registros-filhos (evidências,
// documentos, planos de ação, comentários) dos duplicados e então remove os
// duplicados. Nada é perdido. Idempotente.
//
//   npx tsx scripts/dedupe-requirements.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.isoProject.findMany({
    include: {
      standards: true,
      requirements: {
        include: {
          requirement: { select: { code: true } },
          _count: {
            select: {
              evidences: true,
              generatedDocuments: true,
              actionPlans: true,
              comments: true,
            },
          },
        },
      },
    },
  });

  let removed = 0;
  let touchedProjects = 0;

  for (const project of projects) {
    const stdOrder = new Map(project.standards.map((s, i) => [s.standardId, i]));

    // Agrupa requisitos do projeto por código.
    const groups = new Map<string, typeof project.requirements>();
    for (const pr of project.requirements) {
      const code = pr.requirement.code;
      const list = groups.get(code) ?? [];
      list.push(pr);
      groups.set(code, list);
    }

    let projectChanged = false;

    for (const [, group] of groups) {
      if (group.length < 2) continue;

      // Canônico: o que tem mais filhos; empate -> maior conclusão -> norma de
      // maior prioridade (ordem de seleção no projeto).
      const childCount = (pr: (typeof group)[number]) =>
        pr._count.evidences +
        pr._count.generatedDocuments +
        pr._count.actionPlans +
        pr._count.comments;

      const sorted = [...group].sort((a, b) => {
        if (childCount(b) !== childCount(a)) return childCount(b) - childCount(a);
        if (b.completionPercent !== a.completionPercent)
          return b.completionPercent - a.completionPercent;
        return (stdOrder.get(a.standardId) ?? 99) - (stdOrder.get(b.standardId) ?? 99);
      });

      const canonical = sorted[0];
      const duplicates = sorted.slice(1);

      for (const dup of duplicates) {
        // Reatribui os filhos ao canônico antes de excluir (evita cascade delete).
        await prisma.$transaction([
          prisma.evidence.updateMany({
            where: { projectRequirementId: dup.id },
            data: { projectRequirementId: canonical.id },
          }),
          prisma.generatedDocument.updateMany({
            where: { projectRequirementId: dup.id },
            data: { projectRequirementId: canonical.id },
          }),
          prisma.actionPlan.updateMany({
            where: { projectRequirementId: dup.id },
            data: { projectRequirementId: canonical.id },
          }),
          prisma.requirementComment.updateMany({
            where: { projectRequirementId: dup.id },
            data: { projectRequirementId: canonical.id },
          }),
          prisma.projectRequirement.delete({ where: { id: dup.id } }),
        ]);
        removed++;
      }
      projectChanged = true;
    }

    if (projectChanged) touchedProjects++;
  }

  console.log(
    `Deduplicação concluída: ${removed} requisito(s) duplicado(s) removido(s) em ${touchedProjects} projeto(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
