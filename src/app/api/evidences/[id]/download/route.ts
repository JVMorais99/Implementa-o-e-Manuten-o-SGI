import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";

// Mapa de extensão -> content-type. Tipos que o navegador exibe inline
// (PDF, imagens, texto) ganham Content-Disposition: inline quando ?view=1.
const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

// Tipos que fazem sentido abrir inline no navegador.
const INLINE_VIEWABLE = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "text/plain; charset=utf-8",
  "text/csv; charset=utf-8",
  "application/json",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const evidence = await prisma.evidence.findFirst({
    where: {
      id,
      projectRequirement: {
        project: { client: await clientWhereForUser(session.user.id) },
      },
    },
  });
  if (!evidence) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const buffer = await readStoredFile(evidence.fileUrl);
    const ext = (evidence.fileName.split(".").pop() ?? "").toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    const wantsView = req.nextUrl.searchParams.get("view") === "1";
    const inline = wantsView && INLINE_VIEWABLE.has(contentType);
    const disposition = inline ? "inline" : "attachment";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(
          evidence.fileName
        )}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Arquivo não disponível" },
      { status: 410 }
    );
  }
}
