import type { OrgRole } from "./enums";

// Matriz de capacidades por papel (RBAC). Cada ação é uma capacidade verificável
// em server actions (escrita) e usada para condicionar a UI (nav, botões).
export type Capability =
  | "manage_members" // gerenciar usuários/papéis da organização
  | "manage_clients" // criar/editar/excluir clientes
  | "manage_projects" // criar/editar/excluir projetos
  | "edit_requirements" // editar a trilha (status, notas, evidências do consultor)
  | "manage_documents" // gerar/editar/versionar/exportar documentos
  | "manage_audits" // conduzir auditorias (checklist, constatações, relatório)
  | "upload_evidence" // anexar evidências
  | "ai_assist" // usar o assistente de IA (análise, sugestão, plano de ação)
  | "view"; // leitura

const MATRIX: Record<OrgRole, Capability[]> = {
  ADMIN: [
    "manage_members",
    "manage_clients",
    "manage_projects",
    "edit_requirements",
    "manage_documents",
    "manage_audits",
    "upload_evidence",
    "ai_assist",
    "view",
  ],
  CONSULTOR: [
    "manage_clients",
    "manage_projects",
    "edit_requirements",
    "manage_documents",
    "manage_audits",
    "upload_evidence",
    "ai_assist",
    "view",
  ],
  AUDITOR: ["manage_audits", "upload_evidence", "view"],
  LEITOR: ["view"],
  CLIENTE: ["upload_evidence", "view"],
};

export function can(role: OrgRole, capability: Capability): boolean {
  return MATRIX[role]?.includes(capability) ?? false;
}

// Papel restrito ao portal (vê apenas o próprio cliente).
export function isPortalRole(role: OrgRole): boolean {
  return role === "CLIENTE";
}

// Erro lançado por server actions quando o papel não permite a ação.
export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
