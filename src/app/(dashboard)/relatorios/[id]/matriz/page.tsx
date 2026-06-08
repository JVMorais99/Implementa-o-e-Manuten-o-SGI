import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContext, clientWhere } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PrintButton } from "@/components/ui/PrintButton";
import {
  REQUIREMENT_STATUS_LABELS,
  EVIDENCE_STATUS_LABELS,
  type ProjectRequirementStatus,
  type EvidenceStatus,
} from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export default async function MatrizEvidenciasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getContext();

  const project = await prisma.isoProject.findFirst({
    where: { id, client: clientWhere(ctx) },
    include: {
      client: true,
      standards: { include: { standard: true } },
      requirements: {
        include: {
          requirement: true,
          standard: { select: { code: true } },
          evidences: { select: { title: true, status: true } },
          generatedDocuments: { select: { title: true } },
          actionPlans: { select: { id: true, status: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const reqs = [...project.requirements].sort(
    (a, b) => a.requirement.order - b.requirement.order
  );
  const norms = project.standards.map((s) => s.standard.code).join(", ");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Matriz de evidências"
        subtitle={`${project.client.name} · ${project.type} · ${norms}`}
        breadcrumb={[
          { label: "Relatórios", href: "/relatorios" },
          { label: project.type, href: `/relatorios/${id}` },
          { label: "Matriz de evidências" },
        ]}
        action={<PrintButton />}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left align-bottom text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3">Req.</th>
                <th className="py-2 pr-3">Requisito</th>
                <th className="py-2 pr-3">Norma</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Evidências</th>
                <th className="py-2 pr-3">Documentos</th>
                <th className="py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((pr) => (
                <tr key={pr.id} className="border-b border-gray-50 align-top">
                  <td className="py-3 pr-3 font-semibold text-brand-700">
                    {pr.requirement.code}
                  </td>
                  <td className="py-3 pr-3 text-gray-700">{pr.requirement.title}</td>
                  <td className="py-3 pr-3 text-gray-500">{pr.standard.code}</td>
                  <td className="py-3 pr-3 text-gray-700">
                    {REQUIREMENT_STATUS_LABELS[
                      pr.status as ProjectRequirementStatus
                    ] ?? pr.status}
                  </td>
                  <td className="py-3 pr-3">
                    {pr.evidences.length === 0 ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {pr.evidences.map((e, i) => (
                          <li key={i} className="text-gray-600">
                            {e.title}{" "}
                            <span className="text-xs text-gray-400">
                              (
                              {EVIDENCE_STATUS_LABELS[e.status as EvidenceStatus] ??
                                e.status}
                              )
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {pr.generatedDocuments.length === 0 ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {pr.generatedDocuments.map((d, i) => (
                          <li key={i} className="text-gray-600">
                            {d.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-500">
                    {pr.actionPlans.length || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Matriz gerada em {formatDate(new Date())} · {reqs.length} requisitos ·{" "}
          {reqs.reduce((s, r) => s + r.evidences.length, 0)} evidências ·{" "}
          {reqs.reduce((s, r) => s + r.generatedDocuments.length, 0)} documentos.
        </p>
      </Card>
    </div>
  );
}
