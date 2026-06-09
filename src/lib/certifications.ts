import { prisma } from "@/lib/prisma";
import { clientWhere, type AccessContext } from "@/lib/session";
import type { CertificationStatus } from "@/lib/enums";

// Fase de MANUTENÇÃO do SGI. A partir das certificações cadastradas por cliente
// (emissão, validade, intervalo de vigilância), derivamos — sem tabela de lembretes —
// a agenda de manutenção: próximas auditorias de vigilância e a recertificação,
// além dos lembretes que alimentam o sino (src/lib/notifications.ts) e a visão
// "Meu trabalho" (src/lib/my-work.ts).

// Janelas (em dias) a partir das quais um vencimento vira lembrete ativo.
export const RECERT_WINDOW_DAYS = 120; // organismo costuma exigir recert ~3 meses antes
export const SURVEILLANCE_WINDOW_DAYS = 60;

// Status que ainda demandam manutenção (CANCELADA sai do radar).
const LIVE_STATUSES: CertificationStatus[] = [
  "ATIVA",
  "EM_RECERTIFICACAO",
  "SUSPENSA",
  "VENCIDA",
];

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Dias inteiros de hoje (meia-noite) até a data (negativo = vencido).
export function daysUntil(date: Date, now = new Date()): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

// Próxima auditoria de manutenção (vigilância): a partir da última realizada (ou da
// emissão), somando o intervalo. Retorna null quando não há ciclo (intervalo 0) ou
// quando a próxima data já cairia depois da validade (aí o evento é a recertificação).
export function nextSurveillanceDate(cert: {
  issuedAt: Date;
  expiresAt: Date;
  surveillanceIntervalMonths: number;
  lastSurveillanceAt: Date | null;
}): Date | null {
  if (!cert.surveillanceIntervalMonths || cert.surveillanceIntervalMonths <= 0) {
    return null;
  }
  const base = cert.lastSurveillanceAt ?? cert.issuedAt;
  const next = addMonths(base, cert.surveillanceIntervalMonths);
  if (next >= cert.expiresAt) return null;
  return next;
}

// Status "efetivo" para exibição: uma certificação marcada ATIVA mas já vencida
// aparece como VENCIDA (sem alterar o dado gravado).
export function effectiveStatus(cert: {
  status: string;
  expiresAt: Date;
}): CertificationStatus {
  if (cert.status === "ATIVA" && daysUntil(cert.expiresAt) < 0) return "VENCIDA";
  return cert.status as CertificationStatus;
}

export interface CertificationRow {
  id: string;
  clientId: string;
  clientName: string;
  standardId: string;
  standardCode: string;
  certifyingBody: string | null;
  certificateNo: string | null;
  scope: string | null;
  issuedAt: Date;
  expiresAt: Date;
  surveillanceIntervalMonths: number;
  lastSurveillanceAt: Date | null;
  status: CertificationStatus;
  displayStatus: CertificationStatus;
  daysToExpiry: number;
  nextSurveillance: Date | null;
  daysToSurveillance: number | null;
  notes: string | null;
}

// Lista as certificações visíveis ao usuário (escopo por clientWhere), enriquecidas
// com o ciclo calculado. Ordena pelas que vencem primeiro.
export async function listCertifications(
  ctx: AccessContext
): Promise<CertificationRow[]> {
  const certs = await prisma.certification.findMany({
    where: { client: clientWhere(ctx) },
    orderBy: { expiresAt: "asc" },
    include: {
      client: { select: { id: true, name: true } },
      standard: { select: { id: true, code: true } },
    },
  });

  return certs.map((c) => {
    const next = nextSurveillanceDate(c);
    return {
      id: c.id,
      clientId: c.clientId,
      clientName: c.client.name,
      standardId: c.standardId,
      standardCode: c.standard.code,
      certifyingBody: c.certifyingBody,
      certificateNo: c.certificateNo,
      scope: c.scope,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      surveillanceIntervalMonths: c.surveillanceIntervalMonths,
      lastSurveillanceAt: c.lastSurveillanceAt,
      status: c.status as CertificationStatus,
      displayStatus: effectiveStatus(c),
      daysToExpiry: daysUntil(c.expiresAt),
      nextSurveillance: next,
      daysToSurveillance: next ? daysUntil(next) : null,
      notes: c.notes,
    };
  });
}

export type ReminderKind = "RECERT" | "SURVEILLANCE";
export type ReminderSeverity = "high" | "medium" | "low";

export interface MaintenanceReminder {
  id: string;
  kind: ReminderKind;
  severity: ReminderSeverity;
  clientId: string;
  clientName: string;
  standardCode: string;
  title: string;
  description: string;
  date: Date; // data-gatilho (validade ou próxima vigilância)
  href: string;
}

function recertSeverity(days: number): ReminderSeverity {
  if (days <= 30) return "high";
  if (days <= 90) return "medium";
  return "low";
}

// Lembretes de manutenção derivados das certificações no escopo do usuário:
// recertificação (validade chegando/vencida) e vigilância (próxima auditoria de
// manutenção dentro da janela). Ordenados por urgência e data.
export async function getMaintenanceReminders(
  ctx: AccessContext
): Promise<MaintenanceReminder[]> {
  const rows = await listCertifications(ctx);
  const reminders: MaintenanceReminder[] = [];

  for (const c of rows) {
    if (!LIVE_STATUSES.includes(c.status)) continue;
    const href = `/clientes/${c.clientId}`;

    // Recertificação: validade dentro da janela (ou vencida).
    if (c.daysToExpiry <= RECERT_WINDOW_DAYS) {
      const overdue = c.daysToExpiry < 0;
      reminders.push({
        id: `recert-${c.id}`,
        kind: "RECERT",
        severity: overdue ? "high" : recertSeverity(c.daysToExpiry),
        clientId: c.clientId,
        clientName: c.clientName,
        standardCode: c.standardCode,
        title: overdue ? "Certificação vencida" : "Recertificação próxima",
        description: overdue
          ? `${c.clientName} · ${c.standardCode}: certificado venceu há ${Math.abs(c.daysToExpiry)} dia(s).`
          : `${c.clientName} · ${c.standardCode}: certificado vence em ${c.daysToExpiry} dia(s).`,
        date: c.expiresAt,
        href,
      });
    }

    // Vigilância: só para certificações ativas, próxima auditoria de manutenção
    // dentro da janela (ou atrasada).
    if (
      c.status === "ATIVA" &&
      c.nextSurveillance &&
      c.daysToSurveillance != null &&
      c.daysToSurveillance <= SURVEILLANCE_WINDOW_DAYS
    ) {
      const overdue = c.daysToSurveillance < 0;
      reminders.push({
        id: `surv-${c.id}`,
        kind: "SURVEILLANCE",
        severity: overdue ? "high" : "medium",
        clientId: c.clientId,
        clientName: c.clientName,
        standardCode: c.standardCode,
        title: overdue ? "Auditoria de manutenção atrasada" : "Auditoria de manutenção próxima",
        description: overdue
          ? `${c.clientName} · ${c.standardCode}: vigilância atrasada há ${Math.abs(c.daysToSurveillance)} dia(s).`
          : `${c.clientName} · ${c.standardCode}: vigilância em ${c.daysToSurveillance} dia(s).`,
        date: c.nextSurveillance,
        href,
      });
    }
  }

  const rank: Record<ReminderSeverity, number> = { high: 0, medium: 1, low: 2 };
  return reminders.sort((a, b) => {
    if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
    return a.date.getTime() - b.date.getTime();
  });
}
