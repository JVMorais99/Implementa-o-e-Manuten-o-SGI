// Status como unions TS (SQLite não suporta enums nativos do Prisma).
// Cada conjunto traz labels em PT-BR e classes Tailwind para badges.

export const PROJECT_REQUIREMENT_STATUSES = [
  "NAO_INICIADO",
  "SOLICITADO_CLIENTE",
  "GERADO_SISTEMA",
  "ENVIADO_CLIENTE",
  "RECEBIDO_CLIENTE",
  "EM_ANALISE",
  "CONFORME",
  "PARCIAL",
  "NAO_CONFORME",
  "NAO_APLICAVEL",
] as const;
export type ProjectRequirementStatus =
  (typeof PROJECT_REQUIREMENT_STATUSES)[number];

export const EVIDENCE_STATUSES = [
  "PENDENTE",
  "RECEBIDA",
  "EM_ANALISE",
  "ACEITA",
  "PARCIAL",
  "REJEITADA",
  "VENCIDA",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const DOCUMENT_STATUSES = [
  "RASCUNHO",
  "GERADO",
  "EXPORTADO",
  "ENVIADO_CLIENTE",
  "RECEBIDO_ASSINADO",
  "APROVADO",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  "EM_ANDAMENTO",
  "PAUSADO",
  "CONCLUIDO",
  "CANCELADO",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ACTION_PLAN_STATUSES = [
  "ABERTO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "ATRASADO",
  "CANCELADO",
] as const;
export type ActionPlanStatus = (typeof ACTION_PLAN_STATUSES)[number];

export const ACTION_PLAN_PRIORITIES = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;
export type ActionPlanPriority = (typeof ACTION_PLAN_PRIORITIES)[number];

export const CERTIFICATION_STATUSES = [
  "ATIVA",
  "EM_RECERTIFICACAO",
  "SUSPENSA",
  "VENCIDA",
  "CANCELADA",
] as const;
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

// ---- Organização / papéis (RBAC) ----

export const ORG_ROLES = [
  "ADMIN",
  "CONSULTOR",
  "AUDITOR",
  "LEITOR",
  "CLIENTE",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  ADMIN: "Administrador",
  CONSULTOR: "Consultor",
  AUDITOR: "Auditor",
  LEITOR: "Leitor",
  CLIENTE: "Cliente (portal)",
};

export const ORG_ROLE_COLORS: Record<OrgRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  CONSULTOR: "bg-brand-100 text-brand-700",
  AUDITOR: "bg-sky-100 text-sky-700",
  LEITOR: "bg-gray-100 text-gray-600",
  CLIENTE: "bg-amber-100 text-amber-700",
};

// Papéis internos (não-cliente), usados ao convidar membros da equipe.
export const TEAM_ROLES = ["ADMIN", "CONSULTOR", "AUDITOR", "LEITOR"] as const;

// ---- Trilha de atividades (accountability) ----

export const ACTIVITY_ACTIONS = [
  "REQ_STATUS", // mudança de status / % de um requisito
  "REQ_CONFORME", // requisito marcado como conforme
  "DOC_GENERATED", // documento gerado
  "DOC_SENT", // documento enviado ao cliente
  "DOC_SIGNED", // recebimento assinado registrado
  "DOC_APPROVED", // documento aprovado
  "EVIDENCE_UPLOAD", // evidência anexada
  "ACTION_CREATED", // plano de ação criado
  "ACTION_DONE", // plano de ação concluído
  "AUDIT_CREATED", // auditoria criada
  "FINDING_CREATED", // constatação registrada
  "MEMBER_INVITED", // membro convidado
  "MEMBER_ROLE", // papel de membro alterado
  "MEMBER_REMOVED", // membro removido
  "CLIENT_CREATED", // cliente cadastrado
  "PROJECT_CREATED", // projeto criado
  "RESPONSIBLE_SET", // responsável atribuído a cliente/projeto
  "CERT_RECORDED", // certificação registrada/atualizada
  "SURVEILLANCE_DONE", // auditoria de manutenção (vigilância) registrada
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

// ---- Auditoria ----

export const AUDIT_TYPES = ["INTERNA", "EXTERNA"] as const;
export type AuditType = (typeof AUDIT_TYPES)[number];

export const AUDIT_STATUSES = [
  "PLANEJADA",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "CANCELADA",
] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const AUDIT_ITEM_RESULTS = [
  "NAO_AVALIADO",
  "CONFORME",
  "NAO_CONFORME",
  "OBSERVACAO",
  "OPORTUNIDADE",
  "NAO_APLICAVEL",
] as const;
export type AuditItemResult = (typeof AUDIT_ITEM_RESULTS)[number];

export const FINDING_TYPES = [
  "NC_MAIOR",
  "NC_MENOR",
  "OBSERVACAO",
  "OPORTUNIDADE",
] as const;
export type FindingType = (typeof FINDING_TYPES)[number];

export const FINDING_STATUSES = [
  "ABERTA",
  "EM_TRATAMENTO",
  "VERIFICACAO",
  "ENCERRADA",
] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const EVIDENCE_ANALYSIS = [
  "ATENDE",
  "ATENDE_PARCIALMENTE",
  "NAO_ATENDE",
  "NAO_APLICAVEL",
] as const;
export type EvidenceAnalysis = (typeof EVIDENCE_ANALYSIS)[number];

// ---- Labels PT-BR ----

export const REQUIREMENT_STATUS_LABELS: Record<ProjectRequirementStatus, string> = {
  NAO_INICIADO: "Não iniciado",
  SOLICITADO_CLIENTE: "Solicitado ao cliente",
  GERADO_SISTEMA: "Gerado pelo sistema",
  ENVIADO_CLIENTE: "Enviado ao cliente",
  RECEBIDO_CLIENTE: "Recebido do cliente",
  EM_ANALISE: "Em análise",
  CONFORME: "Conforme",
  PARCIAL: "Parcial",
  NAO_CONFORME: "Não conforme",
  NAO_APLICAVEL: "Não aplicável",
};

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  PENDENTE: "Pendente",
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  ACEITA: "Aceita",
  PARCIAL: "Parcial",
  REJEITADA: "Rejeitada",
  VENCIDA: "Vencida",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  RASCUNHO: "Rascunho",
  GERADO: "Gerado",
  EXPORTADO: "Exportado",
  ENVIADO_CLIENTE: "Enviado ao cliente",
  RECEBIDO_ASSINADO: "Recebido assinado",
  APROVADO: "Aprovado",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const ACTION_PLAN_STATUS_LABELS: Record<ActionPlanStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

export const ACTION_PLAN_PRIORITY_LABELS: Record<ActionPlanPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  ATIVA: "Ativa",
  EM_RECERTIFICACAO: "Em recertificação",
  SUSPENSA: "Suspensa",
  VENCIDA: "Vencida",
  CANCELADA: "Cancelada",
};

export const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  INTERNA: "Auditoria interna",
  EXTERNA: "Auditoria externa",
};

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const AUDIT_ITEM_RESULT_LABELS: Record<AuditItemResult, string> = {
  NAO_AVALIADO: "Não avaliado",
  CONFORME: "Conforme",
  NAO_CONFORME: "Não conforme",
  OBSERVACAO: "Observação",
  OPORTUNIDADE: "Oportunidade de melhoria",
  NAO_APLICAVEL: "Não aplicável",
};

export const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  NC_MAIOR: "Não conformidade maior",
  NC_MENOR: "Não conformidade menor",
  OBSERVACAO: "Observação",
  OPORTUNIDADE: "Oportunidade de melhoria",
};

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  ABERTA: "Aberta",
  EM_TRATAMENTO: "Em tratamento",
  VERIFICACAO: "Em verificação",
  ENCERRADA: "Encerrada",
};

export const EVIDENCE_ANALYSIS_LABELS: Record<EvidenceAnalysis, string> = {
  ATENDE: "Atende",
  ATENDE_PARCIALMENTE: "Atende parcialmente",
  NAO_ATENDE: "Não atende",
  NAO_APLICAVEL: "Não aplicável",
};

// ---- Cores de badge (Tailwind) ----

export const REQUIREMENT_STATUS_COLORS: Record<ProjectRequirementStatus, string> = {
  NAO_INICIADO: "bg-gray-100 text-gray-600",
  SOLICITADO_CLIENTE: "bg-amber-100 text-amber-700",
  GERADO_SISTEMA: "bg-brand-100 text-brand-700",
  ENVIADO_CLIENTE: "bg-sky-100 text-sky-700",
  RECEBIDO_CLIENTE: "bg-indigo-100 text-indigo-700",
  EM_ANALISE: "bg-purple-100 text-purple-700",
  CONFORME: "bg-emerald-100 text-emerald-700",
  PARCIAL: "bg-yellow-100 text-yellow-700",
  NAO_CONFORME: "bg-red-100 text-red-700",
  NAO_APLICAVEL: "bg-slate-100 text-slate-500",
};

export const EVIDENCE_STATUS_COLORS: Record<EvidenceStatus, string> = {
  PENDENTE: "bg-gray-100 text-gray-600",
  RECEBIDA: "bg-sky-100 text-sky-700",
  EM_ANALISE: "bg-purple-100 text-purple-700",
  ACEITA: "bg-emerald-100 text-emerald-700",
  PARCIAL: "bg-yellow-100 text-yellow-700",
  REJEITADA: "bg-red-100 text-red-700",
  VENCIDA: "bg-orange-100 text-orange-700",
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  RASCUNHO: "bg-gray-100 text-gray-600",
  GERADO: "bg-brand-100 text-brand-700",
  EXPORTADO: "bg-sky-100 text-sky-700",
  ENVIADO_CLIENTE: "bg-indigo-100 text-indigo-700",
  RECEBIDO_ASSINADO: "bg-purple-100 text-purple-700",
  APROVADO: "bg-emerald-100 text-emerald-700",
};

export const ACTION_PLAN_STATUS_COLORS: Record<ActionPlanStatus, string> = {
  ABERTO: "bg-gray-100 text-gray-600",
  EM_ANDAMENTO: "bg-sky-100 text-sky-700",
  CONCLUIDO: "bg-emerald-100 text-emerald-700",
  ATRASADO: "bg-red-100 text-red-700",
  CANCELADO: "bg-slate-100 text-slate-500",
};

export const ACTION_PLAN_PRIORITY_COLORS: Record<ActionPlanPriority, string> = {
  BAIXA: "bg-gray-100 text-gray-600",
  MEDIA: "bg-sky-100 text-sky-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-red-100 text-red-700",
};

export const CERTIFICATION_STATUS_COLORS: Record<CertificationStatus, string> = {
  ATIVA: "bg-emerald-100 text-emerald-700",
  EM_RECERTIFICACAO: "bg-amber-100 text-amber-700",
  SUSPENSA: "bg-orange-100 text-orange-700",
  VENCIDA: "bg-red-100 text-red-700",
  CANCELADA: "bg-slate-100 text-slate-500",
};

export const AUDIT_TYPE_COLORS: Record<AuditType, string> = {
  INTERNA: "bg-sky-100 text-sky-700",
  EXTERNA: "bg-indigo-100 text-indigo-700",
};

export const AUDIT_STATUS_COLORS: Record<AuditStatus, string> = {
  PLANEJADA: "bg-gray-100 text-gray-600",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700",
  CONCLUIDA: "bg-emerald-100 text-emerald-700",
  CANCELADA: "bg-slate-100 text-slate-500",
};

export const AUDIT_ITEM_RESULT_COLORS: Record<AuditItemResult, string> = {
  NAO_AVALIADO: "bg-gray-100 text-gray-500",
  CONFORME: "bg-emerald-100 text-emerald-700",
  NAO_CONFORME: "bg-red-100 text-red-700",
  OBSERVACAO: "bg-yellow-100 text-yellow-700",
  OPORTUNIDADE: "bg-sky-100 text-sky-700",
  NAO_APLICAVEL: "bg-slate-100 text-slate-500",
};

export const FINDING_TYPE_COLORS: Record<FindingType, string> = {
  NC_MAIOR: "bg-red-100 text-red-700",
  NC_MENOR: "bg-orange-100 text-orange-700",
  OBSERVACAO: "bg-yellow-100 text-yellow-700",
  OPORTUNIDADE: "bg-sky-100 text-sky-700",
};

export const FINDING_STATUS_COLORS: Record<FindingStatus, string> = {
  ABERTA: "bg-red-100 text-red-700",
  EM_TRATAMENTO: "bg-amber-100 text-amber-700",
  VERIFICACAO: "bg-purple-100 text-purple-700",
  ENCERRADA: "bg-emerald-100 text-emerald-700",
};

// Status de requisito considerados "concluídos" para cálculo de progresso.
export const COMPLETED_REQUIREMENT_STATUSES: ProjectRequirementStatus[] = [
  "CONFORME",
  "NAO_APLICAVEL",
];

// Mapa de status -> percentual de conclusão sugerido (usado ao mudar status).
export const STATUS_COMPLETION_PERCENT: Record<ProjectRequirementStatus, number> = {
  NAO_INICIADO: 0,
  SOLICITADO_CLIENTE: 15,
  GERADO_SISTEMA: 35,
  ENVIADO_CLIENTE: 50,
  RECEBIDO_CLIENTE: 65,
  EM_ANALISE: 80,
  CONFORME: 100,
  PARCIAL: 60,
  NAO_CONFORME: 40,
  NAO_APLICAVEL: 100,
};
