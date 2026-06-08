# ISO Implementation Manager

Ferramenta operacional para **consultores ISO** conduzirem clientes requisito por
requisito durante implantação, manutenção, diagnóstico e preparação para auditorias
de certificação. O sistema é construído em torno de **requisitos normativos**: cada
projeto materializa os requisitos da norma e o consultor percorre cada um verificando
evidências, gerando documentos, recebendo retornos e acompanhando o status.

> SGI multi-norma (ISO 9001/14001/45001/27001/37001/37301) com módulo de auditoria,
> exportação DOCX/PDF, versionamento de documentos, acesso multiusuário por papéis (RBAC),
> e-mail transacional, storage em nuvem, notificações e **assistente de IA** (Fase 4).
> Monetização/billing a definir com a equipe.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Prisma + SQLite (dev) — provider trocável para PostgreSQL em produção
- Tailwind CSS
- NextAuth/Auth.js v5 (Credentials, JWT) · Zod
- Multiusuário com **RBAC** (Organização + papéis)
- Exportação **DOCX** (`docx`) e **PDF** (motor próprio sobre `pdf-lib`, sem binários);
  pré-visualização de evidências com `mammoth`/`exceljs`

## Como rodar

```bash
npm install              # instala deps e gera o Prisma Client
npm run db:migrate       # cria o banco SQLite (prisma/dev.db)
npm run db:seed          # popula as 6 normas, templates, organização e usuário demo
npm run dev              # http://localhost:3000
```

**Usuário demo:** `consultor@iso.com` / `senha123`

## Fluxo principal

1. **Login** → Dashboard com métricas (clientes, projetos ativos, conclusão média, pendências).
2. **Clientes** → cadastrar empresa (CNPJ, segmento, escopo, responsável...).
3. **Projetos** → criar projeto ISO selecionando a(s) norma(s). A **trilha de requisitos**
   é gerada automaticamente a partir do catálogo das normas (deduplicada em SGI multi-norma).
4. **Trilha** (`/projetos/[id]`) → lista de requisitos com status + gráfico de progresso.
5. **Tela do requisito** → descrição, pergunta sugerida ao cliente, evidências esperadas,
   orientação ao consultor. Ações:
   - **Gerar evidência/documento** a partir de modelos contextualizados (cliente + normas + requisito);
   - **Editar** o documento (editor rico), **versionar** (histórico de revisões) e **exportar Word/PDF**;
   - **Ciclo de vida do documento**: enviar ao cliente → recebimento assinado → aprovação;
   - **Upload de evidência** recebida (com análise técnica e validade);
   - **Plano de ação** (5W2H), **comentários**, alteração de **status** e **% de conclusão**;
   - botão **Marcar como conforme**.
6. **Auditorias** (`/auditorias`) → planejar/registrar auditorias internas e externas, com
   checklist por requisito, constatações (NC/observação/oportunidade) e **relatório PDF/Word**.
7. **Relatórios** → diagnóstico por projeto (situação por requisito), com **Imprimir / PDF**.
8. **Equipe** (`/equipe`, só Administrador) → convidar usuários e definir papéis (RBAC).
9. **Configurações** → catálogo de normas e modelos de documentos.

## Estrutura

```
prisma/
  schema.prisma            modelos (User, Client, IsoProject, IsoStandard,
                           IsoRequirement, ProjectRequirement, Evidence,
                           GeneratedDocument, DocumentVersion, DocumentTemplate,
                           ActionPlan, RequirementComment, ProjectStandard,
                           Audit, AuditItem, AuditFinding,
                           Organization, Membership)
  seed.ts                  usuário/organização demo + 6 normas + templates
  data/                    catálogos de requisitos (iso9001/14001/45001/27001/37001/37301)
                           e templates documentais
  migrations/              init, document_versioning, audit_module, org_multiuser
src/
  auth.ts, auth.config.ts, middleware.ts   NextAuth v5 (Credentials, JWT)
  app/(auth)/              login / cadastro (cria organização + ADMIN)
  app/(dashboard)/         dashboard, clientes, projetos, auditorias, relatorios,
                           equipe, configuracoes
  app/api/                 auth, download/preview de evidência, export DOCX/PDF de
                           documento, relatório DOCX/PDF de auditoria
  components/              ui, layout, clients, projects, requirement, dashboard, audit, team
  lib/                     prisma, enums, validators (Zod), permissions (RBAC), session
                           (getContext/clientWhere), progress, doc-generator, docx-export,
                           pdf-export, audit-report, evidence-preview, storage, utils
scripts/                   smokes de verificação + migrações de dados
                           (dedupe-requirements, backfill-organizations)
storage/uploads/           arquivos de evidências (fora de /public, acesso controlado)
```

## Modelo de dados (resumo)

```
Organization → Membership (papel) ← User        (RBAC: ADMIN/CONSULTOR/AUDITOR/LEITOR/CLIENTE)
Organization → Client → IsoProject → ProjectRequirement → { Evidence, GeneratedDocument, ActionPlan, RequirementComment }
GeneratedDocument → DocumentVersion              (histórico de revisões)
IsoProject → Audit → { AuditItem (checklist por requisito), AuditFinding (constatações) }
IsoStandard → IsoRequirement                     (catálogo)
IsoProject ↔ IsoStandard                         (ProjectStandard, N:N)
```

O acesso a todo dado é escopado pela **organização** do usuário (e, no portal, pelo cliente
que ele representa) — ver [Multiusuário e permissões](#multiusuário-e-permissões-rbac).

`ProjectRequirement` é o **coração do sistema**: o acompanhamento de cada requisito
do projeto, com status, notas, percentual, evidências e documentos.

## Notas técnicas

- **SQLite** não suporta `enum` nem listas escalares: os status são `String` validados
  por unions TS/Zod (`src/lib/enums.ts`); campos "lista" (ex.: `applicableStandards`)
  são `String` contendo JSON. Em produção (Postgres) podem virar enums nativos / `String[]`.
- **Migração para PostgreSQL:** trocar `provider = "postgresql"` em `prisma/schema.prisma`,
  ajustar `DATABASE_URL` no `.env` e rodar `npx prisma migrate dev`.
- **Documentos:** templates ricos com placeholders (`{{cliente.nome}}`, `{{normas}}`,
  `{{requisito.codigo}}`...) preenchidos por `doc-generator.ts`; exportação **Word** por
  `docx-export.ts` e **PDF** por `pdf-export.ts` (layout próprio sobre `pdf-lib` — paginação,
  tabelas e rodapé, sem navegador headless). Editáveis e versionados antes de exportar.
- **Acesso:** todo `where` de cliente/projeto passa por `clientWhere(ctx)` (escopo por
  organização) e as gravações por `can(role, capability)` — ver `src/lib/session.ts` e
  `src/lib/permissions.ts`.

## Produção e variáveis de ambiente

Todas as integrações externas são **opcionais e com degradação graciosa**: sem a
variável correspondente, o recurso simplesmente fica inativo e o app continua
funcionando (e-mail → mostra o link na tela; storage → disco local; IA →
desabilitada). Copie `.env.example` para `.env` e preencha o que for usar.

| Variável | Função | Sem ela |
|----------|--------|---------|
| `DATABASE_URL` | Conexão do banco | (obrigatória) |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Assinatura das sessões JWT | (obrigatória) |
| `APP_URL` | Base pública para links de e-mail | usa `http://localhost:3000` |
| `RESEND_API_KEY` + `EMAIL_FROM` | E-mail transacional (Resend) | links exibidos na tela |
| `BLOB_READ_WRITE_TOKEN` | Storage em nuvem (Vercel Blob) | grava em `storage/uploads` |
| `ANTHROPIC_API_KEY` (+ `AI_MODEL`) | Assistente de IA (Claude) | recursos de IA desligados |

### Migrar para PostgreSQL

No dev usamos SQLite (zero setup). Para produção:

1. Em `prisma/schema.prisma`, troque `provider = "sqlite"` por `provider = "postgresql"`.
2. Em `prisma/migrations/migration_lock.toml`, troque `provider = "sqlite"` por `postgresql`.
3. Aponte `DATABASE_URL` para o Postgres (ver `.env.example`).
4. Gere o baseline e popule:
   ```bash
   rm -rf prisma/migrations/2026*           # baseline novo (dados de dev descartáveis)
   npx prisma migrate dev --name init_postgres
   npm run db:seed
   ```
   O schema é portável: status são `String` (validados em `src/lib/enums.ts`) e listas
   são JSON-em-String — nada exclusivo de SQLite.

### Storage em nuvem

`src/lib/storage.ts` seleciona o driver automaticamente: com `BLOB_READ_WRITE_TOKEN`
usa **Vercel Blob**; sem ele, grava em disco local. As assinaturas
(`saveUploadedFile` / `readStoredFile` / `saveBufferToUploads`) não mudam, então o
upload de evidências, a rota de download e a exportação de documentos funcionam nos
dois modos. O acesso continua mediado pelas rotas (o conteúdo é lido pelo servidor).

## Verificação

```bash
npx tsx scripts/smoke-docx.ts        # geração de documento + DOCX válido
npx tsx scripts/smoke-pdf.ts         # exportação PDF (multipágina + tabelas)
npx tsx scripts/smoke-versioning.ts  # versionamento (gerar → editar → restaurar)
npx tsx scripts/smoke-multinorm.ts   # SGI: dedup por código + doc multi-norma + ciclo de vida
npx tsx scripts/smoke-audit.ts       # auditoria: checklist + constatações + relatório PDF/DOCX
npx tsx scripts/smoke-multiuser.ts   # RBAC + isolamento por organização + portal do cliente
npx tsx scripts/smoke-email.ts       # tokens de auth (uso único) + mailer com degradação graciosa
npx tsx scripts/smoke-storage.ts     # storage: roundtrip gravar/ler (Blob ou disco local)
npx tsx scripts/smoke-notifications.ts # notificações derivadas (plano vencido detectado)
npx tsx scripts/smoke-ai.ts          # IA: gated por ANTHROPIC_API_KEY (no-op controlado sem chave)
npm run build                        # build de produção (tipos + rotas)
npm run db:studio                    # inspecionar dados (Prisma Studio)
```

## Roadmap

- **Fase 1 — MVP (concluída):** ISO 9001, trilha de requisitos, evidências, geração/edição/exportação DOCX, dashboard.
- **Fase 2 — SGI (concluída):** ISO 14001 e ISO 45001; **documentos integrados multi-norma** (blocos
  condicionais `{{#norma:...}}` / `{{#sgi}}` que adaptam o conteúdo às normas do projeto — ver
  Política e Procedimento de Comunicação); **matriz de evidências** consolidada; visualização online
  de evidências (PDF/imagem inline; DOCX/XLSX convertidos para HTML); tema claro/escuro.
- **Fase 3 — Produtização (concluída):** **versionamento de documentos** (histórico
  append-only de revisões, restauração); **ciclo de vida do documento** (envio ao cliente →
  recebimento assinado → aprovação, com carimbos de data e avanço automático do status do
  requisito); **deduplicação multi-norma** (ver abaixo); **exportação PDF robusta** (motor
  próprio sobre `pdf-lib`, sem binários/headless — quebra de linha, paginação, tabelas e
  rodapé com numeração — `src/lib/pdf-export.ts`); **módulo de auditoria** (ver abaixo);
  **multiusuário e permissões** (ver abaixo). Billing/monetização fica para uma fase futura
  (a definir com a equipe).
- **Normas no catálogo:** ISO 9001, 14001, 45001, **27001 (SGSI), 37001 (antissuborno) e
  37301 (compliance)** — com documentos integrados multi-norma e perspectivas próprias.
- **Fase 4 — IA (implementada, gated por `ANTHROPIC_API_KEY`):** avaliação de evidências
  (lê arquivo/visão e julga perante o requisito), sugestão de conformidade com
  justificativa e geração de plano de ação 5W2H. Sugestões são consultivas (campos `ai*`),
  aplicáveis pelo consultor. Sem a chave, os controles aparecem desabilitados. Ver
  `src/lib/ai/*` e `.../requisitos/[prId]/ai-actions.ts`.
- **E-mail / produção:** e-mail transacional via **Resend** (convite por link, redefinição
  de senha, verificação) com fallback que exibe o link na tela; **storage em nuvem** via
  Vercel Blob (fallback em disco); **notificações** derivadas (prazos vencidos, documentos
  e constatações pendentes); base **pronta para PostgreSQL**. Ver "Produção e variáveis de
  ambiente".

### Módulo de auditoria

Conduz **auditorias internas** (preparação) e **externas** (organismo certificador) sobre os
projetos dos clientes. Uma auditoria (`Audit`) é criada a partir de um projeto e **herda a trilha
de requisitos** (deduplicada) como **checklist** (`AuditItem`): para cada requisito o auditor
registra o resultado (conforme / não conforme / observação / oportunidade / não aplicável),
evidências amostradas e anotações. As **constatações** (`AuditFinding`) classificam não
conformidades (maior/menor), observações e oportunidades, com o tratamento completo (correção,
análise de causa-raiz, ação corretiva, responsável, prazo e situação). O **relatório de
auditoria** é exportável em **PDF e Word** (`src/lib/audit-report.ts` → `/api/audits/[id]/report`),
com objetivo/escopo/critérios, resumo de resultados, verificação por requisito, constatações e
conclusão. Páginas em `/auditorias`.

### Multiusuário e permissões (RBAC)

Os dados são escopados por **Organização** (`Organization`): vários usuários colaboram na mesma
consultoria via `Membership`, que define o **papel** de cada um. O escopo de acesso é centralizado
em `clientWhere(ctx)` (`src/lib/session.ts`) — toda consulta a clientes/projetos/auditorias passa
por ele; o cadastro cria a organização e o vínculo ADMIN automaticamente. Papéis e capacidades
(`src/lib/permissions.ts`, `can(role, capability)`):

| Papel | Capacidades |
|-------|-------------|
| **Administrador** | tudo + gerenciar membros (`/equipe`) |
| **Consultor** | clientes, projetos, trilha, documentos e auditorias |
| **Auditor** | conduzir auditorias + leitura do restante |
| **Leitor** | somente leitura |
| **Cliente (portal)** | restrito ao próprio cliente: lê documentos, envia evidências |

As *server actions* validam a capacidade antes de gravar e a UI oculta o que o papel não permite.
O **Administrador** convida membros em `/equipe` (papel interno ou Cliente vinculado a um cliente).
Projetos antigos foram normalizados para organizações com `scripts/backfill-organizations.ts`.

### Documentos integrados (SGI)

Os templates suportam blocos condicionais processados por `src/lib/doc-generator.ts`:

```html
{{#norma:ISO 14001}} ...conteúdo só se a ISO 14001 estiver no projeto... {{/norma}}
{{#sgi}} ...conteúdo só quando há mais de uma norma... {{/sgi}}
```

Assim, ao gerar um Procedimento de Comunicação para um projeto **ISO 9001 + 14001 + 45001**, o
documento inclui automaticamente as seções de qualidade, meio ambiente e SSO.

### Deduplicação de requisitos (SGI multi-norma)

Normas do mesmo Sistema de Gestão Integrado compartilham a estrutura de alto nível (Annex SL):
os requisitos 4.1, 5.1, 6.2… existem em todas elas. Por isso a **trilha lista cada requisito uma
única vez** (deduplicado por código em `createProject`), exibindo as normas às quais ele se aplica.
O **documento gerado**, por sua vez, contempla **todas as normas selecionadas**: traz as
perspectivas de qualidade/ambiental/SSO, a nota de SGI e a **lista de evidências esperadas mesclada**
das normas que compartilham aquele requisito.

Projetos criados antes dessa mudança podem ser normalizados sem perda de dados (evidências,
documentos, planos e comentários são reatribuídos ao requisito canônico):

```bash
npx tsx scripts/dedupe-requirements.ts
```
