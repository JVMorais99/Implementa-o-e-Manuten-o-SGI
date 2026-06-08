// Smoke: gera um PDF a partir do HTML de um documento e valida o arquivo.
//   npx tsx scripts/smoke-pdf.ts

import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { generateGenericDocument } from "../src/lib/doc-generator";
import { htmlToPdfBuffer } from "../src/lib/pdf-export";
import { PDFDocument } from "pdf-lib";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const client = await prisma.client.findFirst({ orderBy: { createdAt: "asc" } });

  const { title, contentHtml } = generateGenericDocument({
    cliente: {
      nome: client?.name ?? "Empresa Exemplo",
      cnpj: client?.cnpj ?? "00.000.000/0001-00",
      segmento: client?.segment ?? "Indústria",
      escopo: client?.scope ?? "Escopo de exemplo",
      responsavel: client?.responsible ?? "Responsável",
    },
    projeto: { tipo: "Implantação SGI" },
    normas: ["ISO 9001", "ISO 14001", "ISO 45001"],
    requisito: {
      codigo: "4.1",
      titulo: "Compreensão da organização e do seu contexto",
      descricao:
        "A organização deve determinar as questões externas e internas relevantes para o seu propósito e direcionamento estratégico, repetidas várias vezes para gerar conteúdo longo o suficiente para forçar a paginação automática do documento PDF. ".repeat(
          12
        ),
      orientacao: "Levantar contexto, partes interessadas e riscos associados.",
      perguntaSugerida: "Como a organização identifica e monitora seu contexto?",
      evidenciasEsperadas: [
        "Análise SWOT",
        "Matriz de partes interessadas",
        "Levantamento de aspectos e impactos ambientais",
        "Identificação de perigos e avaliação de riscos de SSO",
      ],
    },
  });

  const buffer = await htmlToPdfBuffer(title, contentHtml);

  // Cabeçalho de arquivo PDF válido
  assert(buffer.subarray(0, 5).toString() === "%PDF-", "deve começar com %PDF-");
  assert(buffer.length > 1500, `PDF muito pequeno (${buffer.length} bytes)`);

  // Reabre com pdf-lib para confirmar integridade e contar páginas
  const reopened = await PDFDocument.load(buffer);
  const pages = reopened.getPageCount();
  assert(pages >= 2, `esperado documento multipágina, obtido ${pages} página(s)`);

  const out = "storage/smoke-output.pdf";
  writeFileSync(out, buffer);

  console.log("OK PDF:");
  console.log(`  tamanho: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`  páginas: ${pages}`);
  console.log(`  título: ${title}`);
  console.log(`  salvo em: ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
