// Smoke do módulo de auditoria: cria auditoria sobre um projeto, gera o checklist
// a partir da trilha, registra resultados e constatações, e exporta o relatório
// (PDF e DOCX).
//   npx tsx scripts/smoke-audit.ts

import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { buildAuditReportHtml, type AuditReportData } from "../src/lib/audit-report";
import { htmlToPdfBuffer } from "../src/lib/pdf-export";
import { htmlToDocxBuffer } from "../src/lib/docx-export";
import { PDFDocument } from "pdf-lib";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const iso = await prisma.isoStandard.findUniqueOrThrow({ where: { code: "ISO 9001" } });

  await prisma.client.deleteMany({
    where: { userId: user.id, name: "Empresa Auditoria (smoke)" },
  });
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Empresa Auditoria (smoke)",
      cnpj: "55.666.777/0001-88",
      segment: "Alimentos",
      scope: "Produção de alimentos",
      responsible: "Carlos",
    },
  });
  const reqs = await prisma.isoRequirement.findMany({ where: { standardId: iso.id } });
  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "Implantação ISO 9001",
      status: "EM_ANDAMENTO",
      standards: { create: [{ standardId: iso.id }] },
      requirements: {
        create: reqs.map((r) => ({
          standardId: iso.id,
          requirementId: r.id,
          status: "NAO_INICIADO",
        })),
      },
    },
    include: { requirements: { include: { requirement: true } } },
  });

  // Cria auditoria + checklist (um item por requisito da trilha).
  const audit = await prisma.audit.create({
    data: {
      projectId: project.id,
      type: "INTERNA",
      title: "Auditoria interna do SGQ — smoke",
      scope: "Processos produtivos e de apoio",
      objective: "Verificar a conformidade e a eficácia do sistema de gestão",
      leadAuditor: "Auditor Líder",
      status: "EM_ANDAMENTO",
      items: {
        create: project.requirements.map((r) => ({
          projectRequirementId: r.id,
          result: "NAO_AVALIADO",
        })),
      },
    },
    include: { items: true },
  });

  // (1) checklist == nº de requisitos da trilha
  assert(
    audit.items.length === project.requirements.length,
    `checklist deve ter ${project.requirements.length} itens, tem ${audit.items.length}`
  );

  // Avalia alguns itens.
  const [i1, i2, i3] = audit.items;
  await prisma.auditItem.update({
    where: { id: i1.id },
    data: { result: "CONFORME", evidenceSampled: "Manual da qualidade, registros" },
  });
  await prisma.auditItem.update({
    where: { id: i2.id },
    data: { result: "NAO_CONFORME", notes: "Indicadores não monitorados" },
  });
  await prisma.auditItem.update({
    where: { id: i3.id },
    data: { result: "OBSERVACAO" },
  });

  // Constatações.
  const pr2 = project.requirements.find((r) => r.id === i2.projectRequirementId)!;
  await prisma.auditFinding.create({
    data: {
      auditId: audit.id,
      type: "NC_MENOR",
      projectRequirementId: pr2.id,
      requirementCode: pr2.requirement.code,
      description: "Ausência de monitoramento de indicadores de desempenho.",
      evidence: "Não há registros de acompanhamento no período auditado.",
      correction: "Reativar a planilha de indicadores.",
      rootCause: "Falta de responsável definido.",
      correctiveAction: "Designar responsável e definir periodicidade mensal.",
      responsible: "Gerente da Qualidade",
      status: "ABERTA",
    },
  });
  await prisma.auditFinding.create({
    data: {
      auditId: audit.id,
      type: "OPORTUNIDADE",
      description: "Oportunidade de integrar os indicadores ao BI corporativo.",
      status: "ABERTA",
    },
  });

  // Monta o relatório e exporta PDF + DOCX.
  const full = await prisma.audit.findUniqueOrThrow({
    where: { id: audit.id },
    include: {
      project: {
        include: {
          client: { select: { name: true } },
          standards: { include: { standard: { select: { code: true } } } },
        },
      },
      items: { include: { projectRequirement: { include: { requirement: true } } } },
      findings: { orderBy: { createdAt: "asc" } },
    },
  });
  const norms = full.project.standards.map((s) => s.standard.code);
  const data: AuditReportData = {
    title: full.title,
    type: full.type,
    status: full.status,
    clientName: full.project.client.name,
    norms,
    projectType: full.project.type,
    leadAuditor: full.leadAuditor,
    auditTeam: full.auditTeam,
    auditedOrg: full.auditedOrg,
    scope: full.scope,
    objective: full.objective,
    criteria: full.criteria,
    plannedDate: full.plannedDate,
    executedDate: full.executedDate,
    conclusion: full.conclusion,
    items: full.items.map((it) => ({
      code: it.projectRequirement.requirement.code,
      title: it.projectRequirement.requirement.title,
      norms,
      result: it.result,
      notes: it.notes,
      evidenceSampled: it.evidenceSampled,
    })),
    findings: full.findings.map((f) => ({
      type: f.type,
      requirementCode: f.requirementCode,
      description: f.description,
      evidence: f.evidence,
      correction: f.correction,
      rootCause: f.rootCause,
      correctiveAction: f.correctiveAction,
      responsible: f.responsible,
      dueDate: f.dueDate,
      status: f.status,
    })),
  };

  const { title, contentHtml } = buildAuditReportHtml(data);
  const pdf = await htmlToPdfBuffer(title, contentHtml);
  const docx = await htmlToDocxBuffer(title, contentHtml);

  assert(pdf.subarray(0, 5).toString() === "%PDF-", "relatório PDF inválido");
  assert(docx.subarray(0, 2).toString() === "PK", "relatório DOCX inválido (zip)");
  const pages = (await PDFDocument.load(pdf)).getPageCount();
  assert(pages >= 1, "PDF sem páginas");

  writeFileSync("storage/smoke-audit-report.pdf", pdf);

  console.log("OK módulo de auditoria:");
  console.log(`  itens do checklist: ${full.items.length}`);
  console.log(`  constatações: ${full.findings.length}`);
  console.log(`  relatório PDF: ${(pdf.length / 1024).toFixed(1)} KB, ${pages} página(s)`);
  console.log(`  relatório DOCX: ${(docx.length / 1024).toFixed(1)} KB`);
  console.log(`  AUDIT_ID=${audit.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
