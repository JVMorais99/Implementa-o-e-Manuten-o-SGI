import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { createProject } from "../actions";

export default async function NovoProjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const ctx = await getContext();
  if (!can(ctx.role, "manage_projects")) redirect("/projetos");

  const [clients, standards] = await Promise.all([
    prisma.client.findMany({
      where: clientWhere(ctx),
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.isoStandard.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Novo projeto ISO"
        breadcrumb={[
          { label: "Projetos", href: "/projetos" },
          { label: "Novo" },
        ]}
      />
      {clients.length === 0 ? (
        <EmptyState
          title="Cadastre um cliente primeiro"
          description="Você precisa de ao menos um cliente para criar um projeto."
          action={<ButtonLink href="/clientes/novo">Cadastrar cliente</ButtonLink>}
        />
      ) : (
        <Card>
          <ProjectForm
            action={createProject}
            clients={clients}
            standards={standards}
            defaultClientId={clientId}
          />
        </Card>
      )}
    </div>
  );
}
