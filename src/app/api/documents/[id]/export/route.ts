import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser } from "@/lib/session";
import { htmlToDocxBuffer } from "@/lib/docx-export";
import { htmlToPdfBuffer } from "@/lib/pdf-export";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const doc = await prisma.generatedDocument.findFirst({
    where: {
      id,
      projectRequirement: {
        project: { client: await clientWhereForUser(session.user.id) },
      },
    },
  });
  if (!doc) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "docx";
  const safeName =
    doc.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().slice(0, 80) || "documento";

  // Marca como exportado (não bloqueia o download em caso de falha).
  prisma.generatedDocument
    .update({ where: { id }, data: { status: "EXPORTADO" } })
    .catch(() => undefined);

  if (format === "pdf") {
    const buffer = await htmlToPdfBuffer(doc.title, doc.contentHtml);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.pdf"`,
      },
    });
  }

  const buffer = await htmlToDocxBuffer(doc.title, doc.contentHtml);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.docx"`,
    },
  });
}
