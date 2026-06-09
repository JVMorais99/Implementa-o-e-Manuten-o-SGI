// Smoke "Meu trabalho": valida a visão pessoal do consultor (src/lib/my-work.ts):
// (1) resolveMyScope restringe aos clientes sob responsabilidade direta,
// (2) a fila de tarefas reúne requisitos a tratar + ações abertas + documentos parados
//     (ignorando o que já está com o cliente ou concluído), e
// (3) a agenda agrupa os prazos em vencidos / semana / mais adiante.
//   npx tsx scripts/smoke-mywork.ts
//
// Requer a migração 20260609120000_team_management aplicada (coluna
// responsibleMembershipId). Cria dados prefixados "SMOKE MYWORK" e limpa ao final.

import { PrismaClient } from "@prisma/client";
import { resolveMyScope, getMyWork } from "../src/lib/my-work";
import type { AccessContext } from "../src/lib/session";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const ORG_NAME = "SMOKE MYWORK Org";
const STD_CODE = "SMOKE MYWORK STD";
const EMAILS = ["smoke-mywork-admin@test.com", "smoke-mywork-c1@test.com"];

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function cleanup() {
  await prisma.organization.deleteMany({ where: { name: ORG_NAME } });
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.isoStandard.deleteMany({ where: { code: STD_CODE } });
}

async function main() {
  await cleanup();

  const [admin, c1] = await Promise.all(
    EMAILS.map((email, i) =>
      prisma.user.create({
        data: { name: ["Admin", "Consultor 1"][i], email, passwordHash: "x" },
      })
    )
  );

  const org = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      members: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: c1.id, role: "CONSULTOR" },
        ],
      },
      clients: {
        create: [
          { name: "Cliente do C1", userId: admin.id },
          { name: "Cliente de outro", userId: admin.id },
        ],
      },
    },
    include: { members: true, clients: true },
  });
  const memC1 = org.members.find((m) => m.userId === c1.id)!;
  const [clientMine, clientOther] = org.clients;

  // C1 é responsável apenas pelo "Cliente do C1".
  await prisma.client.update({
    where: { id: clientMine.id },
    data: { responsibleMembershipId: memC1.id },
  });
  await prisma.membershipClient.create({
    data: { membershipId: memC1.id, clientId: clientMine.id },
  });

  // Catálogo mínimo de norma/requisito (auto-contido).
  const std = await prisma.isoStandard.create({
    data: { code: STD_CODE, name: "Norma de teste" },
  });
  const isoReq = await prisma.isoRequirement.create({
    data: {
      standardId: std.id,
      code: "4.1",
      title: "Contexto da organização",
      description: "x",
      consultantGuidance: "x",
      suggestedQuestion: "x",
      expectedEvidence: "[]",
      order: 1,
    },
  });

  // Um projeto em cada cliente, para provar o escopo.
  async function makeProject(clientId: string) {
    return prisma.isoProject.create({
      data: { clientId, type: "Implantação ISO 9001", status: "EM_ANDAMENTO", dueDate: daysFromNow(20) },
    });
  }
  const projMine = await makeProject(clientMine.id);
  const projOther = await makeProject(clientOther.id);

  async function makeReq(projectId: string, status: string, dueDate: Date | null) {
    return prisma.projectRequirement.create({
      data: { projectId, standardId: std.id, requirementId: isoReq.id, status, dueDate },
    });
  }

  // No cliente do C1:
  const rOverdue = await makeReq(projMine.id, "NAO_INICIADO", daysFromNow(-1)); // tarefa + agenda(vencidos)
  const rWeek = await makeReq(projMine.id, "EM_ANALISE", daysFromNow(3)); // tarefa + agenda(semana)
  await makeReq(projMine.id, "CONFORME", daysFromNow(2)); // concluído → fora
  await makeReq(projMine.id, "ENVIADO_CLIENTE", daysFromNow(2)); // bola com o cliente → fora da fila

  // No cliente de outro consultor (não deve aparecer):
  await makeReq(projOther.id, "NAO_INICIADO", daysFromNow(-1));

  // Ações: uma aberta vencida (tarefa + agenda) e uma concluída (fora).
  await prisma.actionPlan.create({
    data: { projectRequirementId: rWeek.id, action: "Tratar lacuna", status: "ABERTO", dueDate: daysFromNow(-1) },
  });
  await prisma.actionPlan.create({
    data: { projectRequirementId: rWeek.id, action: "Já resolvido", status: "CONCLUIDO", dueDate: daysFromNow(-1) },
  });

  // Documento assinado aguardando aprovação → tarefa (sem prazo).
  await prisma.generatedDocument.create({
    data: {
      projectRequirementId: rOverdue.id,
      title: "Política da Qualidade",
      contentHtml: "<p>x</p>",
      status: "RECEBIDO_ASSINADO",
      signedReceivedAt: daysFromNow(-2),
    },
  });

  // Auditoria planejada (agenda, semana) e constatação aberta (agenda, mais adiante).
  const audit = await prisma.audit.create({
    data: { projectId: projMine.id, type: "INTERNA", title: "Auditoria interna", status: "PLANEJADA", plannedDate: daysFromNow(2) },
  });
  await prisma.auditFinding.create({
    data: { auditId: audit.id, type: "NC_MENOR", description: "Registro incompleto", status: "ABERTA", dueDate: daysFromNow(10) },
  });

  // ---- Verificações ----
  const ctx: AccessContext = {
    user: { id: c1.id, name: "Consultor 1" },
    orgId: org.id,
    role: "CONSULTOR",
    clientIds: [clientMine.id],
  };

  const scope = await resolveMyScope(ctx);
  assert(scope.ownsClients, "C1 deve ter clientes sob responsabilidade (ownsClients)");
  assert(
    scope.clientIds.length === 1 && scope.clientIds[0] === clientMine.id,
    `Escopo deve conter só o cliente do C1 (foi ${JSON.stringify(scope.clientIds)})`
  );

  const work = await getMyWork(scope.clientIds);

  // Fila: rOverdue, rWeek (REQ) + 1 ação aberta + 1 documento = 4 tarefas.
  assert(work.counts.open === 4, `Tarefas abertas deve ser 4 (foi ${work.counts.open})`);
  assert(work.counts.overdue === 2, `Vencidas deve ser 2 (req + ação; foi ${work.counts.overdue})`);
  assert(work.counts.clients === 1, `Clientes no escopo deve ser 1 (foi ${work.counts.clients})`);
  // Nenhuma tarefa do cliente de outro consultor.
  assert(
    !work.tasks.some((t) => t.client === "Cliente de outro"),
    "Não deve vazar tarefa de cliente de outro consultor"
  );
  // A primeira tarefa deve ser uma vencida.
  assert(work.tasks[0].overdue, "Tarefas vencidas devem vir primeiro na fila");

  // Agenda: vencidos (req + ação), semana (req prazo + auditoria), mais adiante (constatação).
  const buckets = Object.fromEntries(work.agenda.map((b) => [b.key, b.items.length]));
  assert(buckets.overdue === 2, `Agenda 'vencidos' deve ter 2 (foi ${buckets.overdue ?? 0})`);
  assert(buckets.week === 2, `Agenda 'próximos 7 dias' deve ter 2 (foi ${buckets.week ?? 0})`);
  assert(buckets.later === 1, `Agenda 'mais adiante' deve ter 1 (foi ${buckets.later ?? 0})`);
  assert(work.counts.dueThisWeek === 2, `Prazos em 7 dias deve ser 2 (foi ${work.counts.dueThisWeek})`);

  await cleanup();

  console.log("OK meu trabalho:");
  console.log("  escopo restrito ao cliente responsável (ownsClients, sem vazamento)");
  console.log("  fila: 4 tarefas (2 vencidas), ignora concluído/enviado-ao-cliente");
  console.log("  agenda: vencidos=2, semana=2, adiante=1; prazos em 7 dias=2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
