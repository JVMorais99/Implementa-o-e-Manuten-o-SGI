import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function snapshot(p: {
  documentId: string;
  revision: number;
  title: string;
  contentHtml: string;
  status: string;
  changeNote: string;
}) {
  await prisma.documentVersion.create({ data: { ...p } });
}

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const iso = await prisma.isoStandard.findUniqueOrThrow({
    where: { code: "ISO 9001" },
  });

  // Cenário isolado e idempotente
  await prisma.client.deleteMany({
    where: { userId: user.id, name: "Empresa Versao (smoke)" },
  });
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Empresa Versao (smoke)",
      cnpj: "98.765.432/0001-10",
      segment: "Serviços",
      scope: "Consultoria",
      responsible: "João",
    },
  });
  const req = await prisma.isoRequirement.findFirstOrThrow({
    where: { standardId: iso.id },
  });
  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "Implantação ISO 9001",
      status: "EM_ANDAMENTO",
      standards: { create: [{ standardId: iso.id }] },
      requirements: {
        create: [{ standardId: iso.id, requirementId: req.id, status: "NAO_INICIADO" }],
      },
    },
  });
  const pr = await prisma.projectRequirement.findFirstOrThrow({
    where: { projectId: project.id },
  });

  // 1) Emissão inicial -> revisão 0 + snapshot
  const doc = await prisma.generatedDocument.create({
    data: {
      projectRequirementId: pr.id,
      title: "Doc v0",
      contentHtml: "<p>conteudo inicial</p>",
      status: "GERADO",
      revision: 0,
    },
  });
  await snapshot({
    documentId: doc.id,
    revision: 0,
    title: doc.title,
    contentHtml: doc.contentHtml,
    status: doc.status,
    changeNote: "Emissão inicial",
  });

  // 2) Edição -> revisão 1 + snapshot
  const r1 = doc.revision + 1;
  await prisma.generatedDocument.update({
    where: { id: doc.id },
    data: { title: "Doc v1", contentHtml: "<p>editado</p>", status: "EM_REVISAO", revision: r1 },
  });
  await snapshot({
    documentId: doc.id,
    revision: r1,
    title: "Doc v1",
    contentHtml: "<p>editado</p>",
    status: "EM_REVISAO",
    changeNote: "Edição do documento",
  });

  // 3) Restaurar revisão 0 -> revisão 2 (append-only) + snapshot
  const v0 = await prisma.documentVersion.findFirstOrThrow({
    where: { documentId: doc.id, revision: 0 },
  });
  const r2 = r1 + 1;
  await prisma.generatedDocument.update({
    where: { id: doc.id },
    data: { title: v0.title, contentHtml: v0.contentHtml, status: v0.status, revision: r2 },
  });
  await snapshot({
    documentId: doc.id,
    revision: r2,
    title: v0.title,
    contentHtml: v0.contentHtml,
    status: v0.status,
    changeNote: "Restaurado da revisão 00",
  });

  // Verificações
  const current = await prisma.generatedDocument.findUniqueOrThrow({ where: { id: doc.id } });
  const history = await prisma.documentVersion.findMany({
    where: { documentId: doc.id },
    orderBy: { revision: "asc" },
  });

  assert(history.length === 3, `histórico deve ter 3 revisões (tem ${history.length})`);
  assert(
    history.map((h) => h.revision).join(",") === "0,1,2",
    "revisões devem ser 0,1,2 em ordem"
  );
  assert(current.revision === 2, `revisão atual deve ser 2 (é ${current.revision})`);
  assert(
    current.contentHtml === v0.contentHtml && current.title === v0.title,
    "estado atual deve espelhar o conteúdo restaurado da revisão 0"
  );
  // Histórico append-only: a revisão 1 (editada) continua preservada
  const keptV1 = history.find((h) => h.revision === 1)!;
  assert(keptV1.contentHtml === "<p>editado</p>", "revisão 1 editada deve permanecer no histórico");

  console.log("OK versionamento:");
  console.log("  revisões no histórico:", history.map((h) => h.revision).join(", "));
  console.log("  changeNotes:", history.map((h) => h.changeNote).join(" | "));
  console.log("  revisão atual do documento:", current.revision);
  console.log("DOC_ID=" + doc.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
