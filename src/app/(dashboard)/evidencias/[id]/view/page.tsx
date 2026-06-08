import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EvidenceStatusBadge } from "@/components/ui/Badge";
import {
  previewKind,
  docxToHtml,
  sheetToHtml,
  textToHtml,
} from "@/lib/evidence-preview";
import { formatDate } from "@/lib/utils";

export default async function EvidenceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();

  const evidence = await prisma.evidence.findFirst({
    where: {
      id,
      projectRequirement: { project: { client: clientWhere(ctx) } },
    },
    include: {
      projectRequirement: {
        select: {
          id: true,
          projectId: true,
          requirement: { select: { code: true, title: true } },
        },
      },
    },
  });
  if (!evidence) notFound();

  const kind = previewKind(evidence.fileName);
  const downloadUrl = `/api/evidences/${id}/download`;
  const inlineUrl = `${downloadUrl}?view=1`;
  const backHref = `/projetos/${evidence.projectRequirement.projectId}/requisitos/${evidence.projectRequirement.id}`;

  // Converte documentos do Office / texto para HTML quando aplicável.
  let html: string | null = null;
  let conversionError = false;
  if (kind === "docx" || kind === "sheet" || kind === "text") {
    try {
      const buffer = await readStoredFile(evidence.fileUrl);
      if (kind === "docx") html = await docxToHtml(buffer);
      else if (kind === "sheet") html = await sheetToHtml(buffer);
      else html = textToHtml(buffer);
    } catch {
      conversionError = true;
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={evidence.title}
        subtitle={`${evidence.type} · ${evidence.fileName}`}
        breadcrumb={[
          { label: "Requisito", href: backHref },
          {
            label: `${evidence.projectRequirement.requirement.code} ${evidence.projectRequirement.requirement.title}`,
            href: backHref,
          },
          { label: "Evidência" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <EvidenceStatusBadge status={evidence.status} />
            <ButtonLink href={downloadUrl} variant="outline">
              Baixar
            </ButtonLink>
          </div>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-400">
          <span>Recebida: {formatDate(evidence.receivedAt)}</span>
          {evidence.expiresAt && <span>Validade: {formatDate(evidence.expiresAt)}</span>}
        </div>
        {evidence.technicalAnalysis && (
          <p className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Análise técnica: </span>
            {evidence.technicalAnalysis}
          </p>
        )}

        {kind === "pdf" && (
          <iframe
            src={inlineUrl}
            title={evidence.fileName}
            className="h-[78vh] w-full rounded-xl border border-gray-200"
          />
        )}

        {kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={inlineUrl}
            alt={evidence.fileName}
            className="mx-auto max-h-[78vh] rounded-xl border border-gray-200"
          />
        )}

        {(kind === "docx" || kind === "sheet" || kind === "text") &&
          (conversionError ? (
            <EmptyState
              title="Não foi possível pré-visualizar"
              description="O arquivo pode estar corrompido ou em um formato não suportado. Faça o download para abri-lo localmente."
              action={<ButtonLink href={downloadUrl}>Baixar arquivo</ButtonLink>}
            />
          ) : (
            <div
              className="doc-content max-w-none overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-800"
              dangerouslySetInnerHTML={{ __html: html ?? "" }}
            />
          ))}

        {kind === "unsupported" && (
          <EmptyState
            title="Pré-visualização indisponível para este formato"
            description={`Arquivos ${evidence.fileName
              .split(".")
              .pop()
              ?.toUpperCase()} não podem ser exibidos no navegador. Faça o download para abri-lo no aplicativo apropriado.`}
            action={<ButtonLink href={downloadUrl}>Baixar arquivo</ButtonLink>}
          />
        )}
      </Card>
    </div>
  );
}
