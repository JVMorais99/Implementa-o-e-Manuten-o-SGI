import { prisma } from "@/lib/prisma";
import { PROJECT_REQUIREMENT_STATUSES } from "@/lib/enums";
import { generateStructured } from "./client";
import {
  loadRequirement,
  requirementSummary,
  evidenceSummary,
} from "./context";

// Sugere um status de conformidade para o requisito com base em todas as
// evidências e documentos existentes, com justificativa. É consultivo: grava em
// campos ai* e não altera o status oficial.

const SYSTEM = `Você é um auditor líder ISO experiente. Com base nas evidências e documentos disponíveis,
avalie o grau de conformidade do requisito normativo e sugira um status.
Considere conforme apenas quando houver evidência objetiva suficiente. Responda em português do Brasil,
de forma técnica e fundamentada. Não invente evidências inexistentes.`;

interface ConformityVerdict {
  suggestedStatus: (typeof PROJECT_REQUIREMENT_STATUSES)[number];
  rationale: string;
}

export async function suggestConformity(prId: string): Promise<void> {
  const pr = await loadRequirement(prId);
  if (!pr) throw new Error("Requisito não encontrado.");

  const verdict = await generateStructured<ConformityVerdict>({
    system: SYSTEM,
    content: [
      {
        type: "text",
        text: `Contexto do requisito:\n${requirementSummary(pr)}\n\nSituação atual:\n${evidenceSummary(pr)}\n\nSugira o status de conformidade e justifique usando a ferramenta.`,
      },
    ],
    tool: {
      name: "sugerir_conformidade",
      description: "Sugere o status de conformidade do requisito com justificativa.",
      input_schema: {
        type: "object",
        properties: {
          suggestedStatus: {
            type: "string",
            enum: [...PROJECT_REQUIREMENT_STATUSES],
            description:
              "Status sugerido (ex.: CONFORME, PARCIAL, NAO_CONFORME, EM_ANALISE).",
          },
          rationale: {
            type: "string",
            description:
              "Justificativa técnica: o que sustenta o status e o que falta para a conformidade plena.",
          },
        },
        required: ["suggestedStatus", "rationale"],
      },
    },
  });

  await prisma.projectRequirement.update({
    where: { id: prId },
    data: {
      aiSuggestedStatus: verdict.suggestedStatus,
      aiRationale: verdict.rationale,
      aiEvaluatedAt: new Date(),
    },
  });
}
