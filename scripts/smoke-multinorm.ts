// Smoke: projeto multi-norma (SGI) com deduplicação de requisitos por código +
// documento gerado abrangendo todas as normas + ciclo de vida (envio/assinatura).
//
//   npx tsx scripts/smoke-multinorm.ts

import { PrismaClient } from "@prisma/client";
import { generateGenericDocument } from "../src/lib/doc-generator";
import { mergeUnique, parseJsonArray } from "../src/lib/utils";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const standards = await prisma.isoStandard.findMany({
    where: { code: { in: ["ISO 9001", "ISO 14001", "ISO 45001"] } },
  });
  assert(standards.length === 3, "as 3 normas do SGI devem existir (rode o seed)");
  const standardIds = standards.map((s) => s.id);

  await prisma.client.deleteMany({
    where: { userId: user.id, name: "Empresa SGI (smoke)" },
  });
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Empresa SGI (smoke)",
      cnpj: "11.222.333/0001-44",
      segment: "Indústria química",
      scope: "Produção e distribuição",
      responsible: "Ana",
    },
  });

  // Replica a deduplicação por código de createProject.
  const requirements = await prisma.isoRequirement.findMany({
    where: { standardId: { in: standardIds } },
    select: { id: true, standardId: true, code: true, order: true },
  });
  const priority = new Map(standardIds.map((id, i) => [id, i]));
  const canonicalByCode = new Map<string, (typeof requirements)[number]>();
  for (const r of requirements) {
    const cur = canonicalByCode.get(r.code);
    if (!cur) {
      canonicalByCode.set(r.code, r);
      continue;
    }
    const better =
      (priority.get(r.standardId) ?? 99) < (priority.get(cur.standardId) ?? 99) ||
      ((priority.get(r.standardId) ?? 99) === (priority.get(cur.standardId) ?? 99) &&
        r.order < cur.order);
    if (better) canonicalByCode.set(r.code, r);
  }
  const canonical = [...canonicalByCode.values()];
  const distinctCodes = new Set(requirements.map((r) => r.code));

  // (1) deduplicação: nº de requisitos == nº de códigos distintos (não a soma das normas)
  assert(
    canonical.length === distinctCodes.size,
    `esperado ${distinctCodes.size} requisitos (códigos distintos), obtido ${canonical.length}`
  );
  assert(
    canonical.length < requirements.length,
    "deduplicação deve reduzir o total em relação à soma das normas"
  );

  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "Implantação SGI (9001+14001+45001)",
      status: "EM_ANDAMENTO",
      standards: { create: standardIds.map((standardId) => ({ standardId })) },
      requirements: {
        create: canonical.map((r) => ({
          standardId: r.standardId,
          requirementId: r.id,
          status: "NAO_INICIADO",
        })),
      },
    },
  });

  // (2) trilha sem duplicatas: cada código aparece 1x
  const trail = await prisma.projectRequirement.findMany({
    where: { projectId: project.id },
    include: { requirement: { select: { code: true } } },
  });
  const trailCodes = trail.map((t) => t.requirement.code);
  assert(
    trailCodes.length === new Set(trailCodes).size,
    "a trilha não pode ter códigos repetidos"
  );

  // (3) requisito 4.1 é comum às 3 normas -> documento gerado deve cobrir as 3
  //     e mesclar as evidências esperadas das 3 normas.
  const reqCode = "4.1";
  const siblings = await prisma.isoRequirement.findMany({
    where: { code: reqCode, standardId: { in: standardIds } },
    select: { expectedEvidence: true, standard: { select: { code: true } } },
  });
  assert(siblings.length === 3, `4.1 deve existir nas 3 normas (tem ${siblings.length})`);

  const merged = mergeUnique(siblings.map((s) => parseJsonArray(s.expectedEvidence)));
  const maxSingle = Math.max(
    ...siblings.map((s) => parseJsonArray(s.expectedEvidence).length)
  );
  assert(
    merged.length >= maxSingle,
    "a lista mesclada deve conter ao menos todas as evidências de uma norma isolada"
  );

  const { contentHtml } = generateGenericDocument({
    cliente: {
      nome: client.name,
      cnpj: client.cnpj,
      segmento: client.segment,
      escopo: client.scope,
      responsavel: client.responsible,
    },
    projeto: { tipo: project.type },
    normas: ["ISO 9001", "ISO 14001", "ISO 45001"],
    requisito: { codigo: reqCode, titulo: "Compreensão da organização e seu contexto", evidenciasEsperadas: merged },
  });
  for (const n of ["ISO 9001", "ISO 14001", "ISO 45001"]) {
    assert(contentHtml.includes(n), `documento deve mencionar ${n}`);
  }
  assert(
    contentHtml.includes("Sistema de Gestão Integrado"),
    "documento multi-norma deve trazer a nota de SGI"
  );

  // (4) ciclo de vida do documento (envio -> assinado -> aprovado) no nível de dados
  const pr41 = trail.find((t) => t.requirement.code === reqCode)!;
  const doc = await prisma.generatedDocument.create({
    data: {
      projectRequirementId: pr41.id,
      title: "Doc 4.1",
      contentHtml,
      status: "GERADO",
      revision: 0,
    },
  });
  await prisma.documentVersion.create({
    data: { documentId: doc.id, revision: 0, title: doc.title, contentHtml, status: "GERADO", changeNote: "Emissão inicial" },
  });

  const transitions = [
    { status: "ENVIADO_CLIENTE", stamp: "sentToClientAt", note: "Enviado ao cliente" },
    { status: "RECEBIDO_ASSINADO", stamp: "signedReceivedAt", note: "Recebido assinado" },
    { status: "APROVADO", stamp: null as string | null, note: "Aprovado" },
  ];
  let rev = 0;
  for (const t of transitions) {
    rev++;
    await prisma.generatedDocument.update({
      where: { id: doc.id },
      data: { status: t.status, revision: rev, ...(t.stamp ? { [t.stamp]: new Date() } : {}) },
    });
    await prisma.documentVersion.create({
      data: { documentId: doc.id, revision: rev, title: doc.title, contentHtml, status: t.status, changeNote: t.note },
    });
  }
  const finalDoc = await prisma.generatedDocument.findUniqueOrThrow({ where: { id: doc.id } });
  assert(finalDoc.status === "APROVADO", "status final deve ser APROVADO");
  assert(!!finalDoc.sentToClientAt, "sentToClientAt deve estar preenchido");
  assert(!!finalDoc.signedReceivedAt, "signedReceivedAt deve estar preenchido");
  const versions = await prisma.documentVersion.count({ where: { documentId: doc.id } });
  assert(versions === 4, `histórico deve ter 4 revisões (0..3), tem ${versions}`);

  console.log("OK multinorma + ciclo de vida:");
  console.log(`  requisitos na soma das 3 normas: ${requirements.length}`);
  console.log(`  requisitos na trilha (deduplicados): ${trail.length}`);
  console.log(`  evidências esperadas 4.1 — máx. norma isolada: ${maxSingle}, mescladas: ${merged.length}`);
  console.log(`  documento 4.1 menciona as 3 normas e a nota SGI: sim`);
  console.log(`  ciclo de vida: GERADO -> ENVIADO -> ASSINADO -> APROVADO (4 revisões)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
