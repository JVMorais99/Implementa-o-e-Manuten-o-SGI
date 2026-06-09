import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import { sendDigest } from "@/lib/digest";
import { emailEnabled } from "@/lib/features";

// Cron diário (Vercel) de avisos proativos: para cada usuário com pendências NÃO
// lidas, envia um digest por e-mail. Agendado em vercel.json. Idempotente no dia
// (lastDigestAt evita reenvio se o cron disparar mais de uma vez).
//
// Segurança: a Vercel injeta `Authorization: Bearer <CRON_SECRET>` quando a env var
// CRON_SECRET está definida. Exigimos esse header sempre que o segredo existir.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isToday(d: Date | null): boolean {
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  if (!emailEnabled()) {
    return NextResponse.json({ ok: true, sent: 0, reason: "email-disabled" });
  }

  // Usuários internos (não-portal) que têm vínculo ativo a uma organização.
  const memberships = await prisma.membership.findMany({
    where: { role: { not: "CLIENTE" } },
    distinct: ["userId"],
    orderBy: { createdAt: "asc" },
    select: { user: { select: { id: true, name: true, email: true, lastDigestAt: true } } },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { user } of memberships) {
    if (!user.email) {
      skipped++;
      continue;
    }
    if (isToday(user.lastDigestAt)) {
      skipped++;
      continue; // já recebeu hoje
    }

    const ctx = await buildUserContext(user);
    const notifications = await getNotifications(ctx);
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) {
      skipped++;
      continue;
    }

    const result = await sendDigest(user, unread);
    if (result.delivered) {
      sent++;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastDigestAt: new Date() },
      });
    } else {
      if (result.error) errors.push(`${user.email}: ${result.error}`);
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors: errors.slice(0, 5) });
}
