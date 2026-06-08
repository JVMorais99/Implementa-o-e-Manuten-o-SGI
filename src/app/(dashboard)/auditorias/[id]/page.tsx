import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { can, isPortalRole } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/ui/DeleteButton";
import {
  AuditChecklistItem,
  type ChecklistItem,
} from "@/components/audit/AuditChecklistItem";
import { FindingForm, type RequirementOption } from "@/components/audit/FindingForm";
import { ConclusionForm } from "@/components/audit/ConclusionForm";
import { AuditActionButton } from "@/components/audit/AuditActionButton";
import { formatDate, compareReqCodes } from "@/lib/utils";
import {
  AUDIT_TYPE_LABELS,
  AUDIT_TYPE_COLORS,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_COLORS,
  AUDIT_ITEM_RESULT_LABELS,
  FINDING_TYPE_LABELS,
  FINDING_TYPE_COLORS,
  FINDING_STATUS_LABELS,
  FINDING_STATUS_COLORS,
  type AuditType,
  type AuditStatus,
  type AuditItemResult,
  type FindingType,
  type FindingStatus,
} from "@/lib/enums";
import {
  updateAuditItem,
  createFinding,
  updateConclusion,
  setAuditStatus,
  setFindingStatus,
  deleteAudit,
  deleteFinding,
} from "../actions";

export default async function AuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();
  if (isPortalRole(ctx.role)) redirect("/projetos");
  const canAudits = can(ctx.role, "manage_audits");

  const audit = await prisma.audit.findFirst({
    where: { id, project: { client: clientWhere(ctx) } },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: true } },
          standards: { include: { standard: { select: { code: true } } } },
        },
      },
      items: {
        include: {
          projectRequirement: {
            include: { requirement: { select: { code: true, title: true, order: true } } },
          },
        },
      },
      findings: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!audit) notFound();

  const norms = audit.project.standards.map((s) => s.standard.code);

  // Mapa código -> normas aplicáveis (igual à trilha do projeto).
  const catalog = await prisma.isoRequirement.findMany({
    where: { standardId: { in: audit.project.standards.map((s) => s.standardId) } },
    select: { code: true, standard: { select: { code: true } } },
  });
  const normsByCode = new Map<string, string[]>();
  for (const c of catalog) {
    const list = normsByCode.get(c.code) ?? [];
    if (!list.includes(c.standard.code)) list.push(c.standard.code);
    normsByCode.set(c.code, list);
  }

  const items = [...audit.items].sort((a, b) =>
    compareReqCodes(
      a.projectRequirement.requirement.code,
      b.projectRequirement.requirement.code
    )
  );

  const checklistItems: ChecklistItem[] = items.map((it) => ({
    id: it.id,
    code: it.projectRequirement.requirement.code,
    title: it.projectRequirement.requirement.title,
    norms: normsByCode.get(it.projectRequirement.requirement.code) ?? norms,
    result: it.result,
    notes: it.notes,
    evidenceSampled: it.evidenceSampled,
  }));

  const requirementOptions: RequirementOption[] = items.map((it) => ({
    id: it.projectRequirementId,
    code: it.projectRequirement.requirement.code,
    title: it.projectRequirement.requirement.title,
  }));

  // Resumo dos resultados.
  const counts = checklistItems.reduce<Record<string, number>>((acc, it) => {
    acc[it.result] = (acc[it.result] ?? 0) + 1;
    return acc;
  }, {});
  const evaluated = checklistItems.filter((i) => i.result !== "NAO_AVALIADO").length;

  const ncCount = audit.findings.filter(
    (f) => f.type === "NC_MAIOR" || f.type === "NC_MENOR"
  ).length;

  const typeLabel = AUDIT_TYPE_LABELS[audit.type as AuditType] ?? audit.type;

  return (
    <div>
      <PageHeader
        title={audit.title}
        breadcrumb={[
          { label: "Auditorias", href: "/auditorias" },
          { label: audit.title },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/audits/${audit.id}/report?format=pdf`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Relatório PDF
            </a>
            <a
              href={`/api/audits/${audit.id}/report?format=docx`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Relatório Word
            </a>
            {canAudits && (
              <DeleteButton
                action={deleteAudit.bind(null, audit.id)}
                label="Excluir"
                confirmMessage="Excluir esta auditoria, seu checklist e constatações?"
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Resumo / cabeçalho */}
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  AUDIT_TYPE_COLORS[audit.type as AuditType]
                }`}
              >
                {typeLabel}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  AUDIT_STATUS_COLORS[audit.status as AuditStatus]
                }`}
              >
                {AUDIT_STATUS_LABELS[audit.status as AuditStatus] ?? audit.status}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Cliente">
                <Link
                  href={`/clientes/${audit.project.client.id}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {audit.project.client.name}
                </Link>
              </Field>
              <Field label="Normas">{norms.join(", ") || "—"}</Field>
              <Field label="Data planejada">{formatDate(audit.plannedDate)}</Field>
              <Field label="Data de execução">{formatDate(audit.executedDate)}</Field>
              <Field label="Auditor líder">{audit.leadAuditor || "—"}</Field>
              <Field
                label={audit.type === "EXTERNA" ? "Organismo / auditor" : "Equipe"}
              >
                {(audit.type === "EXTERNA" ? audit.auditedOrg : audit.auditTeam) || "—"}
              </Field>
              <Field label="Projeto">{audit.project.type}</Field>
              <Field label="Avaliados">
                {evaluated} de {checklistItems.length}
              </Field>
            </div>
            {(audit.scope || audit.objective || audit.criteria) && (
              <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm text-gray-600">
                {audit.objective && (
                  <p>
                    <span className="font-medium text-gray-700">Objetivo:</span>{" "}
                    {audit.objective}
                  </p>
                )}
                {audit.scope && (
                  <p>
                    <span className="font-medium text-gray-700">Escopo:</span>{" "}
                    {audit.scope}
                  </p>
                )}
                {audit.criteria && (
                  <p>
                    <span className="font-medium text-gray-700">Critérios:</span>{" "}
                    {audit.criteria}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Checklist */}
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                Checklist de requisitos
              </h3>
              <span className="text-sm text-gray-400">
                {checklistItems.length} requisito(s)
              </span>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              {Object.entries(counts)
                .filter(([r]) => r !== "NAO_AVALIADO")
                .map(([r, n]) => (
                  <span
                    key={r}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-600"
                  >
                    {AUDIT_ITEM_RESULT_LABELS[r as AuditItemResult] ?? r}: {n}
                  </span>
                ))}
            </div>
            <div className="divide-y divide-gray-100">
              {checklistItems.map((it) => (
                <AuditChecklistItem
                  key={it.id}
                  item={it}
                  action={updateAuditItem.bind(null, audit.id, it.id)}
                  readOnly={!canAudits}
                />
              ))}
            </div>
          </Card>

          {/* Constatações */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Constatações</h3>
              <span className="text-sm text-gray-400">
                {audit.findings.length} no total · {ncCount} NC
              </span>
            </div>

            <div className="mb-4 space-y-3">
              {audit.findings.length === 0 && (
                <p className="text-sm text-gray-400">
                  Nenhuma constatação registrada.
                </p>
              )}
              {audit.findings.map((f) => (
                <div key={f.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        FINDING_TYPE_COLORS[f.type as FindingType]
                      }`}
                    >
                      {FINDING_TYPE_LABELS[f.type as FindingType] ?? f.type}
                    </span>
                    {f.requirementCode && (
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        Requisito {f.requirementCode}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        FINDING_STATUS_COLORS[f.status as FindingStatus]
                      }`}
                    >
                      {FINDING_STATUS_LABELS[f.status as FindingStatus] ?? f.status}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {f.responsible ? `${f.responsible} · ` : ""}
                      {f.dueDate ? `prazo ${formatDate(f.dueDate)}` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{f.description}</p>
                  {f.evidence && (
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Evidência:</span> {f.evidence}
                    </p>
                  )}
                  {f.correctiveAction && (
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Ação corretiva:</span>{" "}
                      {f.correctiveAction}
                    </p>
                  )}
                  {canAudits && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {f.status !== "EM_TRATAMENTO" && (
                      <AuditActionButton
                        action={setFindingStatus.bind(null, audit.id, f.id, "EM_TRATAMENTO")}
                        label="Em tratamento"
                        size="sm"
                        variant="ghost"
                      />
                    )}
                    {f.status !== "VERIFICACAO" && (
                      <AuditActionButton
                        action={setFindingStatus.bind(null, audit.id, f.id, "VERIFICACAO")}
                        label="Em verificação"
                        size="sm"
                        variant="ghost"
                      />
                    )}
                    {f.status !== "ENCERRADA" && (
                      <AuditActionButton
                        action={setFindingStatus.bind(null, audit.id, f.id, "ENCERRADA")}
                        label="Encerrar"
                        size="sm"
                        variant="ghost"
                      />
                    )}
                    <span className="ml-auto">
                      <DeleteButton
                        action={deleteFinding.bind(null, audit.id, f.id)}
                        label="Excluir"
                        confirmMessage="Excluir esta constatação?"
                      />
                    </span>
                  </div>
                  )}
                </div>
              ))}
            </div>

            {canAudits && (
              <FindingForm
                action={createFinding.bind(null, audit.id)}
                requirements={requirementOptions}
              />
            )}
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {canAudits && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Andamento da auditoria
            </h3>
            <div className="space-y-2">
              {audit.status === "PLANEJADA" && (
                <AuditActionButton
                  action={setAuditStatus.bind(null, audit.id, "EM_ANDAMENTO")}
                  label="Iniciar auditoria"
                  variant="primary"
                />
              )}
              {audit.status === "EM_ANDAMENTO" && (
                <AuditActionButton
                  action={setAuditStatus.bind(null, audit.id, "CONCLUIDA")}
                  label="Concluir auditoria"
                  variant="primary"
                  confirmMessage="Concluir a auditoria? A data de execução será registrada."
                />
              )}
              {audit.status === "CONCLUIDA" && (
                <AuditActionButton
                  action={setAuditStatus.bind(null, audit.id, "EM_ANDAMENTO")}
                  label="Reabrir auditoria"
                  variant="secondary"
                />
              )}
              {audit.status !== "CANCELADA" && audit.status !== "CONCLUIDA" && (
                <AuditActionButton
                  action={setAuditStatus.bind(null, audit.id, "CANCELADA")}
                  label="Cancelar auditoria"
                  variant="secondary"
                  confirmMessage="Cancelar esta auditoria?"
                />
              )}
              {audit.status === "CANCELADA" && (
                <AuditActionButton
                  action={setAuditStatus.bind(null, audit.id, "PLANEJADA")}
                  label="Reativar (planejada)"
                  variant="secondary"
                />
              )}
            </div>
          </Card>
          )}

          <Card>
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Conclusão / parecer
            </h3>
            {canAudits ? (
              <ConclusionForm
                action={updateConclusion.bind(null, audit.id)}
                defaultValue={audit.conclusion ?? ""}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-gray-600">
                {audit.conclusion || "Sem conclusão registrada."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  );
}
