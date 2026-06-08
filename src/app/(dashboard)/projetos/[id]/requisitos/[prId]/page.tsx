import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequirementStatusBadge, DocumentStatusBadge } from "@/components/ui/Badge";
import { RequirementStatusForm } from "@/components/requirement/RequirementStatusForm";
import { CommentForm } from "@/components/requirement/CommentForm";
import {
  ActionPlanSection,
  type ActionPlanItem,
} from "@/components/requirement/ActionPlanSection";
import {
  EvidenceSection,
  type EvidenceItem,
} from "@/components/requirement/EvidenceSection";
import {
  GenerateDocSection,
  type TemplateOption,
} from "@/components/requirement/GenerateDocSection";
import { AiAssistant } from "@/components/requirement/AiAssistant";
import { getContext, clientWhere } from "@/lib/session";
import { can } from "@/lib/permissions";
import { aiEnabled } from "@/lib/features";
import { parseJsonArray, formatDate, mergeUnique } from "@/lib/utils";
import {
  updateRequirement,
  markConforme,
  addComment,
  createActionPlan,
  deleteActionPlan,
  uploadEvidence,
  deleteEvidence,
} from "./actions";
import {
  generateDocumentForRequirement,
  generateGenericForRequirement,
} from "./doc-actions";
import {
  suggestConformityAction,
  generateActionPlanAction,
  applyConformitySuggestion,
  analyzeEvidenceAction,
  applyEvidenceSuggestion,
} from "./ai-actions";

export default async function RequisitoPage({
  params,
}: {
  params: Promise<{ id: string; prId: string }>;
}) {
  const { id, prId } = await params;
  const ctx = await getContext();
  const canEdit = can(ctx.role, "edit_requirements");
  const canDocs = can(ctx.role, "manage_documents");
  const canAi = can(ctx.role, "ai_assist");
  const aiOn = canAi && aiEnabled();

  const pr = await prisma.projectRequirement.findFirst({
    where: { id: prId, project: { client: clientWhere(ctx) } },
    include: {
      requirement: true,
      standard: { select: { code: true } },
      project: {
        include: { standards: { include: { standard: true } }, client: true },
      },
      evidences: { orderBy: { createdAt: "desc" } },
      generatedDocuments: { orderBy: { createdAt: "desc" } },
      actionPlans: { orderBy: { createdAt: "desc" } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!pr) notFound();

  const projectStandardCodes = pr.project.standards.map((s) => s.standard.code);

  // Requisitos "irmãos": mesmo código em qualquer norma do projeto. A trilha mostra
  // o requisito uma única vez, mas ele pode pertencer a várias normas — então
  // mesclamos as evidências esperadas e listamos todas as normas aplicáveis.
  const siblings = await prisma.isoRequirement.findMany({
    where: {
      code: pr.requirement.code,
      standardId: { in: pr.project.standards.map((s) => s.standardId) },
    },
    include: { standard: { select: { code: true } } },
  });
  const expectedEvidence = mergeUnique(
    (siblings.length ? siblings : [pr.requirement]).map((r) =>
      parseJsonArray(r.expectedEvidence)
    )
  );
  const requirementNorms = projectStandardCodes.filter((code) =>
    siblings.some((s) => s.standard.code === code)
  );

  // Modelos aplicáveis: requisito casa pelo código e ao menos uma norma do projeto.
  const allTemplates = await prisma.documentTemplate.findMany({
    where: { isActive: true },
  });
  const applicableTemplates = allTemplates.filter((t) => {
    const codes = parseJsonArray(t.applicableRequirementCodes);
    const stds = parseJsonArray(t.applicableStandards);
    const codeMatch = codes.includes(pr.requirement.code);
    const stdMatch =
      stds.length === 0 || stds.some((s) => projectStandardCodes.includes(s));
    return codeMatch && stdMatch;
  });

  const normasLabel = projectStandardCodes.join(", ") || "as normas do projeto";

  // Opção genérica: SEMPRE disponível para qualquer requisito. Gera um documento
  // específico do requisito, observando as normas do cliente.
  const genericOption: TemplateOption = {
    id: "generic",
    name: `Documento de atendimento ao requisito ${pr.requirement.code}`,
    documentType: "DOCUMENTO",
    description: `Documento profissional estruturado especificamente para este requisito, observando ${normasLabel}.`,
    action: generateGenericForRequirement.bind(null, prId),
  };

  const templateOptions: TemplateOption[] = [
    ...applicableTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      documentType: t.documentType,
      description: t.description,
      action: generateDocumentForRequirement.bind(null, prId, t.id),
    })),
    genericOption,
  ];

  const evidenceItems: EvidenceItem[] = pr.evidences.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    fileName: e.fileName,
    status: e.status,
    technicalAnalysis: e.technicalAnalysis,
    receivedAt: e.receivedAt,
    expiresAt: e.expiresAt,
    aiAnalysis: e.aiAnalysis,
    aiSuggestedStatus: e.aiSuggestedStatus,
    aiConfidence: e.aiConfidence,
  }));

  const actionPlanItems: ActionPlanItem[] = pr.actionPlans.map((a) => ({
    id: a.id,
    action: a.action,
    responsible: a.responsible,
    dueDate: a.dueDate,
    status: a.status,
    priority: a.priority,
  }));

  const boundUpdate = updateRequirement.bind(null, prId);
  const boundComment = addComment.bind(null, prId);
  const boundCreateAction = createActionPlan.bind(null, prId);
  const boundDeleteAction = deleteActionPlan.bind(null, prId);
  const boundUpload = uploadEvidence.bind(null, prId);
  const boundDeleteEvidence = deleteEvidence.bind(null, prId);
  const boundMarkConforme = markConforme.bind(null, prId);
  const boundSuggestConformity = suggestConformityAction.bind(null, prId);
  const boundGenerateActionPlan = generateActionPlanAction.bind(null, prId);
  const boundApplyConformity = applyConformitySuggestion.bind(null, prId);
  const boundAnalyzeEvidence = analyzeEvidenceAction.bind(null, prId);
  const boundApplyEvidence = applyEvidenceSuggestion.bind(null, prId);

  return (
    <div>
      <PageHeader
        title={`${pr.requirement.code} — ${pr.requirement.title}`}
        breadcrumb={[
          { label: "Projetos", href: "/projetos" },
          { label: pr.project.type, href: `/projetos/${id}` },
          { label: pr.requirement.code },
        ]}
        action={
          <div className="flex items-center gap-3">
            <RequirementStatusBadge status={pr.status} />
            {canEdit && (
              <form action={boundMarkConforme}>
                <Button variant="secondary" type="submit">
                  Marcar como conforme
                </Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Sobre o requisito
              </h3>
              {requirementNorms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {requirementNorms.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed text-gray-700">
              {pr.requirement.description}
            </p>
            {requirementNorms.length > 1 && (
              <p className="mt-2 text-xs text-gray-500">
                Requisito comum às normas {requirementNorms.join(", ")} — o documento
                gerado contempla as exigências de todas elas.
              </p>
            )}

            <div className="mt-4 rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Pergunta sugerida ao cliente
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {pr.requirement.suggestedQuestion}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Orientação ao consultor
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {pr.requirement.consultantGuidance}
              </p>
            </div>

            {expectedEvidence.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Evidências esperadas
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {expectedEvidence.map((ev) => (
                    <span
                      key={ev}
                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {canAi && (
            <Card>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-800">
                  Assistente de IA
                </h3>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                  Fase 4
                </span>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Sugestão de conformidade e plano de ação a partir das evidências e do
                contexto do requisito.
              </p>
              <AiAssistant
                enabled={aiOn}
                canEdit={canEdit}
                suggestedStatus={pr.aiSuggestedStatus}
                rationale={pr.aiRationale}
                evaluatedAt={pr.aiEvaluatedAt}
                suggestAction={boundSuggestConformity}
                planAction={boundGenerateActionPlan}
                applyAction={boundApplyConformity}
              />
            </Card>
          )}

          {canDocs && (
            <Card>
              <h3 className="mb-1 text-base font-semibold text-gray-800">
                Gerar evidência / documento
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                Modelos profissionais já contextualizados para {pr.project.client.name} e
                as normas do projeto.
              </p>
              <GenerateDocSection templates={templateOptions} />
            </Card>
          )}

          {pr.generatedDocuments.length > 0 && (
            <Card>
              <h3 className="mb-4 text-base font-semibold text-gray-800">
                Documentos gerados
              </h3>
              <ul className="space-y-2">
                {pr.generatedDocuments.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/projetos/${id}/requisitos/${prId}/documentos/${doc.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          Atualizado em {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                      <DocumentStatusBadge status={doc.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Evidências anexadas
            </h3>
            <EvidenceSection
              items={evidenceItems}
              uploadAction={boundUpload}
              deleteAction={boundDeleteEvidence}
              defaultType={expectedEvidence[0]}
              aiEnabled={aiOn}
              canEdit={canEdit}
              analyzeAction={boundAnalyzeEvidence}
              applyAiStatusAction={boundApplyEvidence}
            />
          </Card>

          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Plano de ação
            </h3>
            <ActionPlanSection
              items={actionPlanItems}
              createAction={boundCreateAction}
              deleteAction={boundDeleteAction}
            />
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {canEdit && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Status e avaliação
            </h3>
            <RequirementStatusForm
              action={boundUpdate}
              defaults={{
                status: pr.status,
                consultantNotes: pr.consultantNotes,
                clientNotes: pr.clientNotes,
                responsible: pr.responsible,
                dueDate: pr.dueDate,
                completionPercent: pr.completionPercent,
              }}
            />
          </Card>
          )}

          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">Comentários</h3>
            <CommentForm action={boundComment} />
            <ul className="mt-4 space-y-3">
              {pr.comments.length === 0 && (
                <li className="text-sm text-gray-400">Nenhum comentário ainda.</li>
              )}
              {pr.comments.map((c) => (
                <li key={c.id} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">{c.text}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {c.author.name} · {formatDate(c.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
