import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { TableCard, Table, THead, Th, Tr, Td, AvatarCell } from "@/components/ui/Table";

export default async function ClientesPage() {
  const ctx = await getContext();
  const canManage = can(ctx.role, "manage_clients");
  const clients = await prisma.client.findMany({
    where: clientWhere(ctx),
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { projects: true } },
      responsibleMembership: { select: { user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Empresas que você acompanha nas implantações ISO"
        action={
          canManage ? (
            <ButtonLink href="/clientes/novo">+ Novo cliente</ButtonLink>
          ) : undefined
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre seu primeiro cliente para iniciar um projeto ISO."
          action={<ButtonLink href="/clientes/novo">Cadastrar cliente</ButtonLink>}
        />
      ) : (
        <TableCard>
          <Table>
            <THead>
              <Th>Cliente</Th>
              <Th>Consultor responsável</Th>
              <Th>Segmento</Th>
              <Th align="center">Projetos</Th>
              <Th>CNPJ</Th>
            </THead>
            <tbody>
              {clients.map((client) => (
                <Tr key={client.id}>
                  <Td className="py-3">
                    <Link href={`/clientes/${client.id}`} className="inline-block">
                      <AvatarCell name={client.name} />
                    </Link>
                  </Td>
                  <Td>
                    {client.responsibleMembership?.user.name ?? (
                      <span className="text-amber-600">Sem responsável</span>
                    )}
                  </Td>
                  <Td>{client.segment || "—"}</Td>
                  <Td align="center" className="font-semibold text-gray-700">
                    {client._count.projects}
                  </Td>
                  <Td className="text-gray-400">{client.cnpj || "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
