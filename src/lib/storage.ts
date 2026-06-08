import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { blobEnabled } from "@/lib/features";

// Armazenamento de arquivos de evidências/documentos com dois drivers e seleção
// automática por ambiente:
//   - Vercel Blob, quando BLOB_READ_WRITE_TOKEN está configurado (produção
//     serverless). Nesse caso `storedName` é a URL do blob.
//   - Disco local (storage/uploads), no fallback de desenvolvimento. `storedName`
//     é o nome do arquivo gravado.
// As três funções abaixo mantêm assinatura estável; os consumidores
// (upload de evidência, rota de download, export de documentos) não mudam. O
// controle de acesso continua nas rotas (o conteúdo é lido pelo servidor, nunca
// expondo a URL direta sem checagem de permissão).

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

function isRemote(storedName: string): boolean {
  return /^https?:\/\//i.test(storedName);
}

async function putBlob(key: string, buffer: Buffer): Promise<string> {
  const { put } = await import("@vercel/blob");
  const { url } = await put(`uploads/${key}`, buffer, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });
  return url;
}

export async function saveUploadedFile(file: File): Promise<{
  storedName: string;
  originalName: string;
  size: number;
}> {
  const originalName = sanitize(file.name || "arquivo");
  const key = `${randomUUID()}-${originalName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (blobEnabled()) {
    const url = await putBlob(key, buffer);
    return { storedName: url, originalName, size: buffer.length };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { storedName: key, originalName, size: buffer.length };
}

export async function readStoredFile(storedName: string): Promise<Buffer> {
  if (isRemote(storedName)) {
    const res = await fetch(storedName);
    if (!res.ok) throw new Error(`Falha ao ler arquivo remoto (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  const safe = path.basename(storedName); // evita path traversal
  return readFile(path.join(UPLOAD_DIR, safe));
}

// Também usado pelos documentos exportados (.docx/.pdf).
export async function saveBufferToUploads(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const key = `${randomUUID()}-${sanitize(fileName)}`;

  if (blobEnabled()) {
    return putBlob(key, buffer);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return key;
}
