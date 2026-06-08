import { generateGenericDocument } from "../src/lib/doc-generator";
import { htmlToDocxBuffer } from "../src/lib/docx-export";

// Requisito sem template específico (5.1 Liderança), projeto SGI.
const ctx = {
  cliente: {
    nome: "Empresa ABC",
    cnpj: "12.345.678/0001-90",
    segmento: "Indústria",
    escopo: "Produção de componentes",
    responsavel: "Maria Silva",
  },
  projeto: { tipo: "SGI 9001 + 14001 + 45001" },
  normas: ["ISO 9001", "ISO 14001", "ISO 45001"],
  requisito: {
    codigo: "5.1",
    titulo: "Liderança e comprometimento",
    descricao:
      "A Alta Direção deve demonstrar liderança e comprometimento com relação ao sistema de gestão.",
    orientacao:
      "Evidencie a atuação da liderança: definição de política e objetivos, provisão de recursos e promoção da melhoria.",
    perguntaSugerida:
      "Como a Alta Direção demonstra, na prática, seu comprometimento com o sistema de gestão?",
    evidenciasEsperadas: ["Ata de análise crítica", "Comunicados da liderança"],
  },
};

async function main() {
  const { title, contentHtml } = generateGenericDocument(ctx);

  const checks: [string, boolean][] = [
    ["título cita requisito", title.includes("5.1") && title.includes("Empresa ABC")],
    ["cita o requisito no corpo", contentHtml.includes("5.1 — Liderança e comprometimento")],
    ["observa ISO 14001 (perspectiva ambiental)", contentHtml.includes("ambiental")],
    ["observa ISO 45001 (perspectiva SSO)", contentHtml.includes("saúde ocupacional") || contentHtml.includes("perigos")],
    ["nota de SGI", contentHtml.includes("Sistema de Gestão Integrado")],
    ["traz contexto do requisito", contentHtml.includes("Alta Direção deve demonstrar")],
    ["traz evidências esperadas", contentHtml.includes("Ata de análise crítica")],
    ["sem placeholder pendente", !contentHtml.includes("{{")],
  ];

  for (const [label, ok] of checks) {
    if (!ok) throw new Error(`FALHOU: ${label}`);
    console.log(`✓ ${label}`);
  }

  const buf = await htmlToDocxBuffer(title, contentHtml);
  if (buf.subarray(0, 2).toString("ascii") !== "PK") throw new Error("DOCX inválido");
  console.log(`✓ DOCX gerado (${buf.length} bytes)`);
  console.log("✅ Documento genérico por requisito OK");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
