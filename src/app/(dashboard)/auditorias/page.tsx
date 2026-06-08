import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can, isPortalRole } from "@/lib/permissions";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import {
  AUDIT_TYPE_LABELS,
  AUDIT_TYPE_COLORS,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_COLORS,
  type AuditType,
  type AuditStatus,
} from "@/lib/enums";

export default async function AuditoriasPage() {
  const ctx = await getContext();
  if (isPortalRole(ctx.role)) redirect("/projetos");
  const canAudits = can(ctx.role, "manage_audits");

  const audits = await prisma.audit.findMany({
    where: { project: { client: clientWhere(ctx) } },
    orderBy: [{ status: "asc" }, { plannedDate: "desc" }, { createdAt: "desc" }],
    include: {
      project: {
        include: {
          client: { select: { name: true } },
          standards: { include: { standard: { select: { code: true } } } },
        },
      },
      _count: { select: { items: true, findings: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Auditorias"
        breadcrumb={[{ label: "Auditorias" }]}
        action={
          canAudits ? (
            <ButtonLink href="/auditorias/nova">Nova auditoria</ButtonLink>
          ) : undefined
        }
      />

      {audits.length === 0 ? (
        <EmptyState
          title="Nenhuma auditoria ainda"
          description="Planeje auditorias internas (preparação) ou registre auditorias externas (certificação) sobre os projetos dos seus clientes."
          action={
            canAudits ? (
              <ButtonLink href="/auditorias/nova">Nova auditoria</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <TableCard>
          <Table>
            <THead>
              <Th>Auditoria</Th>
              <Th>Cliente</Th>
              <Th>Normas</Th>
              <Th>Tipo</Th>
              <Th>Status</Th>
              <Th align="center">Itens</Th>
              <Th align="center">Constatações</Th>
              <Th>Data</Th>
            </THead>
            <tbody>
              {audits.map((a) => {
                const norms = a.project.standards
                  .map((s) => s.standard.code)
                  .join(", ");
                return (
                  <Tr key={a.id}>
                    <Td className="max-w-xs">
                      <Link
                        href={`/auditorias/${a.id}`}
                        className="block truncate font-semibold text-gray-800"
                      >
                        {a.title}
                      </Link>
                    </Td>
                    <Td>{a.project.client.name}</Td>
                    <Td>{norms || "—"}</Td>
                    <Td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          AUDIT_TYPE_COLORS[a.type as AuditType] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {AUDIT_TYPE_LABELS[a.type as AuditType] ?? a.type}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          AUDIT_STATUS_COLORS[a.status as AuditStatus] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {AUDIT_STATUS_LABELS[a.status as AuditStatus] ?? a.status}
                      </span>
                    </Td>
                    <Td align="center">{a._count.items}</Td>
                    <Td align="center">{a._count.findings}</Td>
                    <Td className="whitespace-nowrap text-gray-400">
                      {formatDate(a.plannedDate ?? a.createdAt)}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
