// Smoke "Manutenção / recertificação" (src/lib/certifications.ts):
// (1) helpers de ciclo (nextSurveillanceDate, effectiveStatus, daysUntil),
// (2) listCertifications respeita o escopo por cliente, e
// (3) getMaintenanceReminders deriva recertificação (validade na janela) e
//     vigilância (próxima auditoria de manutenção), e o ciclo avança ao registrar
//     uma vigilância (lastSurveillanceAt).
//   npx tsx scripts/smoke-certifications.ts
//
// Requer a migração 20260609130000_certifications aplicada. Cria dados prefixados
// "SMOKE CERT" e limpa ao final.

import { PrismaClient } from "@prisma/client";
import {
  nextSurveillanceDate,
  effectiveStatus,
  daysUntil,
  listCertifications,
  getMaintenanceReminders,
} from "../src/lib/certifications";
import type { AccessContext } from "../src/lib/session";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const ORG_NAME = "SMOKE CERT Org";
const STD_CODE = "SMOKE CERT STD";
const EMAIL = "smoke-cert@test.com";

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
function monthsFromNow(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setMonth(d.getMonth() + n);
  return d;
}

async function cleanup() {
  await prisma.organization.deleteMany({ where: { name: ORG_NAME } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.isoStandard.deleteMany({ where: { code: STD_CODE } });
}

async function main() {
  await cleanup();

  // ---- (1) Helpers puros ----
  const base = {
    issuedAt: monthsFromNow(-30),
    expiresAt: daysFromNow(60),
    surveillanceIntervalMonths: 12,
    lastSurveillanceAt: null,
  };
  const next = nextSurveillanceDate(base);
  assert(next != null && next < base.expiresAt, "Próxima vigilância deve cair antes da validade");
  // Sem ciclo → sem vigilância.
  assert(
    nextSurveillanceDate({ ...base, surveillanceIntervalMonths: 0 }) === null,
    "Intervalo 0 = sem vigilância"
  );
  // Próxima vigilância depois da validade → null (o evento é a recertificação).
  assert(
    nextSurveillanceDate({ ...base, lastSurveillanceAt: daysFromNow(10) }) === null,
    "Vigilância após a validade deve retornar null"
  );
  assert(
    effectiveStatus({ status: "ATIVA", expiresAt: daysFromNow(-1) }) === "VENCIDA",
    "ATIVA já vencida deve exibir VENCIDA"
  );
  assert(daysUntil(daysFromNow(5)) === 5, "daysUntil(+5) deve ser 5");

  // ---- Cenário no banco ----
  const user = await prisma.user.create({
    data: { name: "Consultor", email: EMAIL, passwordHash: "x" },
  });
  const std = await prisma.isoStandard.create({
    data: { code: STD_CODE, name: "Norma de teste" },
  });
  const org = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      members: { create: [{ userId: user.id, role: "CONSULTOR" }] },
      clients: { create: [{ name: "Cliente Cert", userId: user.id }] },
    },
    include: { clients: true },
  });
  const client = org.clients[0];

  // A: ATIVA, vence em 60d, sem vigilância registrada (vigilância atrasada) → 2 lembretes.
  const certA = await prisma.certification.create({
    data: {
      clientId: client.id,
      standardId: std.id,
      issuedAt: monthsFromNow(-30),
      expiresAt: daysFromNow(60),
      surveillanceIntervalMonths: 12,
      status: "ATIVA",
    },
  });
  // B: ATIVA, validade e vigilância distantes → 0 lembretes.
  await prisma.certification.create({
    data: {
      clientId: client.id,
      standardId: std.id,
      issuedAt: monthsFromNow(-1),
      expiresAt: monthsFromNow(35),
      surveillanceIntervalMonths: 12,
      status: "ATIVA",
    },
  });
  // C: CANCELADA, vence logo → fora do radar.
  await prisma.certification.create({
    data: {
      clientId: client.id,
      standardId: std.id,
      issuedAt: monthsFromNow(-30),
      expiresAt: daysFromNow(10),
      surveillanceIntervalMonths: 12,
      status: "CANCELADA",
    },
  });

  const ctx: AccessContext = {
    user: { id: user.id, name: "Consultor" },
    orgId: org.id,
    role: "CONSULTOR",
    clientIds: [client.id],
  };

  // ---- (2) Escopo ----
  const rows = await listCertifications(ctx);
  assert(rows.length === 3, `listCertifications deve trazer as 3 do cliente (foi ${rows.length})`);
  const otherCtx: AccessContext = { ...ctx, clientIds: [] };
  assert((await listCertifications(otherCtx)).length === 0, "Sem clientes no escopo = nenhuma cert");

  // ---- (3) Lembretes derivados ----
  const reminders = await getMaintenanceReminders(ctx);
  assert(reminders.length === 2, `A deve gerar 2 lembretes (recert + vigilância); foi ${reminders.length}`);
  assert(reminders.some((r) => r.kind === "RECERT"), "Deve haver lembrete de recertificação");
  assert(reminders.some((r) => r.kind === "SURVEILLANCE"), "Deve haver lembrete de vigilância");

  // Registrar a vigilância (avança o ciclo) → some o lembrete de vigilância.
  await prisma.certification.update({
    where: { id: certA.id },
    data: { lastSurveillanceAt: new Date() },
  });
  const after = await getMaintenanceReminders(ctx);
  assert(
    after.length === 1 && after[0].kind === "RECERT",
    `Após registrar vigilância deve sobrar só a recert (foi ${after.length}: ${after.map((r) => r.kind).join(",")})`
  );

  await cleanup();

  console.log("OK manutenção/recertificação:");
  console.log("  helpers: próxima vigilância, status efetivo (vencida) e daysUntil corretos");
  console.log("  escopo: listCertifications restrito ao cliente do consultor");
  console.log("  lembretes: recert + vigilância derivados; ciclo avança ao registrar vigilância");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
