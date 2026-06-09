"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, requireCapability } from "@/lib/session";
import { ForbiddenError, can } from "@/lib/permissions";
import { clientSchema } from "@/lib/validators";
import { logActivity } from "@/lib/activity";

export type FormState = { error?: string } | undefined;

function readClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    unit: formData.get("unit"),
    responsible: formData.get("responsible"),
    contact: formData.get("contact"),
    segment: formData.get("segment"),
    scope: formData.get("scope"),
    notes: formData.get("notes"),
  });
}

export async function createClient(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await getContext();
  try {
    requireCapability(ctx, "manage_clients");
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
  if (!ctx.orgId) return { error: "Sem organização ativa" };
  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const client = await prisma.client.create({
    data: { ...parsed.data, userId: ctx.user.id, organizationId: ctx.orgId },
  });

  // Usuários não-ADMIN só enxergam clientes vinculados; vincula o criador ao novo
  // cliente e o torna o responsável inicial (modelo "responsável define acesso").
  if (ctx.role !== "ADMIN") {
    const membership = await prisma.membership.findFirst({
      where: { userId: ctx.user.id, organizationId: ctx.orgId },
    });
    if (membership) {
      await prisma.membershipClient.create({
        data: { membershipId: membership.id, clientId: client.id },
      });
      await prisma.client.update({
        where: { id: client.id },
        data: { responsibleMembershipId: membership.id },
      });
    }
  }

  await logActivity(ctx, {
    action: "CLIENT_CREATED",
    entityType: "client",
    entityId: client.id,
    clientId: client.id,
    summary: `Cadastrou o cliente ${client.name}`,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}

export async function updateClient(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await getContext();
  try {
    requireCapability(ctx, "manage_clients");
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Garante que o cliente pertence à organização do usuário.
  const existing = await prisma.client.findFirst({
    where: { id, ...clientWhere(ctx) },
  });
  if (!existing) return { error: "Cliente não encontrado" };

  await prisma.client.update({ where: { id }, data: parsed.data });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function deleteClient(id: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients")) return;
  const existing = await prisma.client.findFirst({
    where: { id, ...clientWhere(ctx) },
  });
  if (!existing) return;

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
  redirect("/clientes");
}

// Define (ou remove) o consultor responsável por um cliente. "Responsável define
// acesso": ao designar, o membership passa a ser o ÚNICO não-ADMIN com acesso ao
// cliente (modelo de dono único) — os vínculos de visibilidade são sincronizados
// numa transação. Apenas o supervisor (manage_members) atribui.
export async function setClientResponsible(
  clientId: string,
  membershipIdRaw: string | null
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) return;

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: ctx.orgId },
    select: { id: true, name: true },
  });
  if (!client) return;

  const membershipId = membershipIdRaw && membershipIdRaw.length ? membershipIdRaw : null;
  let membership: { id: string; role: string; user: { name: string } } | null = null;
  if (membershipId) {
    membership = await prisma.membership.findFirst({
      where: { id: membershipId, organizationId: ctx.orgId },
      select: { id: true, role: true, user: { select: { name: true } } },
    });
    if (!membership || membership.role === "CLIENTE") return; // portal não é responsável
  }

  await prisma.$transaction(async (tx) => {
    // Dono único: zera o acesso de não-ADMIN a este cliente e recria só o do responsável.
    await tx.membershipClient.deleteMany({ where: { clientId } });
    if (membership && membership.role !== "ADMIN") {
      await tx.membershipClient.create({ data: { membershipId: membership.id, clientId } });
    }
    await tx.client.update({
      where: { id: clientId },
      data: { responsibleMembershipId: membership?.id ?? null },
    });
  });

  await logActivity(ctx, {
    action: "RESPONSIBLE_SET",
    entityType: "client",
    entityId: clientId,
    clientId,
    summary: membership
      ? `Definiu ${membership.user.name} como responsável por ${client.name}`
      : `Removeu o responsável de ${client.name}`,
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/equipe");
}

// Define (ou remove) o consultor responsável por um PROJETO. Não altera acesso (o
// acesso vem do cliente); serve para accountability/exibição.
export async function setProjectResponsible(
  projectId: string,
  membershipIdRaw: string | null
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) return;

  const project = await prisma.isoProject.findFirst({
    where: { id: projectId, client: { organizationId: ctx.orgId } },
    select: { id: true, client: { select: { id: true } } },
  });
  if (!project) return;

  const membershipId = membershipIdRaw && membershipIdRaw.length ? membershipIdRaw : null;
  let mName: string | null = null;
  if (membershipId) {
    const m = await prisma.membership.findFirst({
      where: { id: membershipId, organizationId: ctx.orgId },
      select: { role: true, user: { select: { name: true } } },
    });
    if (!m || m.role === "CLIENTE") return;
    mName = m.user.name;
  }

  await prisma.isoProject.update({
    where: { id: projectId },
    data: { responsibleMembershipId: membershipId },
  });

  await logActivity(ctx, {
    action: "RESPONSIBLE_SET",
    entityType: "project",
    entityId: projectId,
    clientId: project.client.id,
    projectId,
    summary: mName
      ? `Definiu ${mName} como responsável pelo projeto`
      : "Removeu o responsável do projeto",
  });

  revalidatePath(`/projetos/${projectId}`);
  revalidatePath("/equipe");
}
