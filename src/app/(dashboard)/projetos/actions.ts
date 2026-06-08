"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, requireCapability } from "@/lib/session";
import { ForbiddenError, can } from "@/lib/permissions";
import { projectSchema } from "@/lib/validators";

export type FormState = { error?: string } | undefined;

export async function createProject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await getContext();
  try {
    requireCapability(ctx, "manage_projects");
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  const parsed = projectSchema.safeParse({
    clientId: formData.get("clientId"),
    type: formData.get("type"),
    standardIds: formData.getAll("standardIds"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    responsible: formData.get("responsible"),
    status: formData.get("status") || "EM_ANDAMENTO",
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  // Garante que o cliente pertence à organização do usuário.
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, ...clientWhere(ctx) },
  });
  if (!client) return { error: "Cliente inválido" };

  // Busca os requisitos das normas selecionadas para materializar a trilha.
  const requirements = await prisma.isoRequirement.findMany({
    where: { standardId: { in: data.standardIds } },
    select: { id: true, standardId: true, code: true, order: true },
  });
  if (requirements.length === 0) {
    return { error: "As normas selecionadas não possuem requisitos cadastrados." };
  }

  // Deduplicação por CÓDIGO: normas do mesmo Sistema de Gestão Integrado (Annex SL)
  // compartilham os requisitos da estrutura de alto nível (ex.: 4.1, 5.1...). A trilha
  // deve listar cada requisito UMA vez; o documento gerado é que abrange todas as
  // normas. Escolhe-se um requisito "canônico" por código, priorizando a ordem em que
  // as normas foram selecionadas e depois a ordem do catálogo.
  const standardPriority = new Map(data.standardIds.map((id, i) => [id, i]));
  const canonicalByCode = new Map<string, (typeof requirements)[number]>();
  for (const req of requirements) {
    const current = canonicalByCode.get(req.code);
    if (!current) {
      canonicalByCode.set(req.code, req);
      continue;
    }
    const better =
      (standardPriority.get(req.standardId) ?? 99) <
        (standardPriority.get(current.standardId) ?? 99) ||
      ((standardPriority.get(req.standardId) ?? 99) ===
        (standardPriority.get(current.standardId) ?? 99) &&
        req.order < current.order);
    if (better) canonicalByCode.set(req.code, req);
  }
  const canonical = [...canonicalByCode.values()];

  const project = await prisma.isoProject.create({
    data: {
      clientId: data.clientId,
      type: data.type,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      responsible: data.responsible ?? null,
      status: data.status,
      notes: data.notes ?? null,
      standards: {
        create: data.standardIds.map((standardId) => ({ standardId })),
      },
      requirements: {
        create: canonical.map((req) => ({
          standardId: req.standardId,
          requirementId: req.id,
          status: "NAO_INICIADO",
        })),
      },
    },
  });

  revalidatePath("/projetos");
  revalidatePath(`/clientes/${data.clientId}`);
  redirect(`/projetos/${project.id}`);
}

export async function deleteProject(id: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_projects")) return;
  const project = await prisma.isoProject.findFirst({
    where: { id, client: clientWhere(ctx) },
    select: { id: true, clientId: true },
  });
  if (!project) return;

  await prisma.isoProject.delete({ where: { id } });
  revalidatePath("/projetos");
  revalidatePath(`/clientes/${project.clientId}`);
  redirect(`/clientes/${project.clientId}`);
}
