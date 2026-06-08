import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { RequirementStatusBadge } from "@/components/ui/Badge";
import { PrintButton } from "@/components/ui/PrintButton";
import { ButtonLink } from "@/components/ui/Button";
import { StatusDonut } from "@/components/dashboard/StatusDonut";
import {
  REQUIREMENT_STATUS_LABELS,
  type ProjectRequirementStatus,
} from "@/lib/enums";
import { projectProgress, statusDistribution } from "@/lib/progress";
import { formatDate } from "@/lib/utils";

export default async function DiagnosticoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();

  const project = await prisma.isoProject.findFirst({
    where: { id, client: clientWhere(ctx) },
    include: {
      client: true,
      standards: { include: { standard: true } },
      requirements: {
        include: {
          requirement: true,
          standard: { select: { code: true } },
          _count: { select: { evidences: true, actionPlans: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const reqs = [...project.requirements].sort(
    (a, b) => a.requirement.order - b.requirement.order
  );
  const progress = projectProgress(reqs);
  const dist = statusDistribution(reqs);
  const norms = project.standards.map((s) => s.standard.code).join(", ");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Relatório de diagnóstico"
        breadcrumb={[
          { label: "Relatórios", href: "/relatorios" },
          { label: project.type },
        ]}
        action={
          <div className="flex items-center gap-2">
            <ButtonLink href={`/relatorios/${id}/matriz`} variant="outline">
              Matriz de evidências
            </ButtonLink>
            <PrintButton />
          </div>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Cliente</p>
            <p className="text-sm font-medium text-gray-800">{project.client.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Projeto</p>
            <p className="text-sm text-gray-700">{project.type}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Normas</p>
            <p className="text-sm text-gray-700">{norms}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Conclusão</p>
            <p className="text-sm font-semibold text-gray-800">{progress}%</p>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-100 pt-6">
          <StatusDonut distribution={dist} total={reqs.length} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-gray-800">
          Situação por requisito
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Requisito</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-center">Evid.</th>
                <th className="py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((pr) => (
                <tr key={pr.id} className="border-b border-gray-50">
                  <td className="py-2 pr-3 font-semibold text-brand-700">
                    {pr.requirement.code}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">{pr.requirement.title}</td>
                  <td className="py-2 pr-3">
                    <span className="print:hidden">
                      <RequirementStatusBadge status={pr.status} />
                    </span>
                    <span className="hidden print:inline">
                      {REQUIREMENT_STATUS_LABELS[
                        pr.status as ProjectRequirementStatus
                      ] ?? pr.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-center text-gray-500">
                    {pr._count.evidences}
                  </td>
                  <td className="py-2 text-center text-gray-500">
                    {pr._count.actionPlans}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Relatório gerado em {formatDate(new Date())} · {reqs.length} requisitos avaliados.
        </p>
      </Card>
    </div>
  );
}
