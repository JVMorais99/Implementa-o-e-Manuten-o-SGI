"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import {
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/notifications";

// Marca todas as notificações atuais do usuário como lidas (zera o sino).
export async function markAllReadAction(): Promise<void> {
  const ctx = await getContext();
  await markAllNotificationsRead(ctx);
  revalidatePath("/notificacoes");
  revalidatePath("/dashboard");
}

// Marca uma notificação específica (por chave) como lida.
export async function markOneReadAction(key: string): Promise<void> {
  const ctx = await getContext();
  await markNotificationsRead(ctx.user.id, [key]);
  revalidatePath("/notificacoes");
  revalidatePath("/dashboard");
}
