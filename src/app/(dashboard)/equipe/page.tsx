import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TableCard, Table, THead, Th, Tr, Td, AvatarCell } from "@/components/ui/Table";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { AuditActionButton } from "@/components/audit/AuditActionButton";
import { InviteMemberForm } from "@/components/team/InviteMemberForm";
import { MemberClientsEditor } from "@/components/team/MemberClientsEditor";
import { formatDate } from "@/lib/utils";
import { listTeamOverview } from "@/lib/team";
import {
  ORG_ROLE_LABELS,
  ORG_ROLE_COLORS,
  TEAM_ROLES,
  type OrgRole,
} from "@/lib/enums";
import {
  inviteMember,
  updateMemberRole,
  removeMember,
  setMemberClients,
} from "./actions";

export default async function EquipePage() {
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) redirect("/dashboard");

  const [members, clients, overview] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        clients: { include: { client: { select: { id: true, name: true } } } },
      },
    }),
    prisma.client.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listTeamOverview(ctx.orgId),
  ]);

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle="Carga, desempenho e gestão dos consultores"
        breadcrumb={[{ label: "Equipe" }]}
      />

      <div className="mb-6">
        <TableCard
          title="Visão-geral da equipe"
          subtitle="Métricas por consultor sobre os clientes que lhe são atribuídos"
        >
          <Table>
            <THead>
              <Th>Consultor</Th>
              <Th>Papel</Th>
              <Th align="center">Clientes</Th>
              <Th align="center">Projetos ativos</Th>
              <Th align="center">Progresso médio</Th>
              <Th align="center">Req. pendentes</Th>
              <Th align="center">Ações vencidas</Th>
              <Th>Última atividade</Th>
            </THead>
            <tbody>
              {overview.map((row) => (
                <Tr key={row.membershipId}>
                  <Td className="py-3">
                    <Link href={`/equipe/${row.membershipId}`} className="inline-block">
                      <AvatarCell name={row.name} secondary={row.email} />
                    </Link>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORG_ROLE_COLORS[row.role]}`}
                    >
                      {ORG_ROLE_LABELS[row.role]}
                    </span>
                  </Td>
                  <Td align="center" className="font-semibold text-gray-700">
                    {row.metrics.clients}
                  </Td>
                  <Td align="center">{row.metrics.activeProjects}</Td>
                  <Td align="center">{row.metrics.avgProgress}%</Td>
                  <Td align="center">{row.metrics.pendingReqs}</Td>
                  <Td align="center">
                    {row.metrics.overdueActions > 0 ? (
                      <span className="font-semibold text-red-600">
                        {row.metrics.overdueActions}
                      </span>
                    ) : (
                      "0"
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-gray-400">
                    {row.lastActivityAt ? formatDate(row.lastActivityAt) : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableCard title={`Membros (${members.length})`}>
            <Table>
              <THead>
                <Th>Membro</Th>
                <Th>Papel</Th>
                <Th>Clientes</Th>
                <Th align="right">Ações</Th>
              </THead>
              <tbody>
                {members.map((m) => {
                  const isSelf = m.userId === ctx.user.id;
                  const role = m.role as OrgRole;
                  const linkedClients = m.clients.map((mc) => mc.client);
                  const responsibleCount =
                    overview.find((o) => o.membershipId === m.id)?.metrics.clients ?? 0;
                  const removeMessage =
                    responsibleCount > 0
                      ? `Remover ${m.user.name} da organização? ${responsibleCount} cliente(s) ficarão sem responsável — reatribua depois.`
                      : `Remover ${m.user.name} da organização?`;
                  return (
                    <Tr key={m.id}>
                      <Td className="py-3 align-top">
                        <p className="text-sm font-semibold text-gray-800">
                          {m.user.name}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-gray-400">(você)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {m.user.email} · desde {formatDate(m.createdAt)}
                        </p>
                      </Td>
                      <Td className="align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORG_ROLE_COLORS[role]}`}
                        >
                          {ORG_ROLE_LABELS[role]}
                        </span>
                      </Td>
                      <Td className="align-top">
                        {role === "ADMIN" ? (
                          <p className="text-xs text-gray-400">Todos os clientes da organização.</p>
                        ) : (
                          <>
                            <p className="text-xs text-gray-500">
                              {linkedClients.length
                                ? linkedClients.map((c) => c.name).join(", ")
                                : "nenhum (sem acesso a dados)"}
                            </p>
                            {!isSelf && (
                              <div className="mt-1.5">
                                <MemberClientsEditor
                                  action={setMemberClients.bind(null, m.id)}
                                  clients={clients}
                                  selectedIds={linkedClients.map((c) => c.id)}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </Td>
                      <Td align="right" className="align-top">
                        {!isSelf && (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {role !== "CLIENTE" &&
                              TEAM_ROLES.filter((r) => r !== role).map((r) => (
                                <AuditActionButton
                                  key={r}
                                  action={updateMemberRole.bind(null, m.id, r)}
                                  label={ORG_ROLE_LABELS[r as OrgRole]}
                                  size="sm"
                                  variant="ghost"
                                />
                              ))}
                            <DeleteButton
                              action={removeMember.bind(null, m.id)}
                              label="Remover"
                              confirmMessage={removeMessage}
                            />
                          </div>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableCard>
        </div>

        <div>
          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Adicionar membro
            </h3>
            <InviteMemberForm action={inviteMember} clients={clients} />
          </Card>
        </div>
      </div>
    </div>
  );
}
