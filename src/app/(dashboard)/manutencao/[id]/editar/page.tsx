import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { CertificationForm } from "@/components/certification/CertificationForm";
import { updateCertification } from "../../actions";

export default async function EditarCertificacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();
  if (!can(ctx.role, "manage_clients")) redirect("/manutencao");

  const cert = await prisma.certification.findFirst({
    where: { id, client: clientWhere(ctx) },
    include: {
      client: { select: { id: true, name: true } },
      standard: { select: { id: true, code: true, name: true } },
    },
  });
  if (!cert) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Editar certificação"
        subtitle={`${cert.client.name} · ${cert.standard.code}`}
        breadcrumb={[
          { label: "Manutenção", href: "/manutencao" },
          { label: "Editar" },
        ]}
      />
      <Card>
        <CertificationForm
          action={updateCertification.bind(null, id)}
          clients={[{ id: cert.client.id, name: cert.client.name }]}
          standards={[
            { id: cert.standard.id, code: cert.standard.code, name: cert.standard.name },
          ]}
          cert={{
            clientId: cert.clientId,
            standardId: cert.standardId,
            certifyingBody: cert.certifyingBody,
            certificateNo: cert.certificateNo,
            scope: cert.scope,
            issuedAt: cert.issuedAt,
            expiresAt: cert.expiresAt,
            surveillanceIntervalMonths: cert.surveillanceIntervalMonths,
            status: cert.status,
            notes: cert.notes,
          }}
        />
      </Card>
    </div>
  );
}
