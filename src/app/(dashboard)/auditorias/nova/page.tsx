import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { AuditForm, type ProjectOption } from "@/components/audit/AuditForm";
import { createAudit } from "../actions";

export default async function NovaAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const ctx = await getContext();
  if (!can(ctx.role, "manage_audits")) redirect("/auditorias");

  const projects = await prisma.isoProject.findMany({
    where: { client: clientWhere(ctx) },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      standards: { include: { standard: { select: { code: true } } } },
    },
  });

  const options: ProjectOption[] = projects.map((p) => ({
    id: p.id,
    label: `${p.client.name} — ${p.type} (${p.standards
      .map((s) => s.standard.code)
      .join(", ")})`,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Nova auditoria"
        breadcrumb={[
          { label: "Auditorias", href: "/auditorias" },
          { label: "Nova" },
        ]}
      />
      {options.length === 0 ? (
        <EmptyState
          title="Crie um projeto primeiro"
          description="A auditoria é conduzida sobre um projeto ISO existente, do qual herda a trilha de requisitos."
          action={<ButtonLink href="/projetos/novo">Criar projeto</ButtonLink>}
        />
      ) : (
        <Card>
          <AuditForm
            action={createAudit}
            projects={options}
            defaultProjectId={projectId}
          />
        </Card>
      )}
    </div>
  );
}
