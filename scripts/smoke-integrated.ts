import { generateDocument } from "../src/lib/doc-generator";
import { DOCUMENT_TEMPLATES } from "../prisma/data/templates";

const comunic = DOCUMENT_TEMPLATES.find(
  (t) => t.name === "Procedimento de Comunicação"
)!;

const baseCtx = {
  cliente: { nome: "Empresa ABC", cnpj: null, segmento: "Indústria", escopo: "Produção", responsavel: "Maria" },
  projeto: { tipo: "Projeto" },
  requisito: { codigo: "7.4", titulo: "Comunicação" },
};

const so9001 = generateDocument(comunic, { ...baseCtx, normas: ["ISO 9001"] });
const sgi = generateDocument(comunic, {
  ...baseCtx,
  normas: ["ISO 9001", "ISO 14001", "ISO 45001"],
});

function check(label: string, html: string, expectPresent: string[], expectAbsent: string[]) {
  for (const s of expectPresent) {
    if (!html.includes(s)) throw new Error(`[${label}] esperava conter: "${s}"`);
  }
  for (const s of expectAbsent) {
    if (html.includes(s)) throw new Error(`[${label}] NÃO deveria conter: "${s}"`);
  }
  if (html.includes("{{")) throw new Error(`[${label}] placeholder não resolvido`);
  console.log(`✓ ${label} OK (${html.length} chars)`);
}

// Só ISO 9001: contém bloco de qualidade, não contém ambiental/SST
check(
  "Só ISO 9001",
  so9001.contentHtml,
  ["Qualidade:"],
  ["Meio ambiente:", "Saúde e segurança ocupacional:"]
);

// SGI: contém os três blocos
check(
  "SGI 9001+14001+45001",
  sgi.contentHtml,
  ["Qualidade:", "Meio ambiente:", "Saúde e segurança ocupacional:", "investigações"],
  []
);

console.log("✅ Documentos integrados multi-norma OK");
