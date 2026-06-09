"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere, type AccessContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import { certificationSchema } from "@/lib/validators";
import { logActivity } from "@/lib/activity";

export type CertFormState = { error?: string } | undefined;

// Garante que a certificação pertence a um cliente visível ao usuário.
async function loadOwnedCert(id: string, ctx: AccessContext) {
  return prisma.certification.findFirst({
    where: { id, client: clientWhere(ctx) },
    select: {
      id: true,
      clientId: true,
      lastSurveillanceAt: true,
      client: { select: { name: true } },
      standard: { select: { code: true } },
    },
  });
}

function parseForm(formData: FormData) {
  return certificationSchema.safeParse({
    clientId: formData.get("clientId"),
    standardId: formData.get("standardId"),
    certifyingBody: formData.get("certifyingBody"),
    certificateNo: formData.get("certificateNo"),
    scope: formData.get("scope"),
    issuedAt: formData.get("issuedAt"),
    expiresAt: formData.get("expiresAt"),
    surveillanceIntervalMonths: formData.get("surveillanceIntervalMonths") ?? 12,
    status: formData.get("status") || "ATIVA",
    notes: formData.get("notes"),
  });
}

export async function createCertification(
  _prev: CertFormState,
  formData: FormData
): Promise<CertFormState> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients"))
    return { error: "Você não tem permissão para esta ação." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  // Cliente precisa pertencer ao escopo; norma precisa existir.
  const client = await prisma.client.findFirst({
    where: { id: d.clientId, ...clientWhere(ctx) },
    select: { id: true, name: true },
  });
  if (!client) return { error: "Cliente inválido" };
  const standard = await prisma.isoStandard.findUnique({
    where: { id: d.standardId },
    select: { id: true, code: true },
  });
  if (!standard) return { error: "Norma inválida" };

  const cert = await prisma.certification.create({
    data: {
      clientId: client.id,
      standardId: standard.id,
      certifyingBody: d.certifyingBody ?? null,
      certificateNo: d.certificateNo ?? null,
      scope: d.scope ?? null,
      issuedAt: new Date(d.issuedAt),
      expiresAt: new Date(d.expiresAt),
      surveillanceIntervalMonths: d.surveillanceIntervalMonths,
      status: d.status,
      notes: d.notes ?? null,
    },
  });

  await logActivity(ctx, {
    action: "CERT_RECORDED",
    entityType: "certification",
    entityId: cert.id,
    clientId: client.id,
    summary: `Registrou certificação ${standard.code} de ${client.name}`,
  });

  revalidatePath("/manutencao");
  revalidatePath(`/clientes/${client.id}`);
  redirect("/manutencao");
}

export async function updateCertification(
  id: string,
  _prev: CertFormState,
  formData: FormData
): Promise<CertFormState> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients"))
    return { error: "Você não tem permissão para esta ação." };

  const owned = await loadOwnedCert(id, ctx);
  if (!owned) return { error: "Certificação não encontrada" };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  // A norma e o cliente do registro não mudam aqui (evita re-escopo); só os dados.
  await prisma.certification.update({
    where: { id },
    data: {
      certifyingBody: d.certifyingBody ?? null,
      certificateNo: d.certificateNo ?? null,
      scope: d.scope ?? null,
      issuedAt: new Date(d.issuedAt),
      expiresAt: new Date(d.expiresAt),
      surveillanceIntervalMonths: d.surveillanceIntervalMonths,
      status: d.status,
      notes: d.notes ?? null,
    },
  });

  revalidatePath("/manutencao");
  revalidatePath(`/clientes/${owned.clientId}`);
  redirect("/manutencao");
}

export async function deleteCertification(id: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients")) return;
  const owned = await loadOwnedCert(id, ctx);
  if (!owned) return;

  await prisma.certification.delete({ where: { id } });
  revalidatePath("/manutencao");
  revalidatePath(`/clientes/${owned.clientId}`);
  redirect("/manutencao");
}

// Registra a realização de uma auditoria de manutenção (vigilância): carimba a data
// e avança o ciclo (a próxima vigilância é recalculada a partir desta).
export async function registerSurveillance(id: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients")) return;
  const owned = await loadOwnedCert(id, ctx);
  if (!owned) return;

  await prisma.certification.update({
    where: { id },
    data: { lastSurveillanceAt: new Date() },
  });

  await logActivity(ctx, {
    action: "SURVEILLANCE_DONE",
    entityType: "certification",
    entityId: id,
    clientId: owned.clientId,
    summary: `Registrou auditoria de manutenção ${owned.standard.code} de ${owned.client.name}`,
  });

  revalidatePath("/manutencao");
  revalidatePath(`/clientes/${owned.clientId}`);
}
