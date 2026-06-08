import {
  saveBufferToUploads,
  readStoredFile,
} from "../src/lib/storage";
import { blobEnabled } from "../src/lib/features";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const content = "evidência de teste — " + Date.now();
  const buffer = Buffer.from(content, "utf-8");

  // Roundtrip: grava e lê de volta (Blob se configurado; disco no fallback).
  const storedName = await saveBufferToUploads(buffer, "smoke-storage.txt");
  const readBack = await readStoredFile(storedName);

  assert(readBack.toString("utf-8") === content, "conteúdo lido deve bater com o gravado");

  // No fallback local, storedName é um nome de arquivo (sem http); com Blob, é URL.
  if (!blobEnabled()) {
    assert(!/^https?:\/\//.test(storedName), "fallback local não deve gerar URL");
  }

  console.log("OK storage:");
  console.log("  blobEnabled():", blobEnabled());
  console.log("  storedName:", storedName);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
