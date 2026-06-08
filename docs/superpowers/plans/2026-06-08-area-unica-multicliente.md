# Área única compartilhada — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acabar com a criação de organizações isoladas a cada cadastro: contas passam a nascer só por convite do admin (área única compartilhada) e um script consolida as organizações existentes numa só, com o dono como único ADMIN.

**Architecture:** O motor de escopo por cliente (`getContext`/`clientWhere`/`MembershipClient`) já está correto e **não muda**. Duas frentes: (1) remover o auto-cadastro (UI + auth) para que nenhum código crie `Organization`; (2) um script idempotente de migração de dados (`scripts/consolidate-org.ts`) que unifica as orgs. A lógica de planejamento do script é uma função **pura** testada por um smoke sem banco.

**Tech Stack:** Next.js 15 (App Router, Server Actions), NextAuth v5 (Edge `auth.config.ts` + Node `auth.ts`), Prisma 6 + PostgreSQL, `tsx` para scripts/smokes. Não há jest/vitest: testes são smokes (`scripts/smoke-*.ts`) + `tsc --noEmit` + `npm run build`.

---

## File Structure

- **Modify** `src/app/(auth)/actions.ts` — remover `registerAction`, `registerSchema` e `sendVerificationEmail` (ficam órfãos; só `registerAction` os usava).
- **Replace** `src/app/(auth)/register/page.tsx` — vira um redirect de servidor para `/login` (cobre o caso de usuário logado; o middleware já barra o deslogado).
- **Modify** `src/auth.config.ts` — tirar `/register` da condição `isAuthPage`.
- **Modify** `src/app/(auth)/login/page.tsx` — remover o bloco "Não tem conta? Criar conta".
- **Create** `scripts/consolidate-org.ts` — função pura `planConsolidation` (+ tipos exportados) e a camada de banco (`loadInput`/`apply`/`main`), CLI com dry-run padrão e `--apply`.
- **Create** `scripts/smoke-consolidation.ts` — smoke da função pura, sem banco.

Nenhuma mudança de schema Prisma.

---

### Task 1: Desabilitar o auto-cadastro (UI + auth + actions)

**Files:**
- Modify: `src/app/(auth)/actions.ts`
- Replace: `src/app/(auth)/register/page.tsx`
- Modify: `src/auth.config.ts:13-28`
- Modify: `src/app/(auth)/login/page.tsx:99-104`

- [ ] **Step 1: Remover o link "Criar conta" da tela de login**

Em `src/app/(auth)/login/page.tsx`, apagar o parágrafo do link de cadastro (linhas ~99-104). Remover este bloco inteiro:

```tsx
      <p className="mt-5 text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Criar conta
        </Link>
      </p>
```

Como `Link` ainda é usado em `/recuperar-senha` no mesmo arquivo, **manter** o `import Link from "next/link";`. (O parágrafo "Demo: consultor@iso.com / senha123" logo abaixo permanece.)

- [ ] **Step 2: Substituir a página de registro por um redirect**

Substituir **todo** o conteúdo de `src/app/(auth)/register/page.tsx` por:

```tsx
import { redirect } from "next/navigation";

// Auto-cadastro desativado: contas são criadas apenas por convite do admin
// (ver src/app/(dashboard)/equipe). Qualquer acesso a /register vai para o login.
export default function RegisterPage() {
  redirect("/login");
}
```

- [ ] **Step 3: Tirar `/register` das rotas públicas do middleware**

Em `src/auth.config.ts`, na função `authorized`, trocar a definição de `isAuthPage` para considerar apenas `/login`:

```ts
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
```

(Remove a linha `nextUrl.pathname.startsWith("/register");`. Assim um usuário deslogado em `/register` é redirecionado ao `/login` pelo middleware antes mesmo de renderizar.)

- [ ] **Step 4: Remover `registerAction`, `registerSchema` e `sendVerificationEmail` das actions**

Em `src/app/(auth)/actions.ts`, apagar três blocos contíguos (linhas ~51-117):
1. `const registerSchema = z.object({ ... });`
2. `export async function registerAction(...) { ... }`
3. `export async function sendVerificationEmail(...) { ... }`

Após remover, conferir os imports do topo do arquivo: `createToken` ainda é usado por `requestPasswordReset`; `consumeToken` por `resetPassword`/`acceptInvite`; `sendMail`/`emailLayout`/`appUrl`/`emailEnabled` ainda por `requestPasswordReset`. **Manter todos.** Apenas verifique que nenhum import ficou sem uso (se algum ficar, remova-o).

- [ ] **Step 5: Verificar tipos e build**

Run: `npx tsc --noEmit`
Expected: sem erros (em especial, nenhuma referência pendente a `registerAction`/`sendVerificationEmail`).

Run: `npm run build`
Expected: build conclui; a rota `/register` aparece como rota válida (o redirect é uma página server). Sem erros de import.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(auth)/actions.ts" "src/app/(auth)/register/page.tsx" "src/auth.config.ts" "src/app/(auth)/login/page.tsx"
git commit -m "feat: desabilitar auto-cadastro (contas so por convite do admin)"
```

---

### Task 2: Planejador de consolidação (função pura) + smoke (TDD)

Cria a lógica de decisão da migração como função pura, testável sem banco.

**Files:**
- Create: `scripts/consolidate-org.ts` (parte 1: tipos + função pura)
- Test: `scripts/smoke-consolidation.ts`

- [ ] **Step 1: Escrever o smoke (teste que falha)**

Criar `scripts/smoke-consolidation.ts`:

```ts
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

  // pickCanonicalOrg: mais clientes vence (orgA com 5).
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

  // Fallback: sem o dono preferido, usa o fallback.
  const noOwner = planConsolidation({
    ...input,
    memberships: input.memberships.filter((m) => m.userEmail !== "engjvmorais@gmail.com"),
  });
  assert(noOwner.ownerEmail === "consultor@iso.com", "fallback vira dono");
  const seed = noOwner.keep.find((k) => k.userEmail === "consultor@iso.com")!;
  assert(seed.role === "ADMIN", "fallback consultor vira ADMIN");

  // Dedup: mesmo usuário com 2 memberships → mantém o mais antigo, remove o outro,
  // e une os clientes.
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
```

- [ ] **Step 2: Rodar o smoke e confirmar que falha**

Run: `npx tsx scripts/smoke-consolidation.ts`
Expected: FALHA com erro de import/módulo (`Cannot find module './consolidate-org'` ou `planConsolidation is not a function`), porque `scripts/consolidate-org.ts` ainda não existe.

- [ ] **Step 3: Implementar a função pura**

Criar `scripts/consolidate-org.ts` com **apenas** os tipos e funções puras (a camada de banco vem na Task 3):

```ts
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

  // Dono: preferimos ownerEmail; se não houver membership com esse e-mail, fallback.
  const emails = new Set(input.memberships.map((m) => m.userEmail));
  const ownerEmail = emails.has(input.ownerEmail)
    ? input.ownerEmail
    : input.fallbackOwnerEmail;

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
          .sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0];

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
```

- [ ] **Step 4: Rodar o smoke e confirmar que passa**

Run: `npx tsx scripts/smoke-consolidation.ts`
Expected: `OK smoke-consolidation: planejamento de consolidação ✔`

- [ ] **Step 5: Commit**

```bash
git add scripts/consolidate-org.ts scripts/smoke-consolidation.ts
git commit -m "feat: planejador puro de consolidacao de organizacoes + smoke"
```

---

### Task 3: Camada de banco do script (load + apply + CLI)

Adiciona ao mesmo `scripts/consolidate-org.ts` o carregamento dos dados reais, a aplicação transacional e o `main()` com dry-run/`--apply`.

**Files:**
- Modify: `scripts/consolidate-org.ts` (append)

- [ ] **Step 1: Acrescentar load/apply/main ao fim do arquivo**

Adicionar ao **final** de `scripts/consolidate-org.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lê orgs e memberships reais do banco para montar o input do planejador.
async function loadInput(): Promise<ConsolidationInput> {
  const orgsRaw = await prisma.organization.findMany({
    select: { id: true, createdAt: true, _count: { select: { clients: true } } },
  });
  const orgs: OrgIn[] = orgsRaw.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    clientCount: o._count.clients,
  }));

  const msRaw = await prisma.membership.findMany({
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
      createdAt: true,
      user: { select: { email: true } },
      clients: { select: { clientId: true } },
    },
  });
  const memberships: MembershipIn[] = msRaw.map((m) => ({
    id: m.id,
    userId: m.userId,
    userEmail: m.user.email,
    organizationId: m.organizationId,
    role: m.role,
    createdAt: m.createdAt,
    clientIds: m.clients.map((c) => c.clientId),
  }));

  return { ownerEmail: OWNER_EMAIL, fallbackOwnerEmail: FALLBACK_OWNER_EMAIL, orgs, memberships };
}

function printPlan(input: ConsolidationInput, plan: ConsolidationPlan) {
  console.log("=== PLANO DE CONSOLIDAÇÃO (dry-run) ===");
  console.log(`Organizações: ${input.orgs.length} → 1`);
  console.log(`Org canônica: ${plan.canonicalOrgId}`);
  console.log(`ADMIN único (dono): ${plan.ownerEmail}`);
  console.log(
    `Memberships mantidos: ${plan.keep.length} | removidos (dedup): ${plan.deleteMembershipIds.length}`
  );
  for (const k of plan.keep) {
    console.log(`  - ${k.userEmail}: role=${k.role}, clientes=${k.clientIds.length}`);
  }
  console.log(`Orgs a remover: ${plan.deleteOrgIds.length} [${plan.deleteOrgIds.join(", ")}]`);
}

// Aplica o plano numa transação. Ordem respeita FKs e o unique (organizationId,userId):
// 1) repontar clientes, 2) apagar snapshots órfãos, 3) apagar memberships duplicados,
// 4) atualizar (org/papel/clientes) os mantidos, 5) apagar orgs vazias.
async function apply(plan: ConsolidationPlan) {
  await prisma.$transaction(async (tx) => {
    if (plan.deleteOrgIds.length) {
      await tx.client.updateMany({
        where: { organizationId: { in: plan.deleteOrgIds } },
        data: { organizationId: plan.canonicalOrgId },
      });
      await tx.metricSnapshot.deleteMany({
        where: { organizationId: { in: plan.deleteOrgIds } },
      });
    }

    if (plan.deleteMembershipIds.length) {
      await tx.membershipClient.deleteMany({
        where: { membershipId: { in: plan.deleteMembershipIds } },
      });
      await tx.membership.deleteMany({
        where: { id: { in: plan.deleteMembershipIds } },
      });
    }

    for (const k of plan.keep) {
      await tx.membership.update({
        where: { id: k.membershipId },
        data: { organizationId: plan.canonicalOrgId, role: k.role },
      });
      await tx.membershipClient.deleteMany({ where: { membershipId: k.membershipId } });
      if (k.clientIds.length) {
        await tx.membershipClient.createMany({
          data: k.clientIds.map((clientId) => ({ membershipId: k.membershipId, clientId })),
        });
      }
    }

    if (plan.deleteOrgIds.length) {
      await tx.organization.deleteMany({ where: { id: { in: plan.deleteOrgIds } } });
    }
  });
}

async function main() {
  const doApply = process.argv.includes("--apply");
  const input = await loadInput();

  // Garante que existe um dono (preferido ou fallback) entre os memberships.
  const emails = new Set(input.memberships.map((m) => m.userEmail));
  if (!emails.has(OWNER_EMAIL) && !emails.has(FALLBACK_OWNER_EMAIL)) {
    throw new Error(
      `Nenhum dono encontrado (${OWNER_EMAIL} nem ${FALLBACK_OWNER_EMAIL}). Abortando.`
    );
  }

  const plan = planConsolidation(input);
  printPlan(input, plan);

  if (!doApply) {
    console.log("\n(dry-run) Nada foi gravado. Reexecute com --apply para aplicar.");
    return;
  }

  await apply(plan);
  console.log("\n✅ Consolidação aplicada. Agora existe 1 organização compartilhada.");
}

// Executa só quando chamado diretamente (o smoke importa as funções puras sem rodar isto).
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

> Nota: o `import { PrismaClient }` foi colocado junto deste bloco para manter a Task 2 (funções puras) totalmente independente de banco. Em TypeScript a posição do `import` não importa para a compilação; manter aqui deixa claro que a metade "pura" do arquivo não depende do Prisma. Se o linter do projeto exigir imports no topo, mova as duas linhas de `import`/`const prisma` para logo após o comentário-cabeçalho — sem outras mudanças.

- [ ] **Step 2: Confirmar que o smoke continua passando (não deve tocar o banco)**

Run: `npx tsx scripts/smoke-consolidation.ts`
Expected: `OK smoke-consolidation: planejamento de consolidação ✔`

> ⚠️ Importante: o smoke importa de `./consolidate-org`, o que executa o `main()` do módulo. Para evitar que o smoke conecte ao banco, ajustar o final do arquivo para só rodar `main()` quando executado como script direto. Trocar a chamada `main()...` por:
>
> ```ts
> // `import.meta.url` aponta para este arquivo; `process.argv[1]` é o script chamado.
> const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
> if (isDirectRun) {
>   main()
>     .catch((e) => {
>       console.error(e);
>       process.exit(1);
>     })
>     .finally(() => prisma.$disconnect());
> }
> ```
>
> Se a comparação de URL se mostrar frágil no ambiente (Windows/caminhos), a alternativa robusta é mover `loadInput`/`apply`/`main` para um arquivo separado `scripts/consolidate-org.run.ts` que importa de `./consolidate-org`, deixando `consolidate-org.ts` só com a parte pura. Nesse caso, o comando de execução vira `npx tsx scripts/consolidate-org.run.ts`. Escolha uma das duas e mantenha a coerência no Step seguinte e na execução em produção.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add scripts/consolidate-org.ts
git commit -m "feat: camada de banco e CLI dry-run/--apply da consolidacao"
```

---

### Task 4: Verificação final e entrega

**Files:** nenhum novo.

- [ ] **Step 1: Build completo**

Run: `npm run build`
Expected: build conclui sem erros; rota `/register` presente (redirect); `/login` sem link de cadastro.

- [ ] **Step 2: Conferência manual do escopo (checklist, sem código)**

Validar mentalmente/na UI local que o comportamento de escopo segue intacto (não foi alterado):
- `getContext` → ADMIN vê todos; demais veem só `clientIds`.
- Dashboard, `/clientes`, `/projetos`, `/relatorios`, `/notificacoes` usam `clientWhere`.

- [ ] **Step 3: Commit final do plano marcado (se aplicável) e push**

```bash
git add docs/superpowers/plans/2026-06-08-area-unica-multicliente.md
git commit -m "docs: plano de area unica compartilhada"
git push origin main
```

> O push em `main` dispara redeploy automático na Vercel (integração Git). Como o auto-cadastro foi removido, confira após o deploy que `/register` redireciona para `/login` em produção.

---

## Execução em produção (passo separado, fora deste plano de código)

A consolidação de dados **não** roda automaticamente. Depois do código no ar:

1. `npx tsx scripts/consolidate-org.ts` (dry-run) — revisar o resumo: org canônica e o ADMIN escolhido (`engjvmorais@gmail.com` ou `consultor@iso.com`).
2. Confirmado o resumo, `npx tsx scripts/consolidate-org.ts --apply`.

Ambos leem/escrevem no banco de produção (Supabase) e passam pelo guard de produção — executar só com aprovação explícita do usuário.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** (1) bloquear auto-cadastro → Task 1; (2) script idempotente dry-run/`--apply` com canônica, dono ADMIN único, rebaixar ADMINs, dedup, apagar orgs vazias → Tasks 2-3; (3) sem mudança de schema → confirmado (nenhuma migração Prisma). Verificação build/tsc + escopo por cliente → Task 4.
- **Placeholders:** nenhum — todo passo tem código/comando concreto.
- **Consistência de tipos:** `ConsolidationInput`/`ConsolidationPlan`/`FinalMembership`/`OrgIn`/`MembershipIn`, `planConsolidation`, `pickCanonicalOrg`, `OWNER_EMAIL`, `FALLBACK_OWNER_EMAIL` usados de forma idêntica no smoke (Task 2) e na camada de banco (Task 3). `apply` consome exatamente os campos do `ConsolidationPlan`.
