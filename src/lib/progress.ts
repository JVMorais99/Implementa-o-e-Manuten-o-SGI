import { COMPLETED_REQUIREMENT_STATUSES, type ProjectRequirementStatus } from "./enums";

// Calcula o percentual de conclusão de um projeto a partir dos status dos
// seus requisitos. Considera "concluído" os status CONFORME e NAO_APLICAVEL.
export function projectProgress(
  requirements: { status: string }[]
): number {
  if (requirements.length === 0) return 0;
  const done = requirements.filter((r) =>
    COMPLETED_REQUIREMENT_STATUSES.includes(r.status as ProjectRequirementStatus)
  ).length;
  return Math.round((done / requirements.length) * 100);
}

// Distribui os requisitos por status (para o gráfico de progresso).
export function statusDistribution(
  requirements: { status: string }[]
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const r of requirements) {
    dist[r.status] = (dist[r.status] ?? 0) + 1;
  }
  return dist;
}
