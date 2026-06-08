import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { ButtonLink } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { ProgressBar } from "@/components/ui/StatCard";
import { RequirementStatusBadge } from "@/components/ui/Badge";
import { StatusDonut } from "@/components/dashboard/StatusDonut";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/enums";
import { formatDate, compareReqCodes } from "@/lib/utils";
import { projectProgress, statusDistribution } from "@/lib/progress";
import { deleteProject } from "../actions";

export default async function ProjetoTrilhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();
  const canProjects = can(ctx.role, "manage_projects");
  const canAudits = can(ctx.role, "manage_audits");

  const project = await prisma.isoProject.findFirst({
    where: { id, client: clientWhere(ctx) },
    include: {
      client: true,
      standards: { include: { standard: true } },
      requirements: {
        include: {
          requirement: true,
          _count: {
            select: { evidences: true, generatedDocuments: true, actionPlans: true },
          },
        },
      },
    },
  });
  if (!project) notFound();

  // Mapa código -> normas do projeto que contêm aquele requisito. Como a trilha
  // deduplica por código (1 requisito por código), exibimos todas as normas às
  // quais ele se aplica, e não apenas a norma do requisito canônico.
  const standardOrder = project.standards.map((s) => s.standard.code);
  const catalog = await prisma.isoRequirement.findMany({
    where: { standardId: { in: project.standards.map((s) => s.standardId) } },
    select: { code: true, standard: { select: { code: true } } },
  });
  const normsByCode = new Map<string, string[]>();
  for (const item of catalog) {
    const list = normsByCode.get(item.code) ?? [];
    if (!list.includes(item.standard.code)) list.push(item.standard.code);
    normsByCode.set(item.code, list);
  }
  const applicableNorms = (code: string) =>
    (normsByCode.get(code) ?? []).sort(
      (a, b) => standardOrder.indexOf(a) - standardOrder.indexOf(b)
    );

  // Ordena por código de requisito (ordenação natural por segmentos).
  const reqs = [...project.requirements].sort((a, b) =>
    compareReqCodes(a.requirement.code, b.requirement.code)
  );
  const progress = projectProgress(reqs);
  const dist = statusDistribution(reqs);
  const norms = standardOrder.join(", ");
  const boundDelete = deleteProject.bind(null, id);

  return (
    <div>
      <PageHeader
        title={project.type}
        breadcrumb={[
          { label: "Projetos", href: "/projetos" },
          { label: project.client.name, href: `/clientes/${project.clientId}` },
          { label: project.type },
        ]}
        action={
          canProjects || canAudits ? (
            <div className="flex flex-wrap items-center gap-2">
              {canAudits && (
                <ButtonLink href={`/auditorias/nova?projectId=${id}`} variant="secondary">
                  Nova auditoria
                </ButtonLink>
              )}
              {canProjects && (
                <DeleteButton
                  action={boundDelete}
                  label="Excluir projeto"
                  confirmMessage="Excluir este projeto removerá toda a trilha e evidências. Continuar?"
                />
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Cliente</p>
              <Link
                href={`/clientes/${project.clientId}`}
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                {project.client.name}
              </Link>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Normas</p>
              <p className="text-sm text-gray-700">{norms}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
              <p className="text-sm text-gray-700">
                {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Prazo</p>
              <p className="text-sm text-gray-700">{formatDate(project.dueDate)}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600">Conclusão da implantação</span>
              <span className="font-semibold text-gray-800">{progress}%</span>
            </div>
            <ProgressBar percent={progress} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Requisitos por status
          </h3>
          <StatusDonut distribution={dist} total={reqs.length} />
        </Card>
      </div>

      <TableCard
        title="Trilha de requisitos"
        action={<span className="text-sm text-gray-400">{reqs.length} requisitos</span>}
      >
        <Table>
          <THead>
            <Th>Código</Th>
            <Th>Requisito</Th>
            <Th align="center">Evid.</Th>
            <Th align="center">Docs</Th>
            <Th align="center">Ações</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {reqs.map((pr) => (
              <Tr key={pr.id}>
                <Td className="whitespace-nowrap font-semibold text-brand-700">
                  <Link href={`/projetos/${id}/requisitos/${pr.id}`}>{pr.requirement.code}</Link>
                </Td>
                <Td>
                  <Link
                    href={`/projetos/${id}/requisitos/${pr.id}`}
                    className="block max-w-md truncate font-medium text-gray-800 hover:text-brand-600"
                  >
                    {pr.requirement.title}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {applicableNorms(pr.requirement.code).join(" · ")}
                  </span>
                </Td>
                <Td align="center">{pr._count.evidences || "—"}</Td>
                <Td align="center">{pr._count.generatedDocuments || "—"}</Td>
                <Td align="center">{pr._count.actionPlans || "—"}</Td>
                <Td>
                  <RequirementStatusBadge status={pr.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
