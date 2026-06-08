import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { updateClient } from "../../actions";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();
  const client = await prisma.client.findFirst({
    where: { id, ...clientWhere(ctx) },
  });
  if (!client) notFound();

  const action = updateClient.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Editar cliente"
        breadcrumb={[
          { label: "Clientes", href: "/clientes" },
          { label: client.name, href: `/clientes/${id}` },
          { label: "Editar" },
        ]}
      />
      <Card>
        <ClientForm action={action} defaults={client} submitLabel="Salvar alterações" />
      </Card>
    </div>
  );
}
