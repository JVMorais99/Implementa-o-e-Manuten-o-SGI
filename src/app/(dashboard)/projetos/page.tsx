import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/StatCard";
import { TableCard, Table, THead, Th, Tr, Td, AvatarCell } from "@/components/ui/Table";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { projectProgress } from "@/lib/progress";

export default async function ProjetosPage() {
  const ctx = await getContext();
  const canManage = can(ctx.role, "manage_projects");
  const projects = await prisma.isoProject.findMany({
    where: { client: clientWhere(ctx) },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      standards: { include: { standard: { select: { code: true } } } },
      requirements: { select: { status: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Projetos ISO"
        subtitle="Acompanhe a implantação de cada cliente"
        action={
          canManage ? (
            <ButtonLink href="/projetos/novo">+ Novo projeto</ButtonLink>
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto criado"
          description="Crie um projeto ISO para gerar a trilha de requisitos."
          action={<ButtonLink href="/projetos/novo">Criar projeto</ButtonLink>}
        />
      ) : (
        <TableCard>
          <Table>
            <THead>
              <Th>Projeto / Cliente</Th>
              <Th>Normas</Th>
              <Th>Status</Th>
              <Th>Progresso</Th>
              <Th align="center">Requisitos</Th>
              <Th>Prazo</Th>
            </THead>
            <tbody>
              {projects.map((project) => {
                const progress = projectProgress(project.requirements);
                const norms = project.standards
                  .map((s) => s.standard.code)
                  .join(", ");
                return (
                  <Tr key={project.id}>
                    <Td className="py-3">
                      <Link href={`/projetos/${project.id}`} className="inline-block">
                        <AvatarCell name={project.client.name} secondary={project.type} />
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
                        <ProgressBar percent={progress} className="w-24" />
                        <span className="text-xs font-semibold text-gray-600">{progress}%</span>
                      </div>
                    </Td>
                    <Td align="center">{project.requirements.length}</Td>
                    <Td className="whitespace-nowrap text-gray-400">{formatDate(project.dueDate)}</Td>
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
