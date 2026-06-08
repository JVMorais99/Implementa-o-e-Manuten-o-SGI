"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createToken, consumeToken } from "@/lib/tokens";
import { sendMail, emailLayout } from "@/lib/mailer";
import { appUrl, emailEnabled } from "@/lib/features";

// Estado compartilhado dos formulários de auth. `link` é preenchido quando o
// e-mail está desligado, para exibirmos o endereço diretamente na tela.
export type AuthFormState =
  | { error?: string; ok?: string; link?: string }
  | undefined;

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export async function loginAction(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Dados inválidos";
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "E-mail ou senha incorretos.";
    }
    throw error; // repassa o redirect (NEXT_REDIRECT)
  }
  return undefined;
}

// ----- Redefinição de senha -----

const requestResetSchema = z.object({ email: z.string().email("E-mail inválido") });

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const email = parsed.data.email;
  const user = await prisma.user.findUnique({ where: { email } });

  // Não revela se o e-mail existe (evita enumeração de contas).
  const genericOk =
    "Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.";

  if (!user) return { ok: genericOk };

  const token = await createToken(email, "RESET");
  const link = `${appUrl()}/redefinir-senha?token=${token}`;

  if (!emailEnabled()) {
    // Sem e-mail configurado: mostra o link na própria tela.
    return {
      ok: "E-mail não configurado — use o link abaixo para redefinir a senha:",
      link,
    };
  }

  await sendMail({
    to: email,
    subject: "Redefinição de senha — ISO Manager",
    html: emailLayout({
      title: "Redefinir senha",
      intro: "Recebemos um pedido para redefinir a senha da sua conta no ISO Manager.",
      buttonLabel: "Redefinir senha",
      buttonUrl: link,
      footer: "O link expira em 2 horas. Se não foi você, ignore este e-mail.",
    }),
  });
  return { ok: genericOk };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token ausente"),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não conferem",
    path: ["confirm"],
  });

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const email = await consumeToken(parsed.data.token, "RESET");
  if (!email) {
    return { error: "Link inválido ou expirado. Solicite uma nova redefinição." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, emailVerified: new Date() },
  });

  redirect("/login?reset=1");
}

// ----- Aceite de convite (membro define a própria senha) -----

const acceptInviteSchema = z
  .object({
    token: z.string().min(1, "Token ausente"),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não conferem",
    path: ["confirm"],
  });

export async function acceptInvite(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const email = await consumeToken(parsed.data.token, "INVITE");
  if (!email) {
    return { error: "Convite inválido ou expirado. Peça um novo ao administrador." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, emailVerified: new Date() },
  });

  redirect("/login?invited=1");
}
