import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TableCard, Table, THead, Th, Tr, Td } from "@/components/ui/Table";
import { parseJsonArray } from "@/lib/utils";
import { emailEnabled, blobEnabled, aiEnabled, aiModel } from "@/lib/features";

function StatusPill({ on, onLabel }: { on: boolean; onLabel: string }) {
  return on ? (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      {onLabel}
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      Não configurado
    </span>
  );
}

export default async function ConfiguracoesPage() {
  await requireUser();

  const [standards, templates] = await Promise.all([
    prisma.isoStandard.findMany({
      orderBy: { code: "asc" },
      include: { _count: { select: { requirements: true } } },
    }),
    prisma.documentTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const emailOn = emailEnabled();
  const blobOn = blobEnabled();
  const aiOn = aiEnabled();

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Catálogo de normas, modelos de documentos e integrações"
      />

      <Card className="mb-6">
        <h3 className="mb-4 text-base font-semibold text-gray-800">Integrações</h3>
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">E-mail (Resend)</p>
              <p className="text-xs text-gray-500">
                Convites, redefinição de senha e verificação. Sem chave, os links são
                exibidos na tela.
              </p>
            </div>
            <StatusPill on={emailOn} onLabel="Ativo" />
          </li>
          <li className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Storage em nuvem (Vercel Blob)
              </p>
              <p className="text-xs text-gray-500">
                Armazenamento de evidências. Sem token, usa disco local.
              </p>
            </div>
            <StatusPill on={blobOn} onLabel="Ativo" />
          </li>
          <li className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Assistente de IA (Anthropic Claude)
              </p>
              <p className="text-xs text-gray-500">
                {aiOn
                  ? `Modelo: ${aiModel()}`
                  : "Defina ANTHROPIC_API_KEY para habilitar a análise por IA."}
              </p>
            </div>
            <StatusPill on={aiOn} onLabel="Ativo" />
          </li>
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <TableCard title="Normas ISO disponíveis">
          <Table>
            <THead>
              <Th>Norma</Th>
              <Th>Nome</Th>
              <Th align="center">Requisitos</Th>
            </THead>
            <tbody>
              {standards.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-semibold text-gray-800">{s.code}</Td>
                  <Td>{s.name}</Td>
                  <Td align="center">
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      {s._count.requirements}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-800">
            Modelos de documentos
          </h3>
          <ul className="space-y-2">
            {templates.map((t) => {
              const codes = parseJsonArray(t.applicableRequirementCodes);
              const stds = parseJsonArray(t.applicableStandards);
              return (
                <li key={t.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {t.documentType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {codes.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700"
                      >
                        Req. {c}
                      </span>
                    ))}
                    {stds.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
