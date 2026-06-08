import mammoth from "mammoth";
import ExcelJS from "exceljs";

export type PreviewKind =
  | "pdf"
  | "image"
  | "docx"
  | "sheet"
  | "text"
  | "unsupported";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]);
const TEXT_EXT = new Set(["txt", "csv", "json", "log", "md"]);

export function fileExt(fileName: string): string {
  return (fileName.split(".").pop() ?? "").toLowerCase();
}

export function previewKind(fileName: string): PreviewKind {
  const ext = fileExt(fileName);
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "docx") return "docx";
  if (ext === "xlsx" || ext === "xls") return "sheet";
  if (TEXT_EXT.has(ext)) return "text";
  return "unsupported";
}

// Extensões que conseguimos exibir online (inline ou convertendo para HTML).
export function isPreviewable(fileName: string): boolean {
  return previewKind(fileName) !== "unsupported";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// DOCX -> HTML usando mammoth.
export async function docxToHtml(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.convertToHtml({ buffer });
  return value || "<p>(documento vazio)</p>";
}

// XLSX/XLS -> HTML (uma tabela por planilha). Limita tamanho para não estourar.
export async function sheetToHtml(buffer: Buffer): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  await wb.xlsx.load(arrayBuffer);

  const MAX_ROWS = 300;
  const MAX_COLS = 40;
  const parts: string[] = [];

  wb.eachSheet((worksheet) => {
    const rowCount = Math.min(worksheet.rowCount, MAX_ROWS);
    const colCount = Math.min(worksheet.columnCount, MAX_COLS);
    if (rowCount === 0 || colCount === 0) return;

    parts.push(`<h2>${escapeHtml(worksheet.name)}</h2>`);
    const rows: string[] = [];
    for (let r = 1; r <= rowCount; r++) {
      const cells: string[] = [];
      for (let c = 1; c <= colCount; c++) {
        const cell = worksheet.getCell(r, c);
        const text = escapeHtml(cell.text ?? "");
        const tag = r === 1 ? "th" : "td";
        cells.push(`<${tag}>${text}</${tag}>`);
      }
      rows.push(`<tr>${cells.join("")}</tr>`);
    }
    parts.push(`<table>${rows.join("")}</table>`);

    if (worksheet.rowCount > MAX_ROWS) {
      parts.push(
        `<p><em>Exibindo as primeiras ${MAX_ROWS} linhas de ${worksheet.rowCount}.</em></p>`
      );
    }
  });

  return parts.join("\n") || "<p>(planilha vazia)</p>";
}

export function textToHtml(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  return `<pre style="white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,monospace;font-size:13px;">${escapeHtml(
    text
  )}</pre>`;
}
