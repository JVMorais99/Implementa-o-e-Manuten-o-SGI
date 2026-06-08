import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { DocumentStatusBadge } from "@/components/ui/Badge";
import { DocumentEditor } from "@/components/requirement/DocumentEditor";
import { RestoreButton } from "@/components/requirement/RestoreButton";
import { DocumentLifecycle } from "@/components/requirement/DocumentLifecycle";
import {
  updateDocument,
  deleteDocument,
  restoreVersion,
  sendDocumentToClient,
  registerSignedReceipt,
  approveDocument,
} from "../../doc-actions";
import { formatDate } from "@/lib/utils";

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string; prId: string; docId: string }>;
}) {
  const { id, prId, docId } = await params;
  const ctx = await getContext();
  const canDocs = can(ctx.role, "manage_documents");

  const doc = await prisma.generatedDocument.findFirst({
    where: {
      id: docId,
      projectRequirementId: prId,
      projectRequirement: { project: { client: clientWhere(ctx) } },
    },
    include: {
      versions: { orderBy: { revision: "desc" } },
      projectRequirement: {
        include: {
          requirement: { select: { code: true, title: true } },
          project: { select: { type: true, clientId: true } },
        },
      },
    },
  });
  if (!doc) notFound();

  const boundUpdate = updateDocument.bind(null, docId);
  const boundDelete = deleteDocument.bind(null, prId, docId);
  const req = doc.projectRequirement.requirement;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Documento gerado"
        breadcrumb={[
          { label: "Projetos", href: "/projetos" },
          { label: doc.projectRequirement.project.type, href: `/projetos/${id}` },
          {
            label: `${req.code} ${req.title}`,
            href: `/projetos/${id}/requisitos/${prId}`,
          },
          { label: "Documento" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <DocumentStatusBadge status={doc.status} />
            {canDocs && (
              <DeleteButton
                action={boundDelete}
                label="Excluir documento"
                confirmMessage="Excluir este documento gerado e todo o seu histórico?"
              />
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <DocumentEditor
            action={boundUpdate}
            doc={{
              title: doc.title,
              contentHtml: doc.contentHtml,
              status: doc.status,
              revision: doc.revision,
            }}
            exportHref={`/api/documents/${docId}/export`}
          />
        </Card>

        {canDocs && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Envio e assinatura
            </h3>
            <DocumentLifecycle
              status={doc.status}
              sentToClientAt={doc.sentToClientAt}
              signedReceivedAt={doc.signedReceivedAt}
              sendAction={sendDocumentToClient.bind(null, docId)}
              signAction={registerSignedReceipt.bind(null, docId)}
              approveAction={approveDocument.bind(null, docId)}
            />
          </Card>
        )}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            Histórico de revisões
          </h3>
          <span className="text-sm text-gray-400">
            {doc.versions.length} revis{doc.versions.length === 1 ? "ão" : "ões"}
          </span>
        </div>

        <ul className="divide-y divide-gray-100">
          {doc.versions.map((v) => {
            const isCurrent = v.revision === doc.revision;
            return (
              <li key={v.id} className="flex items-start gap-4 py-3">
                <span
                  className={`mt-0.5 w-12 shrink-0 text-sm font-semibold ${
                    isCurrent ? "text-brand-700" : "text-gray-400"
                  }`}
                >
                  Rev {String(v.revision).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">
                    {v.changeNote || "—"}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        atual
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {v.authorName ? `${v.authorName} · ` : ""}
                    {formatDate(v.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Link
                    href={`/projetos/${id}/requisitos/${prId}/documentos/${docId}/revisoes/${v.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    Visualizar
                  </Link>
                  {!isCurrent && (
                    <RestoreButton
                      action={restoreVersion.bind(null, docId, v.id)}
                      revisionLabel={String(v.revision).padStart(2, "0")}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
