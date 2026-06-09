import Link from "next/link";
import { getContext } from "@/lib/session";
import { resolveMyScope, getMyWork, type TaskKind, type AgendaKind } from "@/lib/my-work";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { ButtonLink } from "@/components/ui/Button";
import {
  RequirementStatusBadge,
  ActionPlanStatusBadge,
  DocumentStatusBadge,
} from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Meu trabalho" };

const KIND_LABEL: Record<TaskKind, string> = {
  REQ: "Requisito",
  ACTION: "Ação",
  DOC: "Documento",
};
const KIND_CHIP: Record<TaskKind, string> = {
  REQ: "bg-brand-50 text-brand-700",
  ACTION: "bg-amber-50 text-amber-700",
  DOC: "bg-indigo-50 text-indigo-700",
};

const AGENDA_DOT: Record<AgendaKind, string> = {
  ACTION: "bg-amber-500",
  REQ: "bg-brand-500",
  PROJECT: "bg-emerald-500",
  AUDIT: "bg-indigo-500",
  FINDING: "bg-rose-500",
  CERT: "bg-teal-500",
};

export default async function MeuTrabalhoPage() {
  const ctx = await getContext();
  const scope = await resolveMyScope(ctx);
  const { tasks, agenda, counts } = await getMyWork(scope.clientIds);

  const firstName = ctx.user.name?.trim().split(/\s+/)[0] ?? "você";

  return (
    <div>
      <PageHeader
        title="Meu trabalho"
        subtitle={
          scope.ownsClients
            ? "Tudo que precisa da sua mão nos clientes sob sua responsabilidade."
            : "Tarefas e prazos dos clientes que você acompanha."
        }
        action={<ButtonLink href="/notificacoes" variant="secondary">Ver notificações</ButtonLink>}
      />

      {!scope.ownsClients && scope.clientIds.length > 0 && (
        <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          Você ainda não é o consultor responsável por nenhum cliente — mostrando os
          clientes que você acompanha. Peça ao administrador para atribuir a
          responsabilidade em <Link href="/clientes" className="underline">Clientes</Link>.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tarefas abertas" value={counts.open} hint="Aguardando você" />
        <StatCard
          label="Vencidas"
          value={counts.overdue}
          hint={counts.overdue > 0 ? "Requer atenção" : "Em dia"}
        />
        <StatCard label="Prazos em 7 dias" value={counts.dueThisWeek} hint="Na sua agenda" />
        <StatCard label="Clientes" value={counts.clients} hint="No seu escopo" />
      </div>

      {scope.clientIds.length === 0 ? (
        <EmptyState
          title="Nenhum cliente no seu escopo"
          description="Quando o administrador atribuir um cliente à sua responsabilidade, as tarefas e prazos aparecerão aqui."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Fila de tarefas */}
          <div className="lg:col-span-2">
            <TableCard
              title="Fila de tarefas"
              subtitle={`${tasks.length} ${tasks.length === 1 ? "item aguardando" : "itens aguardando"} ação`}
            >
              {tasks.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400">
                  Nada pendente. Bom trabalho, {firstName}! 🎉
                </p>
              ) : (
                <Table>
                  <THead>
                    <Th>Tarefa</Th>
                    <Th>Cliente</Th>
                    <Th>Situação</Th>
                    <Th align="right">Prazo</Th>
                  </THead>
                  <tbody>
                    {tasks.map((t) => (
                      <Tr key={t.id}>
                        <Td className="max-w-md">
                          <Link href={t.href} className="block hover:text-brand-600">
                            <span className="flex items-center gap-2">
                              <span
                                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${KIND_CHIP[t.kind]}`}
                              >
                                {KIND_LABEL[t.kind]}
                              </span>
                              <span className="truncate font-medium text-gray-800">
                                {t.title}
                              </span>
                            </span>
                          </Link>
                        </Td>
                        <Td className="text-gray-500">{t.client}</Td>
                        <Td>
                          {t.kind === "REQ" && <RequirementStatusBadge status={t.status} />}
                          {t.kind === "ACTION" && <ActionPlanStatusBadge status={t.status} />}
                          {t.kind === "DOC" && <DocumentStatusBadge status={t.status} />}
                        </Td>
                        <Td align="right">
                          {t.dueDate ? (
                            <span
                              className={
                                t.overdue ? "font-semibold text-rose-600" : "text-gray-500"
                              }
                            >
                              {formatDate(t.dueDate)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </TableCard>
          </div>

          {/* Agenda */}
          <TableCard title="Agenda" subtitle="Prazos por proximidade">
            {agenda.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">
                Nenhum prazo registrado.
              </p>
            ) : (
              <div className="space-y-5 px-5 py-4">
                {agenda.map((bucket) => (
                  <div key={bucket.key}>
                    <p
                      className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${
                        bucket.key === "overdue" ? "text-rose-600" : "text-gray-400"
                      }`}
                    >
                      {bucket.label} · {bucket.items.length}
                    </p>
                    <ul className="space-y-2.5">
                      {bucket.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className="flex items-start gap-2.5 hover:opacity-80"
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${AGENDA_DOT[item.kind]}`}
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-800">
                                {item.title}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                {formatDate(item.date)} · {item.subtitle}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </TableCard>
        </div>
      )}
    </div>
  );
}
