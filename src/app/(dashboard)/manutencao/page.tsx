import Link from "next/link";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/session";
import { can, isPortalRole } from "@/lib/permissions";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DeleteButton } from "@/components/ui/DeleteButton";
import {
  listCertifications,
  getMaintenanceReminders,
  type CertificationRow,
} from "@/lib/certifications";
import {
  CERTIFICATION_STATUS_LABELS,
  CERTIFICATION_STATUS_COLORS,
} from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { deleteCertification, registerSurveillance } from "./actions";

// Mostra uma data com urgência: vermelho se vencida, âmbar se dentro de ~4 meses.
function DueDate({ date, days }: { date: Date; days: number }) {
  const cls =
    days < 0 ? "text-rose-600 font-semibold" : days <= 120 ? "text-amber-600 font-medium" : "text-gray-500";
  const suffix =
    days < 0 ? ` (venceu há ${Math.abs(days)}d)` : days <= 120 ? ` (em ${days}d)` : "";
  return (
    <span className={`whitespace-nowrap ${cls}`}>
      {formatDate(date)}
      {suffix}
    </span>
  );
}

export default async function ManutencaoPage() {
  const ctx = await getContext();
  if (isPortalRole(ctx.role)) redirect("/projetos");
  const canManage = can(ctx.role, "manage_clients");

  const [certs, reminders] = await Promise.all([
    listCertifications(ctx),
    getMaintenanceReminders(ctx),
  ]);

  const now = new Date();
  const active = certs.filter((c) => c.displayStatus === "ATIVA").length;
  const expired = certs.filter((c) => c.expiresAt < now).length;

  return (
    <div>
      <PageHeader
        title="Manutenção & recertificação"
        subtitle="Certificações dos clientes, ciclos de auditoria de manutenção e lembretes de recertificação."
        breadcrumb={[{ label: "Manutenção" }]}
        action={
          canManage ? (
            <ButtonLink href="/manutencao/nova">+ Nova certificação</ButtonLink>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Certificações" value={certs.length} hint="No seu escopo" />
        <StatCard label="Ativas" value={active} hint="Vigentes" />
        <StatCard label="Vencidas" value={expired} hint={expired > 0 ? "Recertificar" : "Em dia"} />
        <StatCard label="Lembretes" value={reminders.length} hint="Recert. / vigilância" />
      </div>

      {reminders.length > 0 && (
        <TableCard
          title="Lembretes de manutenção"
          subtitle="Recertificações e auditorias de vigilância próximas ou em atraso"
          className="mb-6"
        >
          <ul className="divide-y divide-gray-50">
            {reminders.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <Link href={r.href} className="flex items-start gap-3 hover:opacity-80">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      r.severity === "high"
                        ? "bg-red-500"
                        : r.severity === "medium"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-800">{r.title}</span>
                    <span className="block text-sm text-gray-500">{r.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </TableCard>
      )}

      {certs.length === 0 ? (
        <EmptyState
          title="Nenhuma certificação registrada"
          description="Cadastre as certificações ISO dos seus clientes para acompanhar validade, ciclos de vigilância e recertificação."
          action={
            canManage ? (
              <ButtonLink href="/manutencao/nova">Registrar certificação</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <TableCard title="Certificações">
          <Table>
            <THead>
              <Th>Cliente / Norma</Th>
              <Th>Organismo</Th>
              <Th>Emissão</Th>
              <Th>Validade</Th>
              <Th>Próx. vigilância</Th>
              <Th>Status</Th>
              {canManage && <Th align="right">Ações</Th>}
            </THead>
            <tbody>
              {certs.map((c: CertificationRow) => (
                <Tr key={c.id}>
                  <Td className="py-3">
                    <Link
                      href={`/clientes/${c.clientId}`}
                      className="font-semibold text-gray-800 hover:text-brand-600"
                    >
                      {c.clientName}
                    </Link>
                    <span className="block text-xs text-gray-400">{c.standardCode}</span>
                  </Td>
                  <Td className="text-gray-500">{c.certifyingBody || "—"}</Td>
                  <Td className="whitespace-nowrap text-gray-500">{formatDate(c.issuedAt)}</Td>
                  <Td>
                    <DueDate date={c.expiresAt} days={c.daysToExpiry} />
                  </Td>
                  <Td>
                    {c.nextSurveillance && c.daysToSurveillance != null ? (
                      <DueDate date={c.nextSurveillance} days={c.daysToSurveillance} />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CERTIFICATION_STATUS_COLORS[c.displayStatus]}`}
                    >
                      {CERTIFICATION_STATUS_LABELS[c.displayStatus]}
                    </span>
                  </Td>
                  {canManage && (
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        {c.surveillanceIntervalMonths > 0 && (
                          <form action={registerSurveillance.bind(null, c.id)}>
                            <button
                              type="submit"
                              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                              title="Registrar auditoria de manutenção realizada hoje"
                            >
                              ✓ Vigilância
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/manutencao/${c.id}/editar`}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          action={deleteCertification.bind(null, c.id)}
                          label="Excluir"
                          confirmMessage={`Excluir a certificação ${c.standardCode} de ${c.clientName}?`}
                        />
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
