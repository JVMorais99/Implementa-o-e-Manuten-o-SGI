"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, type AccessContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import {
  generateDocument,
  generateGenericDocument,
  type DocContext,
} from "@/lib/doc-generator";
import { parseJsonArray, mergeUnique } from "@/lib/utils";
import {
  STATUS_COMPLETION_PERCENT,
  type ProjectRequirementStatus,
  type ActivityAction,
} from "@/lib/enums";
import { logActivity } from "@/lib/activity";
import type { ActionState } from "./actions";

async function loadOwnedRequirement(prId: string, ctx: AccessContext) {
  return prisma.projectRequirement.findFirst({
    where: { id: prId, project: { client: clientWhere(ctx) } },
    include: {
      requirement: true,
      project: {
        include: {
          client: true,
          standards: { include: { standard: true } },
        },
      },
    },
  });
}

// Cria um snapshot de revisão no histórico do documento.
async function snapshotVersion(params: {
  documentId: string;
  revision: number;
  title: string;
  contentHtml: string;
  status: string;
  changeNote: string;
  authorId?: string;
  authorName?: string | null;
}) {
  await prisma.documentVersion.create({
    data: {
      documentId: params.documentId,
      revision: params.revision,
      title: params.title,
      contentHtml: params.contentHtml,
      status: params.status,
      changeNote: params.changeNote,
      authorId: params.authorId ?? null,
      authorName: params.authorName ?? null,
    },
  });
}

export async function generateDocumentForRequirement(
  prId: string,
  templateId: string
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_documents")) return;
  const pr = await loadOwnedRequirement(prId, ctx);
  if (!pr) return;

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) return;

  const context: DocContext = {
    cliente: {
      nome: pr.project.client.name,
      cnpj: pr.project.client.cnpj,
      segmento: pr.project.client.segment,
      escopo: pr.project.client.scope,
      responsavel: pr.project.client.responsible,
    },
    projeto: { tipo: pr.project.type },
    normas: pr.project.standards.map((s) => s.standard.code),
    requisito: { codigo: pr.requirement.code, titulo: pr.requirement.title },
  };

  const { title, contentHtml } = generateDocument(template, context);

  const doc = await prisma.generatedDocument.create({
    data: {
      projectRequirementId: prId,
      templateId: template.id,
      title,
      contentHtml,
      status: "GERADO",
      revision: 0,
    },
  });
  await snapshotVersion({
    documentId: doc.id,
    revision: 0,
    title,
    contentHtml,
    status: "GERADO",
    changeNote: "Emissão inicial (gerado a partir do modelo)",
    authorId: ctx.user.id,
    authorName: ctx.user.name,
  });

  // Avança o status do requisito se ainda não iniciado.
  if (pr.status === "NAO_INICIADO") {
    await prisma.projectRequirement.update({
      where: { id: prId },
      data: { status: "GERADO_SISTEMA", completionPercent: 35 },
    });
  }

  await logActivity(ctx, {
    action: "DOC_GENERATED",
    entityType: "document",
    entityId: doc.id,
    clientId: pr.project.clientId,
    projectId: pr.projectId,
    summary: `Gerou o documento "${title}" (req. ${pr.requirement.code})`,
  });

  revalidatePath(`/projetos/${pr.projectId}/requisitos/${prId}`);
  redirect(`/projetos/${pr.projectId}/requisitos/${prId}/documentos/${doc.id}`);
}

// Geração genérica: disponível para QUALQUER requisito, mesmo sem template.
// Produz um documento profissional específico do requisito, ciente das normas.
export async function generateGenericForRequirement(prId: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_documents")) return;
  const pr = await loadOwnedRequirement(prId, ctx);
  if (!pr) return;

  // Como a trilha deduplica por código, este requisito pode ser comum a várias
  // normas do projeto. Mesclamos as evidências esperadas de todas as normas que
  // compartilham o código, para que o documento gerado contemple cada uma delas.
  const siblings = await prisma.isoRequirement.findMany({
    where: {
      code: pr.requirement.code,
      standardId: { in: pr.project.standards.map((s) => s.standardId) },
    },
    select: { expectedEvidence: true },
  });
  const evidenciasEsperadas = mergeUnique(
    (siblings.length ? siblings : [pr.requirement]).map((r) =>
      parseJsonArray(r.expectedEvidence)
    )
  );

  const context: DocContext = {
    cliente: {
      nome: pr.project.client.name,
      cnpj: pr.project.client.cnpj,
      segmento: pr.project.client.segment,
      escopo: pr.project.client.scope,
      responsavel: pr.project.client.responsible,
    },
    projeto: { tipo: pr.project.type },
    normas: pr.project.standards.map((s) => s.standard.code),
    requisito: {
      codigo: pr.requirement.code,
      titulo: pr.requirement.title,
      descricao: pr.requirement.description,
      orientacao: pr.requirement.consultantGuidance,
      perguntaSugerida: pr.requirement.suggestedQuestion,
      evidenciasEsperadas,
    },
  };

  const { title, contentHtml } = generateGenericDocument(context);

  const doc = await prisma.generatedDocument.create({
    data: {
      projectRequirementId: prId,
      templateId: null,
      title,
      contentHtml,
      status: "GERADO",
      revision: 0,
    },
  });
  await snapshotVersion({
    documentId: doc.id,
    revision: 0,
    title,
    contentHtml,
    status: "GERADO",
    changeNote: "Emissão inicial (documento de atendimento ao requisito)",
    authorId: ctx.user.id,
    authorName: ctx.user.name,
  });

  if (pr.status === "NAO_INICIADO") {
    await prisma.projectRequirement.update({
      where: { id: prId },
      data: { status: "GERADO_SISTEMA", completionPercent: 35 },
    });
  }

  await logActivity(ctx, {
    action: "DOC_GENERATED",
    entityType: "document",
    entityId: doc.id,
    clientId: pr.project.clientId,
    projectId: pr.projectId,
    summary: `Gerou o documento "${title}" (req. ${pr.requirement.code})`,
  });

  revalidatePath(`/projetos/${pr.projectId}/requisitos/${prId}`);
  redirect(`/projetos/${pr.projectId}/requisitos/${prId}/documentos/${doc.id}`);
}

export async function updateDocument(
  docId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_documents"))
    return { error: "Você não tem permissão para esta ação." };
  const doc = await prisma.generatedDocument.findFirst({
    where: {
      id: docId,
      projectRequirement: { project: { client: clientWhere(ctx) } },
    },
    include: { projectRequirement: { select: { projectId: true, id: true } } },
  });
  if (!doc) return { error: "Documento não encontrado" };

  const newTitle = (formData.get("title") as string)?.trim() || doc.title;
  const newContent = (formData.get("contentHtml") as string) ?? doc.contentHtml;
  const newStatus = (formData.get("status") as string) || doc.status;
  const changeNote =
    (formData.get("changeNote") as string)?.trim() || "Edição do documento";

  const changed =
    newTitle !== doc.title ||
    newContent !== doc.contentHtml ||
    newStatus !== doc.status;

  // Sem alterações: não cria nova revisão.
  if (!changed) {
    return { ok: true };
  }

  const newRevision = doc.revision + 1;

  await prisma.generatedDocument.update({
    where: { id: docId },
    data: {
      title: newTitle,
      contentHtml: newContent,
      status: newStatus,
      revision: newRevision,
    },
  });
  await snapshotVersion({
    documentId: docId,
    revision: newRevision,
    title: newTitle,
    contentHtml: newContent,
    status: newStatus,
    changeNote,
    authorId: ctx.user.id,
    authorName: ctx.user.name,
  });

  revalidatePath(
    `/projetos/${doc.projectRequirement.projectId}/requisitos/${doc.projectRequirement.id}/documentos/${docId}`
  );
  return { ok: true };
}

// Restaura o conteúdo de uma revisão anterior criando uma NOVA revisão
// (histórico append-only: nada é perdido).
export async function restoreVersion(
  docId: string,
  versionId: string
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_documents")) return;
  const doc = await prisma.generatedDocument.findFirst({
    where: {
      id: docId,
      projectRequirement: { project: { client: clientWhere(ctx) } },
    },
    include: { projectRequirement: { select: { projectId: true, id: true } } },
  });
  if (!doc) return;

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: docId },
  });
  if (!version) return;

  const newRevision = doc.revision + 1;

  await prisma.generatedDocument.update({
    where: { id: docId },
    data: {
      title: version.title,
      contentHtml: version.contentHtml,
      status: version.status,
      revision: newRevision,
    },
  });
  await snapshotVersion({
    documentId: docId,
    revision: newRevision,
    title: version.title,
    contentHtml: version.contentHtml,
    status: version.status,
    changeNote: `Restaurado da revisão ${String(version.revision).padStart(2, "0")}`,
    authorId: ctx.user.id,
    authorName: ctx.user.name,
  });

  revalidatePath(
    `/projetos/${doc.projectRequirement.projectId}/requisitos/${doc.projectRequirement.id}/documentos/${docId}`
  );
  redirect(
    `/projetos/${doc.projectRequirement.projectId}/requisitos/${doc.projectRequirement.id}/documentos/${docId}`
  );
}

// ----- Ciclo de vida do documento: envio ao cliente, assinatura, aprovação -----
//
// Cada transição registra uma revisão no histórico (captura exatamente o conteúdo
// no momento do evento), atualiza o status/carimbo de data do documento e, quando
// fizer sentido, avança o status do requisito (sem retroceder).

type LifecycleStep = {
  docStatus: string;
  changeNote: string;
  stamp?: "sentToClientAt" | "signedReceivedAt";
  // Status mínimo do requisito após o evento (só avança se aumentar o progresso).
  requirementStatus?: ProjectRequirementStatus;
  // Atividade registrada na trilha (accountability).
  logAction: ActivityAction;
  logSummary: string;
};

async function advanceDocumentLifecycle(docId: string, step: LifecycleStep) {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_documents")) return;
  const doc = await prisma.generatedDocument.findFirst({
    where: {
      id: docId,
      projectRequirement: { project: { client: clientWhere(ctx) } },
    },
    include: {
      projectRequirement: {
        select: {
          id: true,
          projectId: true,
          status: true,
          completionPercent: true,
          project: { select: { clientId: true } },
        },
      },
    },
  });
  if (!doc) return;

  const newRevision = doc.revision + 1;

  await prisma.generatedDocument.update({
    where: { id: docId },
    data: {
      status: step.docStatus,
      revision: newRevision,
      ...(step.stamp ? { [step.stamp]: new Date() } : {}),
    },
  });
  await snapshotVersion({
    documentId: docId,
    revision: newRevision,
    title: doc.title,
    contentHtml: doc.contentHtml,
    status: step.docStatus,
    changeNote: step.changeNote,
    authorId: ctx.user.id,
    authorName: ctx.user.name,
  });

  // Avança o status do requisito apenas se representar progresso.
  const pr = doc.projectRequirement;
  if (step.requirementStatus) {
    const current = STATUS_COMPLETION_PERCENT[pr.status as ProjectRequirementStatus] ?? 0;
    const next = STATUS_COMPLETION_PERCENT[step.requirementStatus];
    if (next > current) {
      await prisma.projectRequirement.update({
        where: { id: pr.id },
        data: { status: step.requirementStatus, completionPercent: next },
      });
    }
  }

  await logActivity(ctx, {
    action: step.logAction,
    entityType: "document",
    entityId: docId,
    clientId: pr.project.clientId,
    projectId: pr.projectId,
    summary: `${step.logSummary}: "${doc.title}"`,
  });

  revalidatePath(
    `/projetos/${pr.projectId}/requisitos/${pr.id}/documentos/${docId}`
  );
  revalidatePath(`/projetos/${pr.projectId}/requisitos/${pr.id}`);
}

// Registra o envio do documento ao cliente (para análise/assinatura).
export async function sendDocumentToClient(docId: string): Promise<void> {
  await advanceDocumentLifecycle(docId, {
    docStatus: "ENVIADO_CLIENTE",
    changeNote: "Documento enviado ao cliente",
    stamp: "sentToClientAt",
    requirementStatus: "ENVIADO_CLIENTE",
    logAction: "DOC_SENT",
    logSummary: "Enviou documento ao cliente",
  });
}

// Registra o recebimento do documento assinado/devolvido pelo cliente.
export async function registerSignedReceipt(docId: string): Promise<void> {
  await advanceDocumentLifecycle(docId, {
    docStatus: "RECEBIDO_ASSINADO",
    changeNote: "Documento recebido assinado pelo cliente",
    stamp: "signedReceivedAt",
    requirementStatus: "RECEBIDO_CLIENTE",
    logAction: "DOC_SIGNED",
    logSummary: "Registrou recebimento assinado",
  });
}

// Aprovação final do documento pelo consultor.
export async function approveDocument(docId: string): Promise<void> {
  await advanceDocumentLifecycle(docId, {
    docStatus: "APROVADO",
    changeNote: "Documento aprovado",
    logAction: "DOC_APPROVED",
    logSummary: "Aprovou documento",
  });
}

export async function deleteDocument(prId: string, docId: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_documents")) return;
  const doc = await prisma.generatedDocument.findFirst({
    where: {
      id: docId,
      projectRequirementId: prId,
      projectRequirement: { project: { client: clientWhere(ctx) } },
    },
    include: { projectRequirement: { select: { projectId: true } } },
  });
  if (!doc) return;

  await prisma.generatedDocument.delete({ where: { id: docId } });
  revalidatePath(`/projetos/${doc.projectRequirement.projectId}/requisitos/${prId}`);
  redirect(`/projetos/${doc.projectRequirement.projectId}/requisitos/${prId}`);
}
