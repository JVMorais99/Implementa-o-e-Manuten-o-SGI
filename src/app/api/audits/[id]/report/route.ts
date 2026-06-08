import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser } from "@/lib/session";
import { htmlToDocxBuffer } from "@/lib/docx-export";
import { htmlToPdfBuffer } from "@/lib/pdf-export";
import { buildAuditReportHtml, type AuditReportData } from "@/lib/audit-report";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const audit = await prisma.audit.findFirst({
    where: { id, project: { client: await clientWhereForUser(session.user.id) } },
    include: {
      project: {
        include: {
          client: { select: { name: true } },
          standards: { include: { standard: { select: { code: true } } } },
        },
      },
      items: {
        include: {
          projectRequirement: {
            include: { requirement: { select: { code: true, title: true, order: true } } },
          },
        },
      },
      findings: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!audit) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const norms = audit.project.standards.map((s) => s.standard.code);

  const data: AuditReportData = {
    title: audit.title,
    type: audit.type,
    status: audit.status,
    clientName: audit.project.client.name,
    norms,
    projectType: audit.project.type,
    leadAuditor: audit.leadAuditor,
    auditTeam: audit.auditTeam,
    auditedOrg: audit.auditedOrg,
    scope: audit.scope,
    objective: audit.objective,
    criteria: audit.criteria,
    plannedDate: audit.plannedDate,
    executedDate: audit.executedDate,
    conclusion: audit.conclusion,
    items: [...audit.items]
      .sort(
        (a, b) =>
          a.projectRequirement.requirement.order -
          b.projectRequirement.requirement.order
      )
      .map((it) => ({
        code: it.projectRequirement.requirement.code,
        title: it.projectRequirement.requirement.title,
        norms,
        result: it.result,
        notes: it.notes,
        evidenceSampled: it.evidenceSampled,
      })),
    findings: audit.findings.map((f) => ({
      type: f.type,
      requirementCode: f.requirementCode,
      description: f.description,
      evidence: f.evidence,
      correction: f.correction,
      rootCause: f.rootCause,
      correctiveAction: f.correctiveAction,
      responsible: f.responsible,
      dueDate: f.dueDate,
      status: f.status,
    })),
  };

  const { title, contentHtml } = buildAuditReportHtml(data);
  const format = req.nextUrl.searchParams.get("format") === "docx" ? "docx" : "pdf";
  const safeName =
    title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().slice(0, 80) || "relatorio-auditoria";

  if (format === "docx") {
    const buffer = await htmlToDocxBuffer(title, contentHtml);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.docx"`,
      },
    });
  }

  const buffer = await htmlToPdfBuffer(title, contentHtml);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.pdf"`,
    },
  });
}
