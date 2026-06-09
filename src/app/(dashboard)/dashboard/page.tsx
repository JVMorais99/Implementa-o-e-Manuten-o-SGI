import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard, ProgressBar } from "@/components/ui/StatCard";
import { ButtonLink } from "@/components/ui/Button";
import { StatusDonut } from "@/components/dashboard/StatusDonut";
import { ActionPlanStatusBadge, ActionPlanPriorityBadge } from "@/components/ui/Badge";
import { TableCard } from "@/components/ui/Table";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { projectProgress, statusDistribution } from "@/lib/progress";
import { formatDate, initials } from "@/lib/utils";
import { recordDailySnapshot, getKpiDeltas, type KpiKey } from "@/lib/metrics";
import { getRecentActivity } from "@/lib/activity";

export default async function DashboardPage() {
  const ctx = await getContext();
  const cWhere = clientWhere(ctx);

  const [clientsCount, projects, documentsCount, openActions] = await Promise.all([
    prisma.client.count({ where: cWhere }),
    prisma.isoProject.findMany({
      where: { client: cWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { name: true } },
        standards: { include: { standard: { select: { code: true } } } },
        requirements: { select: { status: true } },
      },
    }),
    prisma.generatedDocument.count({
      where: {
        projectRequirement: { project: { client: cWhere } },
      },
    }),
    prisma.actionPlan.findMany({
      where: {
        status: { in: ["ABERTO", "EM_ANDAMENTO", "ATRASADO"] },
        projectRequirement: { project: { client: cWhere } },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: {
        projectRequirement: {
          select: {
            id: true,
            projectId: true,
            requirement: { select: { code: true, title: true } },
          },
        },
      },
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "EM_ANDAMENTO").length;
  const allReqs = projects.flatMap((p) => p.requirements);
  const dist = statusDistribution(allReqs);
  const pendentes = allReqs.filter(
    (r) => r.status === "NAO_INICIADO" || r.status === "EM_ANALISE"
  ).length;

  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((sum, p) => sum + projectProgress(p.requirements), 0) /
            projects.length
        );

  const firstName = ctx.user.name?.trim().split(/\s+/)[0] ?? "Usuário";

  const activity = await getRecentActivity(ctx, { limit: 10 });

  // Grava o snapshot do dia (histórico) e calcula os deltas mês-a-mês. As pills só
  // aparecem na visão da organização inteira (ADMIN: clientIds === null), pois o
  // snapshot é org-wide; usuários com escopo restrito veem só o hint.
  let deltas: Partial<Record<KpiKey, { label: string; direction: "up" | "down"; tone: "good" | "bad" }>> = {};
  if (ctx.orgId) {
    const orgMetrics = await recordDailySnapshot(ctx.orgId);
    if (ctx.clientIds === null) {
      deltas = await getKpiDeltas(ctx.orgId, orgMetrics);
    }
  }

  return (
    <div>
      <PageHeader
        title={`Bem-vindo, ${firstName}`}
        subtitle="Acompanhe a implantação e manutenção das certificações dos seus clientes."
        action={<ButtonLink href="/projetos/novo">+ Novo projeto</ButtonLink>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes" value={clientsCount} icon={<IconUsers />} hint="Empresas acompanhadas" delta={deltas.clients} />
        <StatCard label="Projetos ativos" value={activeProjects} unit={`/ ${projects.length}`} icon={<IconFolder />} hint="Em andamento" delta={deltas.activeProjects} />
        <StatCard label="Conclusão média" value={avgProgress} unit="%" icon={<IconChart />} hint="Média entre projetos" delta={deltas.avgProgress} />
        <StatCard label="Requisitos pendentes" value={pendentes} icon={<IconClock />} hint={`${documentsCount} documentos gerados`} delta={deltas.pendingReqs} />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Comece sua primeira implantação"
          description="Cadastre um cliente e crie um projeto ISO para gerar a trilha de requisitos."
          action={<ButtonLink href="/clientes/novo">Cadastrar cliente</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-0">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Projetos recentes</h3>
                <p className="text-xs text-gray-400">Acessados recentemente</p>
              </div>
              <Link href="/projetos" className="text-sm font-medium text-brand-600 hover:underline">
                Ver todos
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-y border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-2.5 font-semibold">Projeto / Cliente</th>
                  <th className="px-5 py-2.5 font-semibold">Normas</th>
                  <th className="px-5 py-2.5 font-semibold">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 6).map((project) => {
                  const progress = projectProgress(project.requirements);
                  return (
                    <tr
                      key={project.id}
                      className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-3">
                        <Link href={`/projetos/${project.id}`} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600">
                            {initials(project.client.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-gray-800">
                              {project.client.name}
                            </span>
                            <span className="block truncate text-xs text-gray-400">{project.type}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {project.standards.map((s) => s.standard.code).join(", ")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProgressBar percent={progress} className="w-24" />
                          <span className="text-xs font-semibold text-gray-600">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Requisitos por status
              </h3>
              <StatusDonut distribution={dist} total={allReqs.length} />
            </Card>

            <Card>
              <h3 className="mb-3 text-base font-semibold text-gray-800">
                Ações em aberto
              </h3>
              {openActions.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma ação pendente.</p>
              ) : (
                <ul className="space-y-3">
                  {openActions.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/projetos/${a.projectRequirement.projectId}/requisitos/${a.projectRequirement.id}`}
                        className="block border-l-2 border-brand-300 pl-3 transition hover:border-brand-500"
                      >
                        <p className="text-sm text-gray-700 line-clamp-2">{a.action}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <ActionPlanStatusBadge status={a.status} />
                          <ActionPlanPriorityBadge priority={a.priority} />
                          <span>· {a.projectRequirement.requirement.code}</span>
                          <span>· {formatDate(a.dueDate)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div className="mt-6">
          <TableCard
            title="Atividades recentes"
            subtitle="O que a equipe fez nos seus clientes"
          >
            <ActivityFeed entries={activity} />
          </TableCard>
        </div>
      )}
    </div>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
