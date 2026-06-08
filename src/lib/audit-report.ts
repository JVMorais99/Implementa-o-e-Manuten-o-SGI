// Monta o HTML do relatório de auditoria (mesmo conjunto de tags controladas dos
// demais documentos), reutilizável pelos exportadores DOCX e PDF.

import {
  AUDIT_TYPE_LABELS,
  AUDIT_STATUS_LABELS,
  AUDIT_ITEM_RESULT_LABELS,
  FINDING_TYPE_LABELS,
  FINDING_STATUS_LABELS,
  type AuditType,
  type AuditStatus,
  type AuditItemResult,
  type FindingType,
  type FindingStatus,
} from "./enums";

function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function brDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface AuditReportData {
  title: string;
  type: string;
  status: string;
  clientName: string;
  norms: string[];
  projectType: string;
  leadAuditor?: string | null;
  auditTeam?: string | null;
  auditedOrg?: string | null;
  scope?: string | null;
  objective?: string | null;
  criteria?: string | null;
  plannedDate?: Date | string | null;
  executedDate?: Date | string | null;
  conclusion?: string | null;
  items: {
    code: string;
    title: string;
    norms: string[];
    result: string;
    notes?: string | null;
    evidenceSampled?: string | null;
  }[];
  findings: {
    type: string;
    requirementCode?: string | null;
    description: string;
    evidence?: string | null;
    correction?: string | null;
    rootCause?: string | null;
    correctiveAction?: string | null;
    responsible?: string | null;
    dueDate?: Date | string | null;
    status: string;
  }[];
}

export function buildAuditReportHtml(a: AuditReportData): {
  title: string;
  contentHtml: string;
} {
  const typeLabel = AUDIT_TYPE_LABELS[a.type as AuditType] ?? a.type;
  const statusLabel = AUDIT_STATUS_LABELS[a.status as AuditStatus] ?? a.status;
  const today = new Date().toLocaleDateString("pt-BR");

  // Resumo dos resultados do checklist.
  const counts = a.items.reduce<Record<string, number>>((acc, it) => {
    acc[it.result] = (acc[it.result] ?? 0) + 1;
    return acc;
  }, {});
  const resumoRows = Object.entries(counts)
    .map(
      ([result, n]) =>
        `<tr><td>${esc(
          AUDIT_ITEM_RESULT_LABELS[result as AuditItemResult] ?? result
        )}</td><td>${n}</td></tr>`
    )
    .join("");

  const evaluated = a.items.filter((i) => i.result !== "NAO_AVALIADO");
  const checklistRows = evaluated
    .map(
      (i) =>
        `<tr><td>${esc(i.code)}</td><td>${esc(i.title)}</td><td>${esc(
          AUDIT_ITEM_RESULT_LABELS[i.result as AuditItemResult] ?? i.result
        )}</td><td>${esc(i.evidenceSampled || i.notes || "")}</td></tr>`
    )
    .join("");

  const findingsSections = a.findings.length
    ? a.findings
        .map((f, idx) => {
          const ft = FINDING_TYPE_LABELS[f.type as FindingType] ?? f.type;
          const fs = FINDING_STATUS_LABELS[f.status as FindingStatus] ?? f.status;
          const reqStr = f.requirementCode ? ` — Requisito ${esc(f.requirementCode)}` : "";
          return `
<h3>${idx + 1}. ${esc(ft)}${reqStr}</h3>
<p><strong>Constatação:</strong> ${esc(f.description)}</p>
${f.evidence ? `<p><strong>Evidência objetiva:</strong> ${esc(f.evidence)}</p>` : ""}
${f.correction ? `<p><strong>Correção imediata:</strong> ${esc(f.correction)}</p>` : ""}
${f.rootCause ? `<p><strong>Análise de causa-raiz:</strong> ${esc(f.rootCause)}</p>` : ""}
${f.correctiveAction ? `<p><strong>Ação corretiva:</strong> ${esc(f.correctiveAction)}</p>` : ""}
<p><strong>Responsável:</strong> ${esc(f.responsible || "—")} · <strong>Prazo:</strong> ${brDate(
            f.dueDate
          )} · <strong>Situação:</strong> ${esc(fs)}</p>`;
        })
        .join("")
    : "<p>Nenhuma constatação registrada.</p>";

  const contentHtml = `
<h1>Relatório de Auditoria</h1>
<table>
  <tr><th>Título</th><td>${esc(a.title)}</td><th>Tipo</th><td>${esc(typeLabel)}</td></tr>
  <tr><th>Cliente</th><td>${esc(a.clientName)}</td><th>Situação</th><td>${esc(
    statusLabel
  )}</td></tr>
  <tr><th>Normas / critérios</th><td>${esc(a.norms.join(", ") || "—")}</td><th>Projeto</th><td>${esc(
    a.projectType
  )}</td></tr>
  <tr><th>Data planejada</th><td>${brDate(a.plannedDate)}</td><th>Data de execução</th><td>${brDate(
    a.executedDate
  )}</td></tr>
  <tr><th>Auditor líder</th><td>${esc(a.leadAuditor || "—")}</td><th>${
    a.type === "EXTERNA" ? "Organismo / auditor externo" : "Equipe auditora"
  }</th><td>${esc((a.type === "EXTERNA" ? a.auditedOrg : a.auditTeam) || "—")}</td></tr>
  <tr><th>Emissão do relatório</th><td>${esc(today)}</td><th>Requisitos avaliados</th><td>${
    evaluated.length
  } de ${a.items.length}</td></tr>
</table>

<h2>1. Objetivo e Escopo</h2>
<p><strong>Objetivo:</strong> ${esc(a.objective || "—")}</p>
<p><strong>Escopo:</strong> ${esc(a.scope || "—")}</p>
<p><strong>Critérios:</strong> ${esc(a.criteria || a.norms.join(", ") || "—")}</p>

<h2>2. Resumo dos Resultados</h2>
<table>
  <tr><th>Resultado</th><th>Quantidade</th></tr>
  ${resumoRows || "<tr><td>Sem itens avaliados</td><td>0</td></tr>"}
</table>

<h2>3. Verificação por Requisito</h2>
${
  checklistRows
    ? `<table>
  <tr><th>Requisito</th><th>Descrição</th><th>Resultado</th><th>Evidências / anotações</th></tr>
  ${checklistRows}
</table>`
    : "<p>Nenhum requisito avaliado até o momento.</p>"
}

<h2>4. Constatações</h2>
${findingsSections}

<h2>5. Conclusão</h2>
<p>${esc(a.conclusion || "Conclusão a ser registrada ao encerramento da auditoria.")}</p>

<h2>6. Aprovação</h2>
<table>
  <tr><th>Auditor líder</th><th>Representante da organização</th><th>Data</th></tr>
  <tr><td>${esc(a.leadAuditor || "")}</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>`;

  const title = `Relatório de Auditoria — ${a.title} — ${a.clientName}`;
  return { title, contentHtml: contentHtml.trim() };
}
