import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { htmlToDocxBuffer } from "../src/lib/docx-export";
import { saveBufferToUploads } from "../src/lib/storage";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const iso = await prisma.isoStandard.findUniqueOrThrow({
    where: { code: "ISO 9001" },
  });

  await prisma.client.deleteMany({
    where: { userId: user.id, name: "Preview Test" },
  });

  const client = await prisma.client.create({
    data: { userId: user.id, name: "Preview Test" },
  });
  const reqs = await prisma.isoRequirement.findMany({
    where: { standardId: iso.id },
  });
  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "Implantação ISO 9001",
      standards: { create: [{ standardId: iso.id }] },
      requirements: {
        create: reqs.map((r) => ({
          standardId: iso.id,
          requirementId: r.id,
          status: "NAO_INICIADO",
        })),
      },
    },
  });
  const pr = await prisma.projectRequirement.findFirstOrThrow({
    where: { projectId: project.id, requirement: { code: "4.1" } },
  });

  // DOCX de teste
  const docxBuf = await htmlToDocxBuffer(
    "Teste",
    "<h1>Matriz SWOT de Teste</h1><p>Conteúdo de <strong>exemplo</strong> para preview.</p>"
  );
  const docxName = await saveBufferToUploads(docxBuf, "swot-teste.docx");
  const evDocx = await prisma.evidence.create({
    data: {
      projectRequirementId: pr.id,
      title: "SWOT (docx)",
      type: "Matriz SWOT",
      fileName: "swot-teste.docx",
      fileUrl: docxName,
      status: "RECEBIDA",
    },
  });

  // XLSX de teste
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Indicadores");
  ws.addRow(["Indicador", "Meta", "Resultado"]);
  ws.addRow(["Satisfação do cliente", "90%", "93%"]);
  ws.addRow(["Não conformidades", "< 5", "3"]);
  const xlsxBuf = Buffer.from(await wb.xlsx.writeBuffer());
  const xlsxName = await saveBufferToUploads(xlsxBuf, "indicadores.xlsx");
  const evXlsx = await prisma.evidence.create({
    data: {
      projectRequirementId: pr.id,
      title: "Indicadores (xlsx)",
      type: "Planilha",
      fileName: "indicadores.xlsx",
      fileUrl: xlsxName,
      status: "RECEBIDA",
    },
  });

  console.log("EV_DOCX=" + evDocx.id);
  console.log("EV_XLSX=" + evXlsx.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
