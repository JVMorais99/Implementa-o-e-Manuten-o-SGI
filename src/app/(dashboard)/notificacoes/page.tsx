import Link from "next/link";
import { getContext } from "@/lib/session";
import { getNotifications, type NotificationSeverity } from "@/lib/notifications";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import { markAllReadAction, markOneReadAction } from "./actions";

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
};

export default async function NotificacoesPage() {
  const ctx = await getContext();
  const notifications = await getNotifications(ctx);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle={
          unread > 0
            ? `${unread} não ${unread === 1 ? "lida" : "lidas"} · pendências com prazo estourado ou etapas paradas`
            : "Pendências com prazo estourado ou etapas paradas"
        }
        action={
          unread > 0 ? (
            <form action={markAllReadAction}>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Marcar todas como lidas
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Tudo em dia"
          description="Nenhuma pendência no momento. Planos de ação, documentos enviados, constatações de auditoria e certificações estão em ordem."
        />
      ) : (
        <TableCard>
          <Table>
            <THead>
              <Th>Notificação</Th>
              <Th align="right">Data</Th>
              <Th></Th>
            </THead>
            <tbody>
              {notifications.map((n) => (
                <Tr key={n.id} className={n.read ? "opacity-55" : undefined}>
                  <Td className="py-3">
                    <Link href={n.href} className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.read ? "bg-gray-300" : SEVERITY_DOT[n.severity]
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-sm ${n.read ? "font-medium text-gray-600" : "font-semibold text-gray-800"}`}
                        >
                          {n.title}
                        </span>
                        <span className="block text-sm text-gray-500 line-clamp-2">
                          {n.description}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td align="right" className="whitespace-nowrap align-top text-gray-400">
                    {n.date ? formatDate(n.date) : "—"}
                  </Td>
                  <Td align="right" className="align-top">
                    {!n.read && (
                      <form action={markOneReadAction.bind(null, n.id)}>
                        <button
                          type="submit"
                          title="Marcar como lida"
                          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
                        >
                          ✓
                        </button>
                      </form>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
