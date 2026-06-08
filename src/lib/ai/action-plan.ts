import { prisma } from "@/lib/prisma";
import { ACTION_PLAN_PRIORITIES } from "@/lib/enums";
import { generateStructured } from "./client";
import {
  loadRequirement,
  requirementSummary,
  evidenceSummary,
} from "./context";

// Gera itens de plano de ação (5W2H) para fechar as lacunas do requisito e os
// grava como ActionPlan marcados com aiGenerated = true.

const SYSTEM = `Você é um consultor ISO sênior. Proponha um plano de ação prático (estilo 5W2H) para a
organização atingir a conformidade do requisito normativo, considerando as lacunas observadas nas
evidências. Cada ação deve ser específica, verificável e em português do Brasil. Não proponha ações
para requisitos já plenamente atendidos.`;

interface GeneratedActions {
  actions: {
    action: string;
    responsible?: string;
    priority?: (typeof ACTION_PLAN_PRIORITIES)[number];
    dueInDays?: number;
  }[];
}

export async function generateActionPlan(prId: string): Promise<number> {
  const pr = await loadRequirement(prId);
  if (!pr) throw new Error("Requisito não encontrado.");

  const result = await generateStructured<GeneratedActions>({
    system: SYSTEM,
    content: [
      {
        type: "text",
        text: `Contexto do requisito:\n${requirementSummary(pr)}\n\nSituação atual:\n${evidenceSummary(pr)}\n\nProponha de 2 a 5 ações usando a ferramenta.`,
      },
    ],
    tool: {
      name: "propor_plano_acao",
      description: "Propõe itens de plano de ação para o requisito.",
      input_schema: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            description: "Lista de ações propostas (2 a 5).",
            items: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  description: "Descrição da ação (o quê e como).",
                },
                responsible: {
                  type: "string",
                  description: "Papel/área responsável sugerida.",
                },
                priority: {
                  type: "string",
                  enum: [...ACTION_PLAN_PRIORITIES],
                  description: "Prioridade sugerida.",
                },
                dueInDays: {
                  type: "integer",
                  description: "Prazo sugerido em dias a partir de hoje.",
                },
              },
              required: ["action"],
            },
          },
        },
        required: ["actions"],
      },
    },
  });

  const items = (result.actions ?? []).slice(0, 5);
  if (items.length === 0) return 0;

  await prisma.actionPlan.createMany({
    data: items.map((a) => ({
      projectRequirementId: prId,
      action: a.action,
      responsible: a.responsible ?? null,
      priority: ACTION_PLAN_PRIORITIES.includes(a.priority as never)
        ? (a.priority as string)
        : "MEDIA",
      dueDate:
        typeof a.dueInDays === "number"
          ? new Date(Date.now() + a.dueInDays * 24 * 60 * 60 * 1000)
          : null,
      status: "ABERTO",
      aiGenerated: true,
    })),
  });

  return items.length;
}
