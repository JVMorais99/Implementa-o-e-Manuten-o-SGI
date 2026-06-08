import { generateDocument } from "../src/lib/doc-generator";
import { htmlToDocxBuffer } from "../src/lib/docx-export";
import { DOCUMENT_TEMPLATES } from "../prisma/data/templates";

async function main() {
  const swot = DOCUMENT_TEMPLATES.find((t) => t.name === "Matriz SWOT")!;
  const proc = DOCUMENT_TEMPLATES.find((t) => t.name === "Procedimento de Comunicação")!;

  const ctx = {
    cliente: {
      nome: "Empresa ABC Ltda.",
      cnpj: "12.345.678/0001-90",
      segmento: "Indústria metalúrgica",
      escopo: "Fabricação de componentes metálicos",
      responsavel: "Maria Silva",
    },
    projeto: { tipo: "Implantação ISO 9001" },
    normas: ["ISO 9001", "ISO 14001", "ISO 45001"],
    requisito: { codigo: "7.4", titulo: "Comunicação" },
  };

  for (const tpl of [swot, proc]) {
    const { title, contentHtml } = generateDocument(tpl, ctx);
    // valida que placeholders foram substituídos
    if (contentHtml.includes("{{")) {
      throw new Error(`Placeholder não substituído em ${tpl.name}`);
    }
    if (!contentHtml.includes("Empresa ABC")) {
      throw new Error(`Contexto do cliente não aplicado em ${tpl.name}`);
    }
    const buffer = await htmlToDocxBuffer(title, contentHtml);
    const header = buffer.subarray(0, 2).toString("ascii");
    if (header !== "PK") {
      throw new Error(`DOCX inválido para ${tpl.name} (header=${header})`);
    }
    console.log(
      `✓ ${tpl.name}: título="${title}" | html=${contentHtml.length} chars | docx=${buffer.length} bytes (zip OK)`
    );
  }

  console.log("✅ Geração de documento + exportação DOCX OK");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
