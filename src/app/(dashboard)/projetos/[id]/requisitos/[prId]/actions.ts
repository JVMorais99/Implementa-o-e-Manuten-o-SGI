"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, type AccessContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import {
  projectRequirementUpdateSchema,
  actionPlanSchema,
  commentSchema,
  evidenceSchema,
} from "@/lib/validators";
import {
  STATUS_COMPLETION_PERCENT,
  type ProjectRequirementStatus,
} from "@/lib/enums";
import { saveUploadedFile } from "@/lib/storage";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// Verifica se o projectRequirement pertence à organização do usuário (escopo).
async function assertOwnership(prId: string, ctx: AccessContext) {
  const pr = await prisma.projectRequirement.findFirst({
    where: { id: prId, project: { client: clientWhere(ctx) } },
    select: { id: true, projectId: true },
  });
  return pr;
}

function revalidateReq(projectId: string, prId: string) {
  revalidatePath(`/projetos/${projectId}/requisitos/${prId}`);
  revalidatePath(`/projetos/${projectId}`);
}

function denied(): ActionState {
  return { error: "Você não tem permissão para esta ação." };
}

export async function updateRequirement(
  prId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) return denied();
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return { error: "Requisito não encontrado" };

  const parsed = projectRequirementUpdateSchema.safeParse({
    status: formData.get("status") || undefined,
    consultantNotes: formData.get("consultantNotes"),
    clientNotes: formData.get("clientNotes"),
    responsible: formData.get("responsible"),
    dueDate: formData.get("dueDate"),
    completionPercent: formData.get("completionPercent") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  // Se o status mudou e não veio percentual explícito, sugere o percentual padrão.
  const completionPercent =
    data.completionPercent ??
    (data.status
      ? STATUS_COMPLETION_PERCENT[data.status as ProjectRequirementStatus]
      : undefined);

  await prisma.projectRequirement.update({
    where: { id: prId },
    data: {
      status: data.status,
      consultantNotes: data.consultantNotes ?? null,
      clientNotes: data.clientNotes ?? null,
      responsible: data.responsible ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      completionPercent,
    },
  });

  revalidateReq(pr.projectId, prId);
  return { ok: true };
}

// Atalho: marcar como conforme (botão dedicado).
export async function markConforme(prId: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) return;
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return;
  await prisma.projectRequirement.update({
    where: { id: prId },
    data: { status: "CONFORME", completionPercent: 100 },
  });
  revalidateReq(pr.projectId, prId);
}

export async function addComment(
  prId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "upload_evidence")) return denied();
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return { error: "Requisito não encontrado" };

  const parsed = commentSchema.safeParse({
    projectRequirementId: prId,
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Comentário inválido" };
  }

  await prisma.requirementComment.create({
    data: {
      projectRequirementId: prId,
      authorId: ctx.user.id,
      text: parsed.data.text,
    },
  });
  revalidateReq(pr.projectId, prId);
  return { ok: true };
}

export async function createActionPlan(
  prId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) return denied();
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return { error: "Requisito não encontrado" };

  const parsed = actionPlanSchema.safeParse({
    projectRequirementId: prId,
    action: formData.get("action"),
    responsible: formData.get("responsible"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status") || "ABERTO",
    priority: formData.get("priority") || "MEDIA",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  await prisma.actionPlan.create({
    data: {
      projectRequirementId: prId,
      action: data.action,
      responsible: data.responsible ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status,
      priority: data.priority,
    },
  });
  revalidateReq(pr.projectId, prId);
  return { ok: true };
}

export async function deleteActionPlan(
  prId: string,
  actionPlanId: string
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) return;
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return;
  await prisma.actionPlan.deleteMany({
    where: { id: actionPlanId, projectRequirementId: prId },
  });
  revalidateReq(pr.projectId, prId);
}

export async function uploadEvidence(
  prId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "upload_evidence")) return denied();
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return { error: "Requisito não encontrado" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo para upload." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { error: "Arquivo muito grande (máximo 15 MB)." };
  }

  const parsed = evidenceSchema.safeParse({
    projectRequirementId: prId,
    title: formData.get("title"),
    type: formData.get("type"),
    status: formData.get("status") || "RECEBIDA",
    technicalAnalysis: formData.get("technicalAnalysis"),
    receivedAt: formData.get("receivedAt"),
    expiresAt: formData.get("expiresAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const saved = await saveUploadedFile(file);

  await prisma.evidence.create({
    data: {
      projectRequirementId: prId,
      title: data.title,
      type: data.type,
      fileName: saved.originalName,
      fileUrl: saved.storedName,
      status: data.status,
      technicalAnalysis: data.technicalAnalysis ?? null,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  revalidateReq(pr.projectId, prId);
  return { ok: true };
}

export async function deleteEvidence(
  prId: string,
  evidenceId: string
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "edit_requirements")) return;
  const pr = await assertOwnership(prId, ctx);
  if (!pr) return;
  await prisma.evidence.deleteMany({
    where: { id: evidenceId, projectRequirementId: prId },
  });
  revalidateReq(pr.projectId, prId);
}
