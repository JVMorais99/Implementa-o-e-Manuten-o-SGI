# Área única compartilhada com visualização por cliente

**Data:** 2026-06-08
**Status:** Aprovado (desenho) — pronto para plano de implementação

## Problema

Hoje o auto-cadastro em `/register` (`registerAction` em `src/app/(auth)/actions.ts`)
cria, para cada novo e-mail, uma **organização nova e isolada** com o usuário como
**ADMIN** dela. Resultado: cada cadastro vira um "tenant" separado que não enxerga os
dados da área já existente. O usuário quer o oposto: **uma única área/organização
compartilhada** onde todos acessam, mas cada pessoa só **visualiza os dados dos clientes
aos quais está vinculada** (ex.: 10 empresas-clientes; cada usuário vê só os seus, com
totais/compilados considerando apenas esses clientes).

## Contexto: o que já funciona

O motor de escopo por cliente já existe e está correto — **não precisa mudar**:

- `src/lib/session.ts`: `getContext()` resolve `orgId`, `role` e `clientIds`
  (ADMIN → `null` = vê todos os clientes da org; demais → só os clientes vinculados via
  `MembershipClient`). `clientWhere(ctx)` filtra por `organizationId` + `clientIds`.
- `inviteMember` (`src/app/(dashboard)/equipe/actions.ts`) **já** cria usuários dentro
  da org do admin com papel + clientes vinculados (exige ≥1 cliente para não-ADMIN).
  `setMemberClients`/`updateMemberRole`/`removeMember` permitem gerir depois.
- Dashboard (`src/app/(dashboard)/dashboard/page.tsx`): os KPIs exibidos (Clientes,
  Projetos ativos, Conclusão média, Requisitos pendentes) já usam `clientWhere(ctx)`.
  As *pills* de variação (org-wide, via `computeOrgMetrics`/`getKpiDeltas`) já são
  exclusivas do ADMIN (`if (ctx.clientIds === null)`). **Não há vazamento de totais.**
- Notificações e os ~27 pontos de consulta passam por `clientWhere`/`clientWhereForUser`.

Logo, o único defeito real é o auto-cadastro criar org nova. A correção é pequena +
uma migração de dados única.

## Decisões (do usuário)

1. **Convite-apenas**: desabilitar o auto-cadastro. Contas nascem só por convite do admin.
2. **Consolidar** todas as orgs existentes numa **org canônica** única.
3. **Só o dono é ADMIN**; os demais usuários viram **LEITOR sem clientes vinculados**
   (não veem nada) até o admin vinculá-los a um cliente em `/equipe`.

## Escopo da mudança

### 1. Bloquear auto-cadastro
- Remover a página `/register` e redirecionar `GET /register` → `/login`.
- Remover `registerAction` (e `registerSchema`) de `src/app/(auth)/actions.ts`; manter
  `sendVerificationEmail` se ainda referenciado por outros fluxos (verificar).
- Remover o link/CTA "Criar conta"/"Registrar" da tela de login e de onde mais apareça.
- `src/middleware.ts` (ou config equivalente): remover `/register` das rotas públicas;
  garantir que o redirect não crie loop.
- Sem auto-cadastro, **não há mais nenhum caminho de código que crie `Organization`** —
  a área permanece única naturalmente.

### 2. Migração única de dados (script `scripts/consolidate-org.ts`)
Idempotente, com **dry-run por padrão** (imprime o resumo do que mudaria) e flag
`--apply` para executar. Passos:

1. **Eleger a org canônica**: a `Organization` com mais `Client`s; desempate por
   `createdAt` mais antigo.
2. **Definir o ADMIN único**: o usuário dono. Resolução: se existir `User` com e-mail
   `engjvmorais@gmail.com`, é ele; senão, o admin do seed (`consultor@iso.com`). O passo
   confirma no resumo antes de aplicar. Esse usuário ganha (ou mantém) um `Membership`
   ADMIN na org canônica.
3. **Repontar para a org canônica**: `Client.organizationId`, `Membership.organizationId`
   e `MetricSnapshot.organizationId` de todas as outras orgs.
4. **Rebaixar os demais ADMINs**: todo `Membership` ADMIN que não seja o do dono vira
   `LEITOR`; seus `MembershipClient` são removidos (ficam sem acesso até vínculo manual).
5. **Deduplicar memberships**: se o repontar gerar mais de um `Membership` do mesmo
   `userId` na org canônica, manter um (o de maior privilégio / mais antigo) e remover os
   outros, transferindo os `MembershipClient` para o mantido (união, sem duplicar).
6. **Apagar orgs vazias**: remover `Organization`s que ficaram sem clientes e sem
   memberships. Remover também `MetricSnapshot`s órfãos dessas orgs (após repontar, não
   deve sobrar; tratar conflito de unique `organizationId_date` ao repontar — em colisão,
   manter o snapshot da org canônica e descartar o duplicado).

Restrições: roda dentro de uma transação Prisma; ordem respeita FKs; seguro reexecutar.

### 3. Sem mudança de schema
Nenhuma migração Prisma nova. `Membership.clientId` legado continua ignorado.

## Fora de escopo (YAGNI)
- Não introduzir `CANONICAL_ORG_ID` por env nem singleton de org.
- Não remover a camada `Organization`.
- Não mudar `clientWhere`/`getContext`/dashboard/notificações (já corretos).
- Não mexer em billing.

## Verificação
- `npm run build` e `tsc --noEmit` limpos.
- `GET /register` → 302 para `/login`; nenhum link de cadastro na UI.
- Fluxo manual: admin convida usuário vinculado a 1 cliente → esse usuário só vê aquele
  cliente (dashboard, clientes, projetos, relatórios, notificações).
- Usuário sem vínculo → não vê nenhum dado.
- Admin (dono) → vê todos os clientes.
- Script: dry-run mostra resumo coerente; após `--apply`, existe **uma só** org, o dono é
  o único ADMIN, demais são LEITOR sem clientes. Reexecução é no-op.

## Riscos
- **Migração em produção é destrutiva** (apaga orgs, rebaixa papéis). Mitigação: dry-run
  obrigatório + revisão do resumo + execução só com aprovação explícita do usuário; é uma
  leitura/escrita em banco de produção (passará pelo guard de produção).
- Identificar o usuário dono errado. Mitigação: o resumo do dry-run nomeia o ADMIN
  escolhido para confirmação antes do `--apply`.
