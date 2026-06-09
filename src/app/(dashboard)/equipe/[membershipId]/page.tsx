import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, type AccessContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard, ProgressBar } from "@/components/ui/StatCard";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { computeConsultantMetrics } from "@/lib/team";
import { getRecentActivity } from "@/lib/activity";
import { getNotifications } from "@/lib/notifications";
import { projectProgress } from "@/lib/progress";
import { ORG_ROLE_LABELS, ORG_ROLE_COLORS, type OrgRole } from "@/lib/enums";

export default async function ConsultorDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const ctx = await getContext();
  if (!can(ctx.role, "manage_members") || !ctx.orgId) redirect("/dashboard");

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!membership) notFound();
  const role = membership.role as OrgRole;

  const clients = await prisma.client.findMany({
    where: { organizationId: ctx.orgId, responsibleMembershipId: membershipId },
    orderBy: { name: "asc" },
    include: {
      projects: {
        select: { id: true, requirements: { select: { status: true } } },
      },
    },
  });
  const clientIds = clients.map((c) => c.id);

  // Pendências escopadas aos clientes do consultor: reaproveita o motor de
  // notificações com um contexto sintético restrito a esses clientes.
  const scopedCtx: AccessContext = {
    user: ctx.user,
    orgId: ctx.orgId,
    role,
    clientIds,
  };

  const [metrics, notifications, activity] = await Promise.all([
    computeConsultantMetrics(clientIds),
    getNotifications(scopedCtx),
    getRecentActivity(ctx, { actorId: membership.user.id, limit: 20 }),
  ]);

  return (
    <div>
      <PageHeader
        title={membership.user.name}
        subtitle={membership.user.email}
        breadcrumb={[
          { label: "Equipe", href: "/equipe" },
          { label: membership.user.name },
        ]}
        action={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORG_ROLE_COLORS[role]}`}
          >
            {ORG_ROLE_LABELS[role]}
          </span>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Clientes" value={metrics.clients} />
        <StatCard label="Projetos ativos" value={metrics.activeProjects} />
        <StatCard label="Progresso médio" value={`${metrics.avgProgress}%`} />
        <StatCard label="Req. pendentes" value={metrics.pendingReqs} />
        <StatCard
          label="Ações vencidas"
          value={metrics.overdueActions}
          hint={metrics.overdueActions > 0 ? "Requer atenção" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {clients.length === 0 ? (
            <Card>
              <h3 className="mb-2 text-base font-semibold text-gray-800">Clientes</h3>
              <p className="text-sm text-amber-600">
                Nenhum cliente sob responsabilidade. Atribua um cliente a este consultor
                em <Link href="/clientes" className="underline">Clientes</Link>.
              </p>
            </Card>
          ) : (
            <TableCard title={`Clientes responsáveis (${clients.length})`}>
              <Table>
                <THead>
                  <Th>Cliente</Th>
                  <Th align="center">Projetos</Th>
                  <Th>Progresso médio</Th>
                </THead>
                <tbody>
                  {clients.map((c) => {
                    const progresses = c.projects.map((p) =>
                      projectProgress(p.requirements)
                    );
                    const avg =
                      progresses.length === 0
                        ? 0
                        : Math.round(
                            progresses.reduce((s, v) => s + v, 0) / progresses.length
                          );
                    return (
                      <Tr key={c.id}>
                        <Td className="py-3">
                          <Link
                            href={`/clientes/${c.id}`}
                            className="font-semibold text-gray-800 hover:text-brand-600"
                          >
                            {c.name}
                          </Link>
                        </Td>
                        <Td align="center">{c.projects.length}</Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <ProgressBar percent={avg} className="w-20" />
                            <span className="text-xs font-semibold text-gray-600">
                              {avg}%
                            </span>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableCard>
          )}

          <TableCard
            title={`Pendências (${notifications.length})`}
            subtitle="Itens vencidos ou parados nos clientes deste consultor"
          >
            {notifications.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-gray-400">
                Nenhuma pendência. 🎉
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.slice(0, 12).map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <Link href={n.href} className="block hover:opacity-80">
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TableCard>
        </div>

        <TableCard
          title="Atividades recentes"
          subtitle="O que este consultor fez no sistema"
        >
          <ActivityFeed entries={activity} showActor={false} />
        </TableCard>
      </div>
    </div>
  );
}
