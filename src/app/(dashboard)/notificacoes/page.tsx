import Link from "next/link";
import { getContext } from "@/lib/session";
import { getNotifications, type NotificationSeverity } from "@/lib/notifications";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
};

export default async function NotificacoesPage() {
  const ctx = await getContext();
  const notifications = await getNotifications(ctx);

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle="Pendências com prazo estourado ou etapas paradas"
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Tudo em dia"
          description="Nenhuma pendência vencida no momento. Planos de ação, documentos enviados e constatações de auditoria estão em ordem."
        />
      ) : (
        <TableCard>
          <Table>
            <THead>
              <Th>Notificação</Th>
              <Th align="right">Data</Th>
            </THead>
            <tbody>
              {notifications.map((n) => (
                <Tr key={n.id}>
                  <Td className="py-3">
                    <Link href={n.href} className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[n.severity]}`}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-800">{n.title}</span>
                        <span className="block text-sm text-gray-500 line-clamp-2">{n.description}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td align="right" className="whitespace-nowrap align-top text-gray-400">
                    {n.date ? formatDate(n.date) : "—"}
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
