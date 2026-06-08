import { PrismaClient } from "@prisma/client";
import { generateDocument } from "../src/lib/doc-generator";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const iso = await prisma.isoStandard.findUniqueOrThrow({
    where: { code: "ISO 9001" },
  });

  // Limpa cenário anterior (idempotente)
  await prisma.client.deleteMany({
    where: { userId: user.id, name: "Empresa ABC (smoke)" },
  });

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Empresa ABC (smoke)",
      cnpj: "12.345.678/0001-90",
      segment: "Indústria",
      scope: "Fabricação de componentes",
      responsible: "Maria Silva",
    },
  });

  const requirements = await prisma.isoRequirement.findMany({
    where: { standardId: iso.id },
  });

  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "Implantação ISO 9001",
      status: "EM_ANDAMENTO",
      standards: { create: [{ standardId: iso.id }] },
      requirements: {
        create: requirements.map((r) => ({
          standardId: iso.id,
          requirementId: r.id,
          status: "NAO_INICIADO",
        })),
      },
    },
  });

  const pr41 = await prisma.projectRequirement.findFirstOrThrow({
    where: { projectId: project.id, requirement: { code: "4.1" } },
    include: { requirement: true },
  });

  const swot = await prisma.documentTemplate.findFirstOrThrow({
    where: { name: "Matriz SWOT" },
  });

  const { title, contentHtml } = generateDocument(swot, {
    cliente: {
      nome: client.name,
      cnpj: client.cnpj,
      segmento: client.segment,
      escopo: client.scope,
      responsavel: client.responsible,
    },
    projeto: { tipo: project.type },
    normas: ["ISO 9001"],
    requisito: { codigo: pr41.requirement.code, titulo: pr41.requirement.title },
  });

  const doc = await prisma.generatedDocument.create({
    data: {
      projectRequirementId: pr41.id,
      templateId: swot.id,
      title,
      contentHtml,
      status: "GERADO",
    },
  });

  console.log("PROJECT_ID=" + project.id);
  console.log("PR_ID=" + pr41.id);
  console.log("DOC_ID=" + doc.id);
  console.log("REQ_COUNT=" + requirements.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
