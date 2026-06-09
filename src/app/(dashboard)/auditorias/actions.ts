"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, type AccessContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import { auditSchema, auditItemUpdateSchema, findingSchema } from "@/lib/validators";
import { logActivity } from "@/lib/activity";
import { FINDING_TYPE_LABELS, type FindingType } from "@/lib/enums";

export type AuditFormState = { error?: string; ok?: boolean } | undefined;

// Garante que a auditoria pertence a um projeto de um cliente da organização.
async function loadOwnedAudit(auditId: string, ctx: AccessContext) {
  return prisma.audit.findFirst({
    where: { id: auditId, project: { client: clientWhere(ctx) } },
    select: { id: true, projectId: true, project: { select: { clientId: true } } },
  });
}

function toDate(v?: string) {
  return v ? new Date(v) : null;
}

export async function createAudit(
  _prev: AuditFormState,
  formData: FormData
): Promise<AuditFormState> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_audits"))
    return { error: "Você não tem permissão para esta ação." };

  const parsed = auditSchema.safeParse({
    projectId: formData.get("projectId"),
    type: formData.get("type"),
    title: formData.get("title"),
    scope: formData.get("scope"),
    objective: formData.get("objective"),
    criteria: formData.get("criteria"),
    leadAuditor: formData.get("leadAuditor"),
    auditTeam: formData.get("auditTeam"),
    auditedOrg: formData.get("auditedOrg"),
    plannedDate: formData.get("plannedDate"),
    executedDate: formData.get("executedDate"),
    status: formData.get("status") || "PLANEJADA",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  // Projeto precisa pertencer ao usuário; carrega a trilha para o checklist.
  const project = await prisma.isoProject.findFirst({
    where: { id: data.projectId, client: clientWhere(ctx) },
    include: { requirements: { select: { id: true } } },
  });
  if (!project) return { error: "Projeto inválido" };

  const audit = await prisma.audit.create({
    data: {
      projectId: project.id,
      type: data.type,
      title: data.title,
      scope: data.scope ?? null,
      objective: data.objective ?? null,
      criteria: data.criteria ?? null,
      leadAuditor: data.leadAuditor ?? null,
      auditTeam: data.auditTeam ?? null,
      auditedOrg: data.auditedOrg ?? null,
      plannedDate: toDate(data.plannedDate),
      executedDate: toDate(data.executedDate),
      status: data.status,
      // Checklist: um item por requisito da trilha (deduplicada) do projeto.
      items: {
        create: project.requirements.map((r) => ({
          projectRequirementId: r.id,
          result: "NAO_AVALIADO",
        })),
      },
    },
  });

  await logActivity(ctx, {
    action: "AUDIT_CREATED",
    entityType: "audit",
    entityId: audit.id,
    clientId: project.clientId,
    projectId: project.id,
    summary: `Criou a auditoria "${data.title}"`,
  });

  revalidatePath("/auditorias");
  redirect(`/auditorias/${audit.id}`);
}

// Salva apenas a conclusão/parecer (form dedicado — não toca nos demais campos).
export async function updateConclusion(
  auditId: string,
  _prev: AuditFormState,
  formData: FormData
): Promise<AuditFormState> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return { error: "Auditoria não encontrada" };

  const conclusion = (formData.get("conclusion") as string)?.trim() || null;
  await prisma.audit.update({ where: { id: auditId }, data: { conclusion } });

  revalidatePath(`/auditorias/${auditId}`);
  return { ok: true };
}

export async function setAuditStatus(auditId: string, status: string): Promise<void> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return;

  // Ao concluir, carimba a data de execução se ainda não houver.
  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status,
      ...(status === "CONCLUIDA" && !audit?.executedDate
        ? { executedDate: new Date() }
        : {}),
    },
  });

  revalidatePath(`/auditorias/${auditId}`);
  revalidatePath("/auditorias");
}

export async function deleteAudit(auditId: string): Promise<void> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return;

  await prisma.audit.delete({ where: { id: auditId } });
  revalidatePath("/auditorias");
  redirect("/auditorias");
}

export async function updateAuditItem(
  auditId: string,
  itemId: string,
  _prev: AuditFormState,
  formData: FormData
): Promise<AuditFormState> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return { error: "Auditoria não encontrada" };

  const parsed = auditItemUpdateSchema.safeParse({
    result: formData.get("result"),
    notes: formData.get("notes"),
    evidenceSampled: formData.get("evidenceSampled"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.auditItem.updateMany({
    where: { id: itemId, auditId },
    data: {
      result: parsed.data.result,
      notes: parsed.data.notes ?? null,
      evidenceSampled: parsed.data.evidenceSampled ?? null,
    },
  });

  revalidatePath(`/auditorias/${auditId}`);
  return { ok: true } as AuditFormState;
}

export async function createFinding(
  auditId: string,
  _prev: AuditFormState,
  formData: FormData
): Promise<AuditFormState> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return { error: "Auditoria não encontrada" };

  const parsed = findingSchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description"),
    projectRequirementId: formData.get("projectRequirementId"),
    evidence: formData.get("evidence"),
    correction: formData.get("correction"),
    rootCause: formData.get("rootCause"),
    correctiveAction: formData.get("correctiveAction"),
    responsible: formData.get("responsible"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status") || "ABERTA",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  // Snapshot do código do requisito (para o relatório), se vinculado.
  let requirementCode: string | null = null;
  if (d.projectRequirementId) {
    const pr = await prisma.projectRequirement.findFirst({
      where: { id: d.projectRequirementId, project: { audits: { some: { id: auditId } } } },
      include: { requirement: { select: { code: true } } },
    });
    requirementCode = pr?.requirement.code ?? null;
    if (!pr) d.projectRequirementId = undefined;
  }

  const finding = await prisma.auditFinding.create({
    data: {
      auditId,
      type: d.type,
      description: d.description,
      projectRequirementId: d.projectRequirementId ?? null,
      requirementCode,
      evidence: d.evidence ?? null,
      correction: d.correction ?? null,
      rootCause: d.rootCause ?? null,
      correctiveAction: d.correctiveAction ?? null,
      responsible: d.responsible ?? null,
      dueDate: toDate(d.dueDate),
      status: d.status,
    },
  });

  await logActivity(ctx, {
    action: "FINDING_CREATED",
    entityType: "finding",
    entityId: finding.id,
    clientId: owned.project.clientId,
    projectId: owned.projectId,
    summary: `Registrou constatação (${
      FINDING_TYPE_LABELS[d.type as FindingType]
    })${requirementCode ? ` no requisito ${requirementCode}` : ""}`,
  });

  revalidatePath(`/auditorias/${auditId}`);
  return { ok: true } as AuditFormState;
}

export async function setFindingStatus(
  auditId: string,
  findingId: string,
  status: string
): Promise<void> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return;

  await prisma.auditFinding.updateMany({
    where: { id: findingId, auditId },
    data: { status },
  });
  revalidatePath(`/auditorias/${auditId}`);
}

export async function deleteFinding(auditId: string, findingId: string): Promise<void> {
  const ctx = await getContext();
  const owned = can(ctx.role, "manage_audits")
    ? await loadOwnedAudit(auditId, ctx)
    : null;
  if (!owned) return;

  await prisma.auditFinding.deleteMany({ where: { id: findingId, auditId } });
  revalidatePath(`/auditorias/${auditId}`);
}
