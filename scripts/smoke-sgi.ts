import { PrismaClient } from "@prisma/client";
import { generateDocument } from "../src/lib/doc-generator";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const standards = await prisma.isoStandard.findMany({
    where: { code: { in: ["ISO 9001", "ISO 14001", "ISO 45001"] } },
  });

  await prisma.client.deleteMany({
    where: { userId: user.id, name: "SGI Test" },
  });
  const client = await prisma.client.create({
    data: { userId: user.id, name: "SGI Test", segment: "Indústria", scope: "Produção" },
  });

  const reqs = await prisma.isoRequirement.findMany({
    where: { standardId: { in: standards.map((s) => s.id) } },
  });

  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "SGI 9001 + 14001 + 45001",
      standards: { create: standards.map((s) => ({ standardId: s.id })) },
      requirements: {
        create: reqs.map((r) => ({
          standardId: r.standardId,
          requirementId: r.id,
          status: "NAO_INICIADO",
        })),
      },
    },
  });

  // Requisito 7.4 (existe nas três normas — pega o da ISO 9001)
  const iso9001 = standards.find((s) => s.code === "ISO 9001")!;
  const pr74 = await prisma.projectRequirement.findFirstOrThrow({
    where: {
      projectId: project.id,
      standardId: iso9001.id,
      requirement: { code: "7.4" },
    },
    include: { requirement: true },
  });

  const comunic = await prisma.documentTemplate.findFirstOrThrow({
    where: { name: "Procedimento de Comunicação" },
  });

  const { title, contentHtml } = generateDocument(comunic, {
    cliente: {
      nome: client.name,
      cnpj: client.cnpj,
      segmento: client.segment,
      escopo: client.scope,
      responsavel: client.responsible,
    },
    projeto: { tipo: project.type },
    normas: ["ISO 9001", "ISO 14001", "ISO 45001"],
    requisito: { codigo: pr74.requirement.code, titulo: pr74.requirement.title },
  });

  const doc = await prisma.generatedDocument.create({
    data: {
      projectRequirementId: pr74.id,
      templateId: comunic.id,
      title,
      contentHtml,
      status: "GERADO",
    },
  });

  const totalReqs = await prisma.projectRequirement.count({
    where: { projectId: project.id },
  });

  console.log("PROJECT_ID=" + project.id);
  console.log("DOC_ID=" + doc.id);
  console.log("TOTAL_REQS=" + totalReqs + " (esperado 28+22+23=73)");
  console.log(
    "DOC_TEM_AMBIENTAL=" + contentHtml.includes("Meio ambiente:")
  );
  console.log("DOC_TEM_SST=" + contentHtml.includes("Saúde e segurança ocupacional:"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
