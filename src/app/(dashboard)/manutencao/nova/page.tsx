import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { CertificationForm } from "@/components/certification/CertificationForm";
import { createCertification } from "../actions";

export default async function NovaCertificacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients")) redirect("/manutencao");

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
        title="Nova certificação"
        breadcrumb={[
          { label: "Manutenção", href: "/manutencao" },
          { label: "Nova" },
        ]}
      />
      {clients.length === 0 ? (
        <EmptyState
          title="Cadastre um cliente primeiro"
          description="A certificação pertence a um cliente. Cadastre o cliente para registrar sua certificação ISO."
          action={<ButtonLink href="/clientes/novo">Cadastrar cliente</ButtonLink>}
        />
      ) : (
        <Card>
          <CertificationForm
            action={createCertification}
            clients={clients}
            standards={standards}
            defaultClientId={clientId}
          />
        </Card>
      )}
    </div>
  );
}
