import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DocumentStatusBadge } from "@/components/ui/Badge";
import { RestoreButton } from "@/components/requirement/RestoreButton";
import { restoreVersion } from "../../../../doc-actions";
import { formatDate } from "@/lib/utils";

export default async function RevisaoPage({
  params,
}: {
  params: Promise<{ id: string; prId: string; docId: string; versionId: string }>;
}) {
  const { id, prId, docId, versionId } = await params;
  const ctx = await getContext();
  const canDocs = can(ctx.role, "manage_documents");

  const version = await prisma.documentVersion.findFirst({
    where: {
      id: versionId,
      documentId: docId,
      document: {
        projectRequirementId: prId,
        projectRequirement: { project: { client: clientWhere(ctx) } },
      },
    },
    include: {
      document: { select: { revision: true } },
    },
  });
  if (!version) notFound();

  const isCurrent = version.revision === version.document.revision;
  const docHref = `/projetos/${id}/requisitos/${prId}/documentos/${docId}`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Revisão ${String(version.revision).padStart(2, "0")}`}
        subtitle={version.changeNote || undefined}
        breadcrumb={[
          { label: "Documento", href: docHref },
          { label: `Revisão ${String(version.revision).padStart(2, "0")}` },
        ]}
        action={
          <div className="flex items-center gap-3">
            <DocumentStatusBadge status={version.status} />
            {!isCurrent && canDocs && (
              <RestoreButton
                action={restoreVersion.bind(null, docId, versionId)}
                revisionLabel={String(version.revision).padStart(2, "0")}
              />
            )}
          </div>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-100 pb-4 text-xs text-gray-400">
          <span className="font-medium text-gray-600">{version.title}</span>
          <span>
            {version.authorName ? `${version.authorName} · ` : ""}
            {formatDate(version.createdAt)}
          </span>
          {isCurrent && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
              revisão atual
            </span>
          )}
        </div>
        <div
          className="doc-content max-w-none"
          dangerouslySetInnerHTML={{ __html: version.contentHtml }}
        />
      </Card>
    </div>
  );
}
