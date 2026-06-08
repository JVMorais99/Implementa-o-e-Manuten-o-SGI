import { prisma } from "@/lib/prisma";

// Carrega o requisito do projeto com tudo que a IA precisa para raciocinar
// (requisito normativo, normas do projeto, cliente, evidências e documentos) e
// monta um resumo textual reutilizado pelos prompts.

export async function loadRequirement(prId: string) {
  return prisma.projectRequirement.findUnique({
    where: { id: prId },
    include: {
      requirement: true,
      standard: { select: { code: true } },
      project: {
        include: {
          client: true,
          standards: { include: { standard: { select: { code: true } } } },
        },
      },
      evidences: { orderBy: { createdAt: "desc" } },
      generatedDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type RequirementWithContext = NonNullable<
  Awaited<ReturnType<typeof loadRequirement>>
>;

function parseEvidenceList(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function projectNorms(pr: RequirementWithContext): string[] {
  return pr.project.standards.map((s) => s.standard.code);
}

// Resumo textual do requisito e do contexto do cliente/projeto.
export function requirementSummary(pr: RequirementWithContext): string {
  const r = pr.requirement;
  const c = pr.project.client;
  const normas = projectNorms(pr).join(", ") || "—";
  const expected = parseEvidenceList(r.expectedEvidence);

  return [
    `Norma(s) do projeto: ${normas}`,
    `Cliente: ${c.name}${c.segment ? ` (segmento: ${c.segment})` : ""}`,
    c.scope ? `Escopo do SG: ${c.scope}` : "",
    `Requisito ${r.code} — ${r.title}`,
    `Descrição: ${r.description}`,
    r.consultantGuidance ? `Orientação ao consultor: ${r.consultantGuidance}` : "",
    r.suggestedQuestion ? `Pergunta sugerida ao cliente: ${r.suggestedQuestion}` : "",
    expected.length
      ? `Evidências esperadas: ${expected.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Resumo das evidências e documentos já existentes no requisito.
export function evidenceSummary(pr: RequirementWithContext): string {
  const evid = pr.evidences.map(
    (e) =>
      `- [${e.status}] ${e.title} (${e.type})${e.technicalAnalysis ? ` — análise: ${e.technicalAnalysis}` : ""}`
  );
  const docs = pr.generatedDocuments.map((d) => `- [${d.status}] ${d.title}`);

  return [
    `Status atual do requisito: ${pr.status} (${pr.completionPercent}%)`,
    evid.length ? `Evidências anexadas:\n${evid.join("\n")}` : "Nenhuma evidência anexada.",
    docs.length ? `Documentos gerados:\n${docs.join("\n")}` : "Nenhum documento gerado.",
  ].join("\n");
}
