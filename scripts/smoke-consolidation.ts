import {
  planConsolidation,
  pickCanonicalOrg,
  type ConsolidationInput,
} from "./consolidate-org";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const d = (s: string) => new Date(s);

function main() {
  // Cenário: 3 orgs. orgA (seed) tem 5 clientes; orgB (dono) 0; orgC 1.
  // Usuários: consultor@iso.com (ADMIN de A), engjvmorais@gmail.com (ADMIN de B, dono),
  // joao@x.com (CONSULTOR de C com 1 cliente), maria@x.com (ADMIN de C — será rebaixada).
  const input: ConsolidationInput = {
    ownerEmail: "engjvmorais@gmail.com",
    fallbackOwnerEmail: "consultor@iso.com",
    orgs: [
      { id: "orgA", createdAt: d("2026-06-01"), clientCount: 5 },
      { id: "orgB", createdAt: d("2026-06-02"), clientCount: 0 },
      { id: "orgC", createdAt: d("2026-06-03"), clientCount: 1 },
    ],
    memberships: [
      { id: "mA", userId: "uSeed", userEmail: "consultor@iso.com", organizationId: "orgA", role: "ADMIN", createdAt: d("2026-06-01"), clientIds: [] },
      { id: "mB", userId: "uDono", userEmail: "engjvmorais@gmail.com", organizationId: "orgB", role: "ADMIN", createdAt: d("2026-06-02"), clientIds: [] },
      { id: "mC1", userId: "uJoao", userEmail: "joao@x.com", organizationId: "orgC", role: "CONSULTOR", createdAt: d("2026-06-03"), clientIds: ["c1"] },
      { id: "mC2", userId: "uMaria", userEmail: "maria@x.com", organizationId: "orgC", role: "ADMIN", createdAt: d("2026-06-03"), clientIds: [] },
    ],
  };

  assert(pickCanonicalOrg(input.orgs).id === "orgA", "canônica = orgA (mais clientes)");

  const plan = planConsolidation(input);
  assert(plan.canonicalOrgId === "orgA", "plano usa orgA como canônica");
  assert(plan.ownerEmail === "engjvmorais@gmail.com", "dono = engjvmorais (presente)");

  const byEmail = Object.fromEntries(plan.keep.map((k) => [k.userEmail, k]));
  assert(byEmail["engjvmorais@gmail.com"].role === "ADMIN", "dono é ADMIN");
  assert(byEmail["consultor@iso.com"].role === "LEITOR", "seed ADMIN rebaixado a LEITOR");
  assert(byEmail["maria@x.com"].role === "LEITOR", "outro ADMIN rebaixado a LEITOR");
  assert(byEmail["maria@x.com"].clientIds.length === 0, "ADMIN rebaixado fica sem clientes");
  assert(byEmail["joao@x.com"].role === "CONSULTOR", "CONSULTOR mantém papel");
  assert(byEmail["joao@x.com"].clientIds.join(",") === "c1", "CONSULTOR mantém clientes");

  assert(plan.deleteOrgIds.sort().join(",") === "orgB,orgC", "remove orgB e orgC");
  assert(plan.deleteMembershipIds.length === 0, "sem memberships duplicados neste cenário");

  const noOwner = planConsolidation({
    ...input,
    memberships: input.memberships.filter((m) => m.userEmail !== "engjvmorais@gmail.com"),
  });
  assert(noOwner.ownerEmail === "consultor@iso.com", "fallback vira dono");
  const seed = noOwner.keep.find((k) => k.userEmail === "consultor@iso.com")!;
  assert(seed.role === "ADMIN", "fallback consultor vira ADMIN");

  const dupInput: ConsolidationInput = {
    ownerEmail: "engjvmorais@gmail.com",
    fallbackOwnerEmail: "consultor@iso.com",
    orgs: [
      { id: "orgA", createdAt: d("2026-06-01"), clientCount: 2 },
      { id: "orgB", createdAt: d("2026-06-02"), clientCount: 1 },
    ],
    memberships: [
      { id: "mSeed", userId: "uSeed", userEmail: "consultor@iso.com", organizationId: "orgA", role: "ADMIN", createdAt: d("2026-06-01"), clientIds: [] },
      { id: "mDup1", userId: "uJoao", userEmail: "joao@x.com", organizationId: "orgA", role: "CONSULTOR", createdAt: d("2026-06-01"), clientIds: ["c1"] },
      { id: "mDup2", userId: "uJoao", userEmail: "joao@x.com", organizationId: "orgB", role: "AUDITOR", createdAt: d("2026-06-05"), clientIds: ["c2"] },
    ],
  };
  const dupPlan = planConsolidation(dupInput);
  assert(dupPlan.deleteMembershipIds.join(",") === "mDup2", "remove o membership mais novo do dup");
  const joao = dupPlan.keep.find((k) => k.userEmail === "joao@x.com")!;
  assert(joao.membershipId === "mDup1", "mantém o membership mais antigo");
  assert(joao.role === "CONSULTOR", "papel = maior privilégio entre os dups (CONSULTOR > AUDITOR)");
  assert(joao.clientIds.sort().join(",") === "c1,c2", "une os clientes dos dups");

  console.log("OK smoke-consolidation: planejamento de consolidação ✔");
}

main();
