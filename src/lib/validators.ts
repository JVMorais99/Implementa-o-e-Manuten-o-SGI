import { z } from "zod";
import {
  PROJECT_REQUIREMENT_STATUSES,
  PROJECT_STATUSES,
  EVIDENCE_STATUSES,
  ACTION_PLAN_STATUSES,
  ACTION_PLAN_PRIORITIES,
  AUDIT_TYPES,
  AUDIT_STATUSES,
  AUDIT_ITEM_RESULTS,
  FINDING_TYPES,
  FINDING_STATUSES,
  CERTIFICATION_STATUSES,
} from "./enums";

const optionalString = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v == null || v === "" ? undefined : v));

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente"),
  cnpj: optionalString,
  unit: optionalString,
  responsible: optionalString,
  contact: optionalString,
  segment: optionalString,
  scope: optionalString,
  notes: optionalString,
});
export type ClientInput = z.infer<typeof clientSchema>;

export const projectSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente"),
  type: z.string().trim().min(2, "Informe o tipo de projeto"),
  standardIds: z.array(z.string().min(1)).min(1, "Selecione ao menos uma norma"),
  startDate: optionalString,
  dueDate: optionalString,
  responsible: optionalString,
  status: z.enum(PROJECT_STATUSES).default("EM_ANDAMENTO"),
  notes: optionalString,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const projectRequirementUpdateSchema = z.object({
  status: z.enum(PROJECT_REQUIREMENT_STATUSES).optional(),
  consultantNotes: optionalString,
  clientNotes: optionalString,
  responsible: optionalString,
  dueDate: optionalString,
  completionPercent: z.coerce.number().min(0).max(100).optional(),
});

export const evidenceSchema = z.object({
  projectRequirementId: z.string().min(1),
  title: z.string().trim().min(2, "Informe o título da evidência"),
  type: z.string().trim().min(1, "Informe o tipo"),
  status: z.enum(EVIDENCE_STATUSES).default("RECEBIDA"),
  technicalAnalysis: optionalString,
  receivedAt: optionalString,
  expiresAt: optionalString,
});

export const actionPlanSchema = z.object({
  projectRequirementId: z.string().min(1),
  action: z.string().trim().min(3, "Descreva a ação"),
  responsible: optionalString,
  dueDate: optionalString,
  status: z.enum(ACTION_PLAN_STATUSES).default("ABERTO"),
  priority: z.enum(ACTION_PLAN_PRIORITIES).default("MEDIA"),
});

export const commentSchema = z.object({
  projectRequirementId: z.string().min(1),
  text: z.string().trim().min(1, "Escreva um comentário"),
});

export const generateDocumentSchema = z.object({
  projectRequirementId: z.string().min(1),
  templateId: z.string().min(1, "Selecione um modelo"),
});

export const documentUpdateSchema = z.object({
  title: optionalString,
  contentHtml: z.string().optional(),
  status: optionalString,
});

// ---- Auditoria ----

export const auditSchema = z.object({
  projectId: z.string().min(1, "Selecione o projeto"),
  type: z.enum(AUDIT_TYPES),
  title: z.string().trim().min(3, "Informe um título para a auditoria"),
  scope: optionalString,
  objective: optionalString,
  criteria: optionalString,
  leadAuditor: optionalString,
  auditTeam: optionalString,
  auditedOrg: optionalString,
  plannedDate: optionalString,
  executedDate: optionalString,
  status: z.enum(AUDIT_STATUSES).default("PLANEJADA"),
  conclusion: optionalString,
});
export type AuditInput = z.infer<typeof auditSchema>;

export const auditItemUpdateSchema = z.object({
  result: z.enum(AUDIT_ITEM_RESULTS),
  notes: optionalString,
  evidenceSampled: optionalString,
});

// ---- Certificação / manutenção ----

export const certificationSchema = z
  .object({
    clientId: z.string().min(1, "Selecione o cliente"),
    standardId: z.string().min(1, "Selecione a norma"),
    certifyingBody: optionalString,
    certificateNo: optionalString,
    scope: optionalString,
    issuedAt: z.string().trim().min(1, "Informe a data de emissão"),
    expiresAt: z.string().trim().min(1, "Informe a validade"),
    surveillanceIntervalMonths: z.coerce
      .number()
      .int()
      .min(0, "Intervalo inválido")
      .max(60, "Intervalo máximo de 60 meses")
      .default(12),
    status: z.enum(CERTIFICATION_STATUSES).default("ATIVA"),
    notes: optionalString,
  })
  .refine((d) => new Date(d.expiresAt) > new Date(d.issuedAt), {
    message: "A validade deve ser posterior à emissão",
    path: ["expiresAt"],
  });
export type CertificationInput = z.infer<typeof certificationSchema>;

export const findingSchema = z.object({
  type: z.enum(FINDING_TYPES),
  description: z.string().trim().min(3, "Descreva a constatação"),
  projectRequirementId: optionalString,
  evidence: optionalString,
  correction: optionalString,
  rootCause: optionalString,
  correctiveAction: optionalString,
  responsible: optionalString,
  dueDate: optionalString,
  status: z.enum(FINDING_STATUSES).default("ABERTA"),
});
export type FindingInput = z.infer<typeof findingSchema>;
