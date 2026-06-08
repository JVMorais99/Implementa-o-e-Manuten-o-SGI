import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getContext } from "@/lib/session";
import { getNotificationCount } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { emailEnabled } from "@/lib/features";
import { ORG_ROLE_LABELS } from "@/lib/enums";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getContext();
  const notificationCount = await getNotificationCount(ctx);

  // Banner discreto de verificação de e-mail (só quando o e-mail está ativo).
  let needsVerification = false;
  if (emailEnabled()) {
    const me = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { emailVerified: true },
    });
    needsVerification = me ? me.emailVerified === null : false;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fb]">
      <Sidebar role={ctx.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={ctx.user.name ?? "Usuário"}
          userEmail={ctx.user.email}
          roleLabel={ORG_ROLE_LABELS[ctx.role]}
          notificationCount={notificationCount}
        />
        {needsVerification && (
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-2 text-sm text-amber-800">
            Seu e-mail ainda não foi verificado. Confira sua caixa de entrada para
            confirmar o acesso.
          </div>
        )}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
