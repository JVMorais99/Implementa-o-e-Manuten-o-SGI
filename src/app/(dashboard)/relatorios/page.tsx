import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/StatCard";
import { TableCard, Table, THead, Th, Tr, Td, AvatarCell } from "@/components/ui/Table";
import { projectProgress } from "@/lib/progress";

export default async function RelatoriosPage() {
  const ctx = await getContext();
  const projects = await prisma.isoProject.findMany({
    where: { client: clientWhere(ctx) },
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { name: true } },
      standards: { include: { standard: { select: { code: true } } } },
      requirements: { select: { status: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Relatórios"
        subtitle="Diagnóstico de implantação por projeto"
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto para relatar"
          description="Crie um projeto ISO para gerar o relatório de diagnóstico."
          action={<ButtonLink href="/projetos/novo">Criar projeto</ButtonLink>}
        />
      ) : (
        <TableCard>
          <Table>
            <THead>
              <Th>Projeto / Cliente</Th>
              <Th>Normas</Th>
              <Th>Progresso</Th>
              <Th align="right"> </Th>
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
                      <Link href={`/relatorios/${project.id}`} className="inline-block">
                        <AvatarCell name={project.client.name} secondary={project.type} />
                      </Link>
                    </Td>
                    <Td>{norms || "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <ProgressBar percent={progress} className="w-28" />
                        <span className="text-xs font-semibold text-gray-600">{progress}%</span>
                      </div>
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/relatorios/${project.id}`}
                        className="whitespace-nowrap text-sm font-medium text-brand-600 hover:underline"
                      >
                        Ver diagnóstico →
                      </Link>
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
