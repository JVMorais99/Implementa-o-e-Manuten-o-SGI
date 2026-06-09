"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import { ORG_ROLES, ORG_ROLE_LABELS, type OrgRole } from "@/lib/enums";
import { createToken } from "@/lib/tokens";
import { sendMail, emailLayout } from "@/lib/mailer";
import { appUrl, emailEnabled } from "@/lib/features";
import { logActivity } from "@/lib/activity";

// `link` é preenchido quando o e-mail está desligado: o admin copia e repassa
// o link de convite manualmente.
export type MemberFormState =
  | { error?: string; ok?: string; link?: string }
  | undefined;

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(ORG_ROLES),
  clientIds: z.array(z.string().min(1)).default([]),
});

// Valida que todos os clientes informados pertencem à organização. Retorna a lista
// deduplicada ou uma mensagem de erro.
async function validateClientIds(
  orgId: string,
  role: string,
  rawIds: string[]
): Promise<{ ids: string[] } | { error: string }> {
  // ADMIN vê todos os clientes da organização; não precisa de vínculos.
  if (role === "ADMIN") return { ids: [] };

  const ids = [...new Set(rawIds.filter(Boolean))];
  if (ids.length === 0) {
    return { error: "Selecione ao menos um cliente para este usuário." };
  }
  const count = await prisma.client.count({
    where: { id: { in: ids }, organizationId: orgId },
  });
  if (count !== ids.length) return { error: "Cliente inválido." };
  return { ids };
}

// Convida (cria) um usuário e o vincula à organização do ADMIN com um papel e o
// conjunto de clientes que ele poderá enxergar.
export async function inviteMember(
  _prev: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) {
    return { error: "Você não tem permissão para gerenciar membros." };
  }

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    clientIds: formData.getAll("clientIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const validated = await validateClientIds(ctx.orgId, data.role, data.clientIds);
  if ("error" in validated) return { error: validated.error };

  // Um usuário com este e-mail pode já existir mesmo após ter sido "removido":
  // `removeMember` apaga apenas o Membership, preservando a conta (que pode ser
  // autora de comentários/criadora de clientes). Por isso, em vez de bloquear pelo
  // e-mail único, reanexamos uma conta existente que NÃO seja membro desta org.
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    include: { memberships: { where: { organizationId: ctx.orgId } } },
  });
  if (existing && existing.memberships.length > 0) {
    return { error: "Este usuário já é membro da organização." };
  }

  if (existing) {
    // Reanexa a conta órfã à organização (novo papel + clientes), sem recriar o User.
    await prisma.membership.create({
      data: {
        userId: existing.id,
        organizationId: ctx.orgId,
        role: data.role,
        clients: { create: validated.ids.map((clientId) => ({ clientId })) },
      },
    });
  } else {
    // Cria o usuário sem senha utilizável: ele a definirá ao aceitar o convite.
    // O hash aleatório garante que não há login até o aceite.
    const placeholderHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: placeholderHash,
        role: data.role === "CLIENTE" ? "CLIENTE" : "CONSULTOR",
        memberships: {
          create: {
            organizationId: ctx.orgId,
            role: data.role,
            clients: { create: validated.ids.map((clientId) => ({ clientId })) },
          },
        },
      },
    });
  }

  // Gera o convite (token INVITE) e envia o link por e-mail; sem e-mail
  // configurado, devolvemos o link para o admin compartilhar manualmente.
  const token = await createToken(data.email, "INVITE");
  const link = `${appUrl()}/aceitar-convite?token=${token}`;

  await logActivity(ctx, {
    action: "MEMBER_INVITED",
    entityType: "member",
    entityId: data.email,
    summary: `Convidou ${data.name} como ${ORG_ROLE_LABELS[data.role as OrgRole]}`,
  });

  revalidatePath("/equipe");

  if (!emailEnabled()) {
    return {
      ok: `Usuário ${data.email} adicionado. E-mail não configurado — compartilhe o link de convite:`,
      link,
    };
  }

  const sent = await sendMail({
    to: data.email,
    subject: "Você foi convidado para o ISO Manager",
    html: emailLayout({
      title: `Olá, ${data.name}!`,
      intro:
        "Você foi convidado a participar de uma organização no ISO Manager. Clique abaixo para definir sua senha e acessar.",
      buttonLabel: "Aceitar convite",
      buttonUrl: link,
      footer: "O convite expira em 72 horas.",
    }),
  });

  if (!sent.delivered) {
    return {
      ok: `Usuário ${data.email} adicionado, mas o envio do e-mail falhou. Compartilhe o link manualmente:`,
      link,
    };
  }
  return { ok: `Convite enviado para ${data.email}.` };
}

// Redefine os clientes vinculados a um membro (escopo de dados). Não se aplica ao
// ADMIN, que enxerga todos os clientes da organização.
export async function setMemberClients(
  membershipId: string,
  _prev: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) {
    return { error: "Você não tem permissão para gerenciar membros." };
  }

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.orgId },
  });
  if (!membership) return { error: "Membro não encontrado." };
  if (membership.role === "ADMIN") {
    return { error: "Administradores enxergam todos os clientes da organização." };
  }

  const validated = await validateClientIds(
    ctx.orgId,
    membership.role,
    formData.getAll("clientIds") as string[]
  );
  if ("error" in validated) return { error: validated.error };

  // Substitui o conjunto de vínculos de forma atômica.
  await prisma.$transaction([
    prisma.membershipClient.deleteMany({ where: { membershipId } }),
    prisma.membershipClient.createMany({
      data: validated.ids.map((clientId) => ({ membershipId, clientId })),
    }),
  ]);

  revalidatePath("/equipe");
  return { ok: "Clientes vinculados atualizados." };
}

// Altera o papel de um membro (não permite alterar o próprio papel).
export async function updateMemberRole(
  membershipId: string,
  role: string
): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) return;
  if (!ORG_ROLES.includes(role as (typeof ORG_ROLES)[number])) return;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.orgId },
    include: { user: { select: { name: true } } },
  });
  if (!membership || membership.userId === ctx.user.id) return; // não altera a si mesmo
  // CLIENTE depende de clientes vinculados; só trocamos entre papéis internos aqui.
  if (role === "CLIENTE") return;

  await prisma.membership.update({
    where: { id: membershipId },
    data: { role },
  });

  await logActivity(ctx, {
    action: "MEMBER_ROLE",
    entityType: "member",
    entityId: membership.userId,
    summary: `Alterou o papel de ${membership.user.name} para ${ORG_ROLE_LABELS[role as OrgRole]}`,
  });

  revalidatePath("/equipe");
}

// Remove um membro da organização (mantém o usuário, mas sem acesso).
export async function removeMember(membershipId: string): Promise<void> {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) return;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.orgId },
    include: { user: { select: { name: true } } },
  });
  if (!membership || membership.userId === ctx.user.id) return; // não remove a si mesmo

  // Os clientes/projetos sob responsabilidade dele ficam sem responsável (SetNull).
  await prisma.membership.delete({ where: { id: membershipId } });

  await logActivity(ctx, {
    action: "MEMBER_REMOVED",
    entityType: "member",
    entityId: membership.userId,
    summary: `Removeu ${membership.user.name} da organização`,
  });

  revalidatePath("/equipe");
}
