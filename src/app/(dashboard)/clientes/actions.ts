"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, requireCapability } from "@/lib/session";
import { ForbiddenError, can } from "@/lib/permissions";
import { clientSchema } from "@/lib/validators";

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
  // cliente para que ele mantenha acesso ao que acabou de cadastrar.
  if (ctx.role !== "ADMIN") {
    const membership = await prisma.membership.findFirst({
      where: { userId: ctx.user.id, organizationId: ctx.orgId },
    });
    if (membership) {
      await prisma.membershipClient.create({
        data: { membershipId: membership.id, clientId: client.id },
      });
    }
  }

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
