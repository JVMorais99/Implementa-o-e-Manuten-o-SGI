// Gera o conteúdo de um documento a partir de um template e do contexto
// (cliente, normas do projeto, requisito). Substitui placeholders {{chave}}.

export interface DocContext {
  cliente: {
    nome: string;
    cnpj?: string | null;
    segmento?: string | null;
    escopo?: string | null;
    responsavel?: string | null;
  };
  projeto: { tipo: string };
  normas: string[]; // códigos, ex.: ["ISO 9001", "ISO 14001"]
  requisito: {
    codigo: string;
    titulo: string;
    // Detalhes opcionais usados pela geração genérica (documento por requisito).
    descricao?: string;
    orientacao?: string;
    perguntaSugerida?: string;
    evidenciasEsperadas?: string[];
  };
}

export interface TemplateLike {
  name: string;
  documentType: string;
  contentTemplate: string;
}

function todayBR(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Código simples do documento, ex.: "PROC-7.4-001" / "MATRIZ-4.1".
function buildDocCode(documentType: string, reqCode: string): string {
  const prefix = documentType.slice(0, 5).toUpperCase();
  return `${prefix}-${reqCode}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Processa blocos condicionais por norma, permitindo documentos integrados (SGI):
//   {{#norma:ISO 14001}} ...conteúdo só se a norma estiver no projeto... {{/norma}}
//   {{#sgi}} ...conteúdo só quando há mais de uma norma (sistema integrado)... {{/sgi}}
function processConditionalBlocks(template: string, normas: string[]): string {
  let result = template;

  // Blocos por norma específica
  result = result.replace(
    /\{\{#norma:([^}]+)\}\}([\s\S]*?)\{\{\/norma\}\}/g,
    (_m, code: string, inner: string) =>
      normas.includes(code.trim()) ? inner : ""
  );

  // Bloco de sistema integrado (mais de uma norma)
  result = result.replace(
    /\{\{#sgi\}\}([\s\S]*?)\{\{\/sgi\}\}/g,
    (_m, inner: string) => (normas.length > 1 ? inner : "")
  );

  return result;
}

export function generateDocument(
  template: TemplateLike,
  context: DocContext
): { title: string; contentHtml: string } {
  const normasStr = context.normas.join(", ") || "—";
  const replacements: Record<string, string> = {
    "cliente.nome": context.cliente.nome,
    "cliente.cnpj": context.cliente.cnpj || "—",
    "cliente.segmento": context.cliente.segmento || "—",
    "cliente.escopo": context.cliente.escopo || "(escopo a definir)",
    "cliente.responsavel": context.cliente.responsavel || "—",
    "projeto.tipo": context.projeto.tipo,
    normas: normasStr,
    "requisito.codigo": context.requisito.codigo,
    "requisito.titulo": context.requisito.titulo,
    data: todayBR(),
    codigoDocumento: buildDocCode(template.documentType, context.requisito.codigo),
  };

  // 1) Resolve blocos condicionais por norma; 2) substitui placeholders simples.
  const withBlocks = processConditionalBlocks(
    template.contentTemplate,
    context.normas
  );
  const contentHtml = withBlocks.replace(
    /\{\{\s*([\w.]+)\s*\}\}/g,
    (_match, key: string) => {
      const value = replacements[key];
      return value !== undefined ? escapeHtml(value) : "";
    }
  );

  const title = `${template.name} — ${context.cliente.nome}`;
  return { title, contentHtml: contentHtml.trim() };
}

// Perspectiva de cada norma, usada para tornar o documento genérico ciente
// das normas do cliente (qualidade / ambiental / SSO).
const NORM_PERSPECTIVE: Record<string, string> = {
  "ISO 9001":
    "sob a ótica da gestão da qualidade, visando ao atendimento dos requisitos e ao aumento da satisfação dos clientes",
  "ISO 14001":
    "sob a ótica da gestão ambiental, considerando os aspectos e impactos ambientais significativos e os requisitos legais aplicáveis",
  "ISO 45001":
    "sob a ótica da segurança e saúde ocupacional, considerando os perigos, a avaliação de riscos e a consulta e participação dos trabalhadores",
  "ISO 27001":
    "sob a ótica da segurança da informação, considerando a confidencialidade, a integridade e a disponibilidade da informação",
  "ISO 37001":
    "sob a ótica do sistema de gestão antissuborno e dos controles de compliance aplicáveis",
  "ISO 37301":
    "sob a ótica do sistema de gestão de compliance e das obrigações de conformidade aplicáveis",
};

// Geração GENÉRICA: um documento profissional, específico do requisito e ciente
// das normas do projeto. Disponível para QUALQUER requisito (inclusive os que
// não possuem template específico). Estrutura discursiva conforme o briefing.
export function generateGenericDocument(context: DocContext): {
  title: string;
  contentHtml: string;
} {
  const c = context.cliente;
  const r = context.requisito;
  const normas = context.normas;
  const normasStr = normas.join(", ") || "—";
  const data = todayBR();
  const docCode = `DOC-${r.codigo}`;

  const perspectivas = normas
    .map((n) => NORM_PERSPECTIVE[n])
    .filter(Boolean)
    .join("; ");
  const perspectivaTexto = perspectivas
    ? ` Este documento é elaborado ${perspectivas}.`
    : "";

  const header = `
<table>
  <tr><th>Documento</th><td>${escapeHtml(docCode)}</td><th>Revisão</th><td>00</td></tr>
  <tr><th>Cliente</th><td>${escapeHtml(c.nome)}</td><th>Data</th><td>${data}</td></tr>
  <tr><th>Normas de referência</th><td>${escapeHtml(normasStr)}</td><th>Requisito</th><td>${escapeHtml(
    `${r.codigo} — ${r.titulo}`
  )}</td></tr>
</table>`;

  const referencias = normas.length
    ? `<ul>${normas
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join("")}<li>Requisito ${escapeHtml(`${r.codigo} — ${r.titulo}`)}</li></ul>`
    : `<p>Requisito ${escapeHtml(`${r.codigo} — ${r.titulo}`)}.</p>`;

  const contexto = r.descricao
    ? `<h2>4. Contexto do Requisito</h2><p>${escapeHtml(r.descricao)}</p>`
    : "";

  const diretrizes = r.orientacao
    ? `<h2>5. Diretrizes e Orientações</h2><p>${escapeHtml(r.orientacao)}</p>`
    : "";

  const pergunta = r.perguntaSugerida
    ? `<h2>6. Questão de Verificação</h2><p>${escapeHtml(r.perguntaSugerida)}</p>`
    : "";

  const evidencias =
    r.evidenciasEsperadas && r.evidenciasEsperadas.length
      ? `<h2>7. Evidências Esperadas</h2>
<table>
  <tr><th>Evidência</th><th>Situação atual</th><th>Responsável</th><th>Prazo</th></tr>
  ${r.evidenciasEsperadas
    .map(
      (e) =>
        `<tr><td>${escapeHtml(e)}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`
    )
    .join("")}
</table>`
      : "";

  const sgiNote =
    normas.length > 1
      ? `<p>Por se tratar de um <strong>Sistema de Gestão Integrado (SGI)</strong>, o atendimento a este requisito deve contemplar, de forma harmonizada, as exigências das normas ${escapeHtml(
          normasStr
        )}.</p>`
      : "";

  const contentHtml = `
<h1>${escapeHtml(r.titulo)}</h1>
${header}
<h2>1. Objetivo</h2>
<p>Estabelecer as diretrizes, os controles e os registros necessários ao atendimento do requisito <strong>${escapeHtml(
    `${r.codigo} — ${r.titulo}`
  )}</strong> da(s) norma(s) <strong>${escapeHtml(
    normasStr
  )}</strong> pela organização <strong>${escapeHtml(
    c.nome
  )}</strong>.${perspectivaTexto}</p>
<h2>2. Campo de Aplicação</h2>
<p>Aplica-se ao escopo do sistema de gestão da organização${
    c.escopo ? `: ${escapeHtml(c.escopo)}` : "."
  }${c.segmento ? ` Segmento de atuação: ${escapeHtml(c.segmento)}.` : ""}</p>
${sgiNote}
<h2>3. Referências Normativas</h2>
${referencias}
${contexto}
${diretrizes}
${pergunta}
${evidencias}
<h2>8. Registros Gerados</h2>
<p>Relacionar abaixo os registros e evidências que comprovam o atendimento a este requisito.</p>
<table>
  <tr><th>Registro / Evidência</th><th>Local de arquivamento</th><th>Retenção</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
<h2>9. Controle de Revisão</h2>
<table>
  <tr><th>Revisão</th><th>Data</th><th>Descrição da alteração</th><th>Responsável</th></tr>
  <tr><td>00</td><td>${data}</td><td>Emissão inicial</td><td>${escapeHtml(
    c.responsavel || "—"
  )}</td></tr>
</table>
<h2>10. Aprovação</h2>
<table>
  <tr><th>Elaborado por</th><th>Analisado por</th><th>Aprovado por</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>`;

  const title = `Documento de Atendimento — ${r.codigo} ${r.titulo} — ${c.nome}`;
  return { title, contentHtml: contentHtml.trim() };
}
