import { prisma } from "@/lib/prisma";
import { EVIDENCE_STATUSES } from "@/lib/enums";
import { generateStructured } from "./client";
import { evidenceToContent } from "./extract";
import { loadRequirement, requirementSummary } from "./context";

// Avalia uma evidência anexada perante o requisito normativo: lê o arquivo,
// julga se atende e grava uma análise consultiva (não altera o status oficial
// definido pelo consultor).

const SYSTEM = `Você é um auditor líder ISO experiente, especialista em sistemas de gestão (ISO 9001, 14001, 45001, 27001, 37001, 37301).
Avalie criticamente se a evidência fornecida atende ao requisito normativo informado.
Seja objetivo, técnico e em português do Brasil. Aponte lacunas concretas quando houver.
Nunca invente conteúdo que não esteja na evidência.`;

interface EvidenceVerdict {
  suggestedStatus: (typeof EVIDENCE_STATUSES)[number];
  confidence: number;
  analysis: string;
}

export async function analyzeEvidence(evidenceId: string): Promise<void> {
  const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) throw new Error("Evidência não encontrada.");

  const pr = await loadRequirement(evidence.projectRequirementId);
  if (!pr) throw new Error("Requisito não encontrado.");

  const fileBlocks = await evidenceToContent(evidence.fileUrl, evidence.fileName);

  const verdict = await generateStructured<EvidenceVerdict>({
    system: SYSTEM,
    content: [
      {
        type: "text",
        text: `Contexto do requisito:\n${requirementSummary(pr)}\n\nEvidência: "${evidence.title}" (tipo: ${evidence.type}).\nA seguir, o conteúdo do arquivo.`,
      },
      ...fileBlocks,
      {
        type: "text",
        text: "Avalie a evidência e registre o veredito usando a ferramenta.",
      },
    ],
    tool: {
      name: "registrar_avaliacao",
      description: "Registra a avaliação técnica da evidência perante o requisito.",
      input_schema: {
        type: "object",
        properties: {
          suggestedStatus: {
            type: "string",
            enum: [...EVIDENCE_STATUSES],
            description:
              "Situação sugerida: ACEITA (atende), PARCIAL (atende parcialmente), REJEITADA (não atende), ou outra aplicável.",
          },
          confidence: {
            type: "integer",
            description: "Confiança de 0 a 100 na avaliação.",
          },
          analysis: {
            type: "string",
            description:
              "Análise técnica em português: o que a evidência demonstra, lacunas e recomendações.",
          },
        },
        required: ["suggestedStatus", "confidence", "analysis"],
      },
    },
  });

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      aiAnalysis: verdict.analysis,
      aiSuggestedStatus: verdict.suggestedStatus,
      aiConfidence: Math.max(0, Math.min(100, Math.round(verdict.confidence))),
      aiEvaluatedAt: new Date(),
    },
  });
}
