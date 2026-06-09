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
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { deleteClient, setClientResponsible } from "../actions";
import { projectProgress } from "@/lib/progress";
import { ResponsibleSelect } from "@/components/team/ResponsibleSelect";

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{value || "—"}</p>
    </div>
  );
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();
  const canClients = can(ctx.role, "manage_clients");
  const canProjects = can(ctx.role, "manage_projects");
  const canMembers = can(ctx.role, "manage_members");
  const client = await prisma.client.findFirst({
    where: { id, ...clientWhere(ctx) },
    include: {
      responsibleMembership: { select: { id: true, user: { select: { name: true } } } },
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          standards: { include: { standard: true } },
          requirements: { select: { status: true } },
        },
      },
    },
  });
  if (!client) notFound();

  // Supervisor (ADMIN) pode atribuir o consultor responsável (define o acesso).
  const members = canMembers
    ? await prisma.membership.findMany({
        where: { organizationId: ctx.orgId ?? "__none__", role: { not: "CLIENTE" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, user: { select: { name: true } } },
      })
    : [];

  const boundDelete = deleteClient.bind(null, id);

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={client.segment || undefined}
        breadcrumb={[
          { label: "Clientes", href: "/clientes" },
          { label: client.name },
        ]}
        action={
          canClients || canProjects ? (
            <div className="flex gap-2">
              {canClients && (
                <ButtonLink href={`/clientes/${id}/editar`} variant="outline">
                  Editar
                </ButtonLink>
              )}
              {canProjects && (
                <ButtonLink href={`/projetos/novo?clientId=${id}`}>
                  + Novo projeto
                </ButtonLink>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-base font-semibold text-gray-800">
            Dados do cliente
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Info label="CNPJ" value={client.cnpj} />
            <Info label="Unidade" value={client.unit} />
            <Info label="Contato (cliente)" value={client.responsible} />
            <Info label="Contato" value={client.contact} />
            <Info label="Segmento" value={client.segment} />
          </div>
          <div className="mt-4">
            <Info label="Escopo" value={client.scope} />
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Consultor responsável
            </p>
            {canMembers ? (
              <div className="mt-1.5">
                <ResponsibleSelect
                  key={client.responsibleMembershipId ?? "none"}
                  action={setClientResponsible.bind(null, id)}
                  members={members.map((m) => ({ id: m.id, name: m.user.name }))}
                  current={client.responsibleMembershipId}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Define quem responde pelo cliente e concede o acesso.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                {client.responsibleMembership?.user.name ?? "—"}
              </p>
            )}
          </div>
          {client.notes && (
            <div className="mt-4">
              <Info label="Observações" value={client.notes} />
            </div>
          )}
          {canClients && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <DeleteButton
                action={boundDelete}
                label="Excluir cliente"
                confirmMessage="Excluir este cliente removerá todos os seus projetos e dados. Continuar?"
              />
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          {client.projects.length === 0 ? (
            <Card>
              <h3 className="mb-4 text-base font-semibold text-gray-800">Projetos ISO</h3>
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum projeto ainda.
                  {canProjects && " Crie o primeiro projeto ISO deste cliente."}
                </p>
                {canProjects && (
                  <div className="mt-3">
                    <ButtonLink href={`/projetos/novo?clientId=${id}`} variant="secondary">
                      + Novo projeto
                    </ButtonLink>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <TableCard title="Projetos ISO">
              <Table>
                <THead>
                  <Th>Projeto</Th>
                  <Th>Normas</Th>
                  <Th>Status</Th>
                  <Th>Progresso</Th>
                  <Th>Prazo</Th>
                </THead>
                <tbody>
                  {client.projects.map((project) => {
                    const progress = projectProgress(project.requirements);
                    const norms = project.standards
                      .map((s) => s.standard.code)
                      .join(", ");
                    return (
                      <Tr key={project.id}>
                        <Td className="py-3">
                          <Link
                            href={`/projetos/${project.id}`}
                            className="font-semibold text-gray-800 hover:text-brand-600"
                          >
                            {project.type}
                          </Link>
                        </Td>
                        <Td>{norms || "—"}</Td>
                        <Td>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ??
                              project.status}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <ProgressBar percent={progress} className="w-20" />
                            <span className="text-xs font-semibold text-gray-600">{progress}%</span>
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap text-gray-400">{formatDate(project.dueDate)}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableCard>
          )}
        </div>
      </div>
    </div>
  );
}
