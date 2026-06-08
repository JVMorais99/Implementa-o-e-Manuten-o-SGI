import mammoth from "mammoth";
import { readStoredFile } from "@/lib/storage";
import { fileExt, sheetToHtml } from "@/lib/evidence-preview";
import type { AiContentBlock } from "./client";

// Converte um arquivo de evidência armazenado em blocos de conteúdo para o modelo:
//   - imagens  -> bloco de imagem (visão)
//   - PDF      -> bloco de documento (o modelo lê o PDF nativamente)
//   - docx/xlsx/txt/... -> texto extraído
//   - não suportado -> nota textual com os metadados
// O texto é truncado para limitar o consumo de tokens.

const MAX_TEXT_CHARS = 60_000;
const IMAGE_MEDIA: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string): string {
  return text.length > MAX_TEXT_CHARS
    ? text.slice(0, MAX_TEXT_CHARS) + "\n[...conteúdo truncado...]"
    : text;
}

export async function evidenceToContent(
  fileUrl: string,
  fileName: string
): Promise<AiContentBlock[]> {
  const ext = fileExt(fileName);

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(fileUrl);
  } catch {
    return [
      {
        type: "text",
        text: `(Não foi possível ler o arquivo "${fileName}". Avalie com base apenas nos metadados.)`,
      },
    ];
  }

  if (IMAGE_MEDIA[ext]) {
    return [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: IMAGE_MEDIA[ext],
          data: buffer.toString("base64"),
        },
      },
    ];
  }

  if (ext === "pdf") {
    return [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
    ];
  }

  let text = "";
  try {
    if (ext === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (ext === "xlsx" || ext === "xls") {
      text = stripHtml(await sheetToHtml(buffer));
    } else {
      text = buffer.toString("utf-8");
    }
  } catch {
    text = "";
  }

  if (!text.trim()) {
    return [
      {
        type: "text",
        text: `(O arquivo "${fileName}" não pôde ser convertido em texto. Avalie com base nos metadados.)`,
      },
    ];
  }

  return [{ type: "text", text: `Conteúdo do arquivo "${fileName}":\n\n${truncate(text)}` }];
}
