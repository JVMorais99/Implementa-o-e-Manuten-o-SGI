// Migração de dados única: consolida todas as organizações numa org canônica,
// define o usuário dono como único ADMIN, rebaixa os demais ADMINs para LEITOR
// (sem clientes), deduplica memberships e remove orgs vazias. Idempotente.
//   npx tsx scripts/consolidate-org.ts            (dry-run: só imprime o plano)
//   npx tsx scripts/consolidate-org.ts --apply    (executa as mudanças)

export const OWNER_EMAIL = "engjvmorais@gmail.com";
export const FALLBACK_OWNER_EMAIL = "consultor@iso.com";

// Privilégio relativo dos papéis (maior = mais poder), usado na deduplicação.
const ROLE_RANK: Record<string, number> = {
  CLIENTE: 0,
  LEITOR: 1,
  AUDITOR: 2,
  CONSULTOR: 3,
  ADMIN: 4,
};

export interface OrgIn {
  id: string;
  createdAt: Date;
  clientCount: number;
}

export interface MembershipIn {
  id: string;
  userId: string;
  userEmail: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  clientIds: string[];
}

export interface ConsolidationInput {
  ownerEmail: string;
  fallbackOwnerEmail: string;
  orgs: OrgIn[];
  memberships: MembershipIn[];
}

export interface FinalMembership {
  membershipId: string; // membership que será mantido
  userId: string;
  userEmail: string;
  role: string; // papel final resolvido
  clientIds: string[]; // vínculos finais (união); vazio para ADMIN
}

export interface ConsolidationPlan {
  canonicalOrgId: string;
  ownerEmail: string; // dono efetivamente escolhido
  keep: FinalMembership[];
  deleteMembershipIds: string[];
  deleteOrgIds: string[];
}

// Org canônica: a com mais clientes; desempate por createdAt mais antigo.
export function pickCanonicalOrg(orgs: OrgIn[]): OrgIn {
  if (orgs.length === 0) throw new Error("Nenhuma organização encontrada.");
  return [...orgs].sort(
    (a, b) =>
      b.clientCount - a.clientCount ||
      a.createdAt.getTime() - b.createdAt.getTime()
  )[0];
}

export function planConsolidation(input: ConsolidationInput): ConsolidationPlan {
  const canonical = pickCanonicalOrg(input.orgs);

  // Dono: preferimos ownerEmail; se não houver membership com esse e-mail, o
  // fallback; se nenhum dos dois existir, abortamos (senão ninguém viraria ADMIN).
  const emails = new Set(input.memberships.map((m) => m.userEmail));
  const ownerEmail = emails.has(input.ownerEmail)
    ? input.ownerEmail
    : emails.has(input.fallbackOwnerEmail)
      ? input.fallbackOwnerEmail
      : null;
  if (!ownerEmail) {
    throw new Error(
      `Nenhum dono encontrado (${input.ownerEmail} nem ${input.fallbackOwnerEmail}).`
    );
  }

  // Agrupa memberships por usuário (para deduplicar).
  const byUser = new Map<string, MembershipIn[]>();
  for (const m of input.memberships) {
    const arr = byUser.get(m.userId) ?? [];
    arr.push(m);
    byUser.set(m.userId, arr);
  }

  const keep: FinalMembership[] = [];
  const deleteMembershipIds: string[] = [];

  for (const [userId, ms] of byUser) {
    const sorted = [...ms].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    const survivor = sorted[0];
    for (const m of sorted.slice(1)) deleteMembershipIds.push(m.id);

    const isOwner = survivor.userEmail === ownerEmail;
    // Papel efetivo por membership: o dono é sempre ADMIN; um ADMIN que não é o
    // dono é rebaixado para LEITOR; os demais papéis são preservados.
    const effective = (role: string) =>
      isOwner ? "ADMIN" : role === "ADMIN" ? "LEITOR" : role;

    const role = isOwner
      ? "ADMIN"
      : sorted
          .map((m) => effective(m.role))
          .sort((a, b) => (ROLE_RANK[b] ?? -1) - (ROLE_RANK[a] ?? -1))[0];

    const clientIds = isOwner
      ? [] // ADMIN enxerga todos os clientes da org; não precisa de vínculos
      : [...new Set(sorted.flatMap((m) => m.clientIds))];

    keep.push({ membershipId: survivor.id, userId, userEmail: survivor.userEmail, role, clientIds });
  }

  const deleteOrgIds = input.orgs
    .map((o) => o.id)
    .filter((id) => id !== canonical.id);

  return { canonicalOrgId: canonical.id, ownerEmail, keep, deleteMembershipIds, deleteOrgIds };
}
