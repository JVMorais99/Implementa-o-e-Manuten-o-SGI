"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { aiEnabled } from "@/lib/features";
import {
  STATUS_COMPLETION_PERCENT,
  type ProjectRequirementStatus,
  PROJECT_REQUIREMENT_STATUSES,
  EVIDENCE_STATUSES,
} from "@/lib/enums";
import { analyzeEvidence } from "@/lib/ai/evidence-analysis";
import { suggestConformity } from "@/lib/ai/conformity";
import { generateActionPlan } from "@/lib/ai/action-plan";

export type AiActionState = { error?: string; ok?: string } | undefined;

// Garante permissão de IA, chave configurada e que o requisito pertence ao
// escopo do usuário. Retorna o requisito (id/projectId) ou um estado de erro.
async function guard(prId: string) {
  const ctx = await getContext();
  if (!can(ctx.role, "ai_assist")) {
    return { error: "Você não tem permissão para usar o assistente de IA." as const };
  }
  if (!aiEnabled()) {
    return { error: "IA desabilitada: configure ANTHROPIC_API_KEY." as const };
  }
  const pr = await prisma.projectRequirement.findFirst({
    where: { id: prId, project: { client: clientWhere(ctx) } },
    select: { id: true, projectId: true },
  });
  if (!pr) return { error: "Requisito não encontrado." as const };
  return { pr };
}

function revalidateReq(projectId: string, prId: string) {
  revalidatePath(`/projetos/${projectId}/requisitos/${prId}`);
  revalidatePath(`/projetos/${projectId}`);
}

export async function analyzeEvidenceAction(
  prId: string,
  _prev: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  const g = await guard(prId);
  if ("error" in g) return g;
  const evidenceId = String(formData.get("evidenceId") ?? "");
  try {
    const ev = await prisma.evidence.findFirst({
      where: { id: evidenceId, projectRequirementId: prId },
      select: { id: true },
    });
    if (!ev) return { error: "Evidência não encontrada." };
    await analyzeEvidence(evidenceId);
    revalidateReq(g.pr.projectId, prId);
    return { ok: "Evidência analisada pela IA." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha na análise de IA." };
  }
}

export async function suggestConformityAction(
  prId: string,
  _prev: AiActionState,
  _formData: FormData
): Promise<AiActionState> {
  const g = await guard(prId);
  if ("error" in g) return g;
  try {
    await suggestConformity(prId);
    revalidateReq(g.pr.projectId, prId);
    return { ok: "Sugestão de conformidade gerada." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao sugerir conformidade." };
  }
}

export async function generateActionPlanAction(
  prId: string,
  _prev: AiActionState,
  _formData: FormData
): Promise<AiActionState> {
  const g = await guard(prId);
  if ("error" in g) return g;
  try {
    const count = await generateActionPlan(prId);
    revalidateReq(g.pr.projectId, prId);
    return {
      ok: count
        ? `${count} ação(ões) sugerida(s) e adicionada(s) ao plano.`
        : "A IA não sugeriu novas ações (requisito já atendido).",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao gerar plano de ação." };
  }
}

// Aplica a sugestão de conformidade da IA ao status oficial do requisito
// (continua exigindo a capability edit_requirements).
export async function applyConformitySuggestion(
  prId: string,
  _prev: AiActionState,
  _formData: FormData
): Promise<AiActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) {
    return { error: "Você não tem permissão para alterar o requisito." };
  }
  const pr = await prisma.projectRequirement.findFirst({
    where: { id: prId, project: { client: clientWhere(ctx) } },
    select: { id: true, projectId: true, aiSuggestedStatus: true },
  });
  if (!pr) return { error: "Requisito não encontrado." };
  const status = pr.aiSuggestedStatus;
  if (!status || !PROJECT_REQUIREMENT_STATUSES.includes(status as never)) {
    return { error: "Não há sugestão de status válida para aplicar." };
  }
  await prisma.projectRequirement.update({
    where: { id: prId },
    data: {
      status,
      completionPercent: STATUS_COMPLETION_PERCENT[status as ProjectRequirementStatus],
    },
  });
  revalidateReq(pr.projectId, prId);
  return { ok: "Status atualizado conforme sugestão da IA." };
}

// Aplica a sugestão de status da IA a uma evidência (evidenceId vem no formData).
export async function applyEvidenceSuggestion(
  prId: string,
  _prev: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) {
    return { error: "Você não tem permissão para alterar a evidência." };
  }
  const pr = await prisma.projectRequirement.findFirst({
    where: { id: prId, project: { client: clientWhere(ctx) } },
    select: { id: true, projectId: true },
  });
  if (!pr) return { error: "Requisito não encontrado." };
  const evidenceId = String(formData.get("evidenceId") ?? "");
  const ev = await prisma.evidence.findFirst({
    where: { id: evidenceId, projectRequirementId: prId },
    select: { id: true, aiSuggestedStatus: true },
  });
  if (!ev) return { error: "Evidência não encontrada." };
  const status = ev.aiSuggestedStatus;
  if (!status || !EVIDENCE_STATUSES.includes(status as never)) {
    return { error: "Não há sugestão de status válida para aplicar." };
  }
  await prisma.evidence.update({ where: { id: evidenceId }, data: { status } });
  revalidateReq(pr.projectId, prId);
  return { ok: "Status da evidência atualizado." };
}
