# BRIEFING TÉCNICO — SISTEMA DE IMPLANTAÇÃO E MANUTENÇÃO DE CERTIFICAÇÃO ISO

## Objetivo do sistema

Criar uma nova aplicação chamada provisoriamente **ISO Implementation Manager**.

O objetivo é construir um sistema para uso diário de consultores ISO, permitindo conduzir clientes requisito por requisito durante processos de implantação, manutenção, diagnóstico e preparação para auditorias de certificação.

Este sistema NÃO deve ser tratado como um SGI genérico para cliente final. Ele deve ser uma ferramenta operacional para consultores que precisam:

- cadastrar clientes;
- vincular normas ISO aplicáveis;
- percorrer requisitos das normas sequencialmente;
- verificar evidências existentes;
- gerar evidências/documentos quando o cliente não possuir;
- exportar documentos em Word/PDF;
- enviar ao cliente;
- receber documentos assinados/preenchidos;
- subir arquivos como evidência;
- acompanhar status de implantação por requisito, norma e cliente.

---

# Stack recomendada

Usar stack moderna, simples e escalável:

- Next.js 15
- React 19
- TypeScript
- Prisma
- PostgreSQL
- Tailwind
- Zod
- NextAuth/Auth.js
- Geração DOCX
- Exportação PDF
- Upload de arquivos

Priorizar simplicidade inicial. O sistema deve começar como MVP funcional, mas com estrutura preparada para crescer.

---

# Conceito central do produto

O sistema deve ser construído em torno de **requisitos normativos**, e não apenas em torno de documentos.

A lógica principal deve ser:

```txt
Cliente
 └── Projeto ISO
      └── Norma aplicável
           └── Requisito
                └── Evidências esperadas
                └── Evidências geradas
                └── Evidências recebidas
                └── Status
                └── Observações
                └── Plano de ação
```

Exemplo prático:

```txt
Cliente: Empresa ABC
Projeto: Implantação ISO 9001
Norma: ISO 9001
Requisito: 4.1 Contexto da organização
Evidência esperada: Matriz SWOT
Ação: Gerar SWOT
Exportar: Word/PDF
Upload posterior: SWOT assinada/preenchida
Status: Evidência recebida / Conforme
```

---

# Importante sobre o exemplo 4.1

O requisito 4.1 com Matriz SWOT é apenas um exemplo.

O sistema deve funcionar para todos os requisitos aplicáveis das normas cadastradas.

Exemplos:

- Para requisito de contexto, pode gerar SWOT, PESTEL ou diagnóstico de contexto.
- Para requisito de comunicação, pode gerar procedimento de comunicação, matriz de comunicação ou plano de comunicação.
- Para requisito de controle operacional, pode gerar procedimento operacional.
- Para requisito de competência, pode gerar matriz de competência ou procedimento de treinamento.
- Para requisito de auditoria interna, pode gerar procedimento de auditoria interna, plano de auditoria, checklist e relatório.
- Para requisito de não conformidade, pode gerar procedimento de tratamento de NC e formulário de RAC.
- Para requisito de análise crítica, pode gerar ata ou modelo de análise crítica.

---

# Regra essencial para geração de evidências

O botão **Gerar Evidência** deve considerar:

1. Cliente selecionado;
2. Norma ou normas vinculadas ao projeto;
3. Requisito normativo selecionado;
4. Evidências esperadas para aquele requisito;
5. Particularidades de cada norma aplicável;
6. Tipo de documento necessário;
7. Se a evidência atende uma norma ou múltiplas normas simultaneamente.

Exemplo:

Se o cliente possui:

- ISO 9001;
- ISO 14001;
- ISO 45001;

e o requisito exige comunicação, o sistema deve gerar um procedimento de comunicação que contemple, quando aplicável:

- comunicação interna e externa;
- comunicação de qualidade;
- comunicação ambiental;
- comunicação de SST;
- partes interessadas;
- responsabilidades;
- canais;
- frequência;
- registros;
- tratativas;
- retenção de informação documentada.

O documento gerado não deve ser genérico demais. Ele deve observar as normas envolvidas.

---

# Estilo dos documentos gerados

Os documentos gerados pelo sistema NÃO devem ser excessivamente simples.

Eles podem e devem ser discursivos, explicativos e adequados a um sistema de gestão profissional.

Procedimentos e Instruções de Trabalho devem conter texto suficiente para orientar a execução real do processo.

Cada etapa deve poder ter descrição detalhada.

## Estrutura esperada para procedimentos

```txt
1. Objetivo
2. Campo de Aplicação
3. Referências Normativas
4. Termos e Definições
5. Responsabilidades
6. Descrição do Processo
   6.1 Etapa 1
       Explicação detalhada da etapa
   6.2 Etapa 2
       Explicação detalhada da etapa
   6.3 Etapa 3
       Explicação detalhada da etapa
7. Entradas e Saídas do Processo
8. Registros Gerados
9. Indicadores, quando aplicável
10. Riscos e Controles, quando aplicável
11. Anexos, quando aplicável
12. Controle de Revisão
```

## Estrutura esperada para instruções de trabalho

```txt
1. Objetivo
2. Aplicação
3. Materiais, Sistemas ou Recursos Necessários
4. Responsabilidades
5. Passo a Passo Operacional
   5.1 Passo 1
       Descrição detalhada
   5.2 Passo 2
       Descrição detalhada
   5.3 Passo 3
       Descrição detalhada
6. Critérios de Aceitação
7. Registros
8. Cuidados, Riscos e Pontos de Atenção
9. Controle de Revisão
```

---

# Fluxo principal de uso

## 1. Cadastro do cliente

O consultor cadastra:

- nome do cliente;
- CNPJ, opcional;
- unidade, opcional;
- responsável do cliente;
- contato;
- segmento;
- escopo;
- observações.

## 2. Criação do projeto ISO

O consultor cria um projeto para o cliente.

Exemplos:

- Implantação ISO 9001;
- Manutenção ISO 14001;
- Diagnóstico ISO 45001;
- SGI 9001 + 14001 + 45001;
- Preparação para auditoria externa.

Campos:

- cliente;
- tipo de projeto;
- normas aplicáveis;
- data de início;
- prazo;
- responsável;
- status;
- observações.

## 3. Seleção das normas

O consultor seleciona uma ou mais normas:

- ISO 9001;
- ISO 14001;
- ISO 45001;
- ISO 27001;
- ISO 37001;
- ISO 37301.

O sistema deve gerar a trilha de requisitos da norma.

## 4. Trilha de requisitos

O sistema deve apresentar os requisitos sequencialmente.

Exemplo:

```txt
ISO 9001
4.1 Contexto da organização
4.2 Partes interessadas
4.3 Escopo do SGQ
4.4 Sistema de gestão e processos
5.1 Liderança
5.2 Política
...
10.3 Melhoria contínua
```

Cada requisito deve possuir:

- código;
- título;
- descrição simplificada;
- orientação para o consultor;
- evidências esperadas;
- templates disponíveis;
- status;
- observações;
- responsável;
- prazo;
- arquivos anexados;
- documentos gerados.

## 5. Abordagem consultiva no cliente

O sistema deve apoiar o consultor na conversa prática com o cliente.

Exemplo:

```txt
Requisito 4.1 — Contexto da Organização

Pergunta sugerida:
A empresa possui análise formal do contexto interno e externo?

Evidências possíveis:
- Matriz SWOT
- Matriz PESTEL
- Diagnóstico estratégico
- Ata de reunião de planejamento
```

Se o cliente possuir a evidência, o consultor faz upload.

Se não possuir, o consultor clica em:

```txt
Gerar Evidência
```

## 6. Geração de evidência

Ao clicar em **Gerar Evidência**, o sistema deve sugerir os modelos aplicáveis.

Exemplo para 4.1:

- Gerar Matriz SWOT;
- Gerar Matriz PESTEL;
- Gerar Diagnóstico de Contexto.

Exemplo para comunicação:

- Gerar Procedimento de Comunicação;
- Gerar Matriz de Comunicação;
- Gerar Plano de Comunicação.

Exemplo para auditoria interna:

- Gerar Procedimento de Auditoria Interna;
- Gerar Plano de Auditoria;
- Gerar Checklist de Auditoria;
- Gerar Relatório de Auditoria.

O sistema deve preencher o documento com base em:

- cliente;
- normas do projeto;
- requisito;
- tipo de evidência;
- escopo informado;
- dados já cadastrados;
- texto padrão profissional.

## 7. Edição do documento gerado

Após gerar, o consultor deve poder:

- visualizar;
- editar;
- complementar;
- salvar;
- exportar Word;
- exportar PDF.

## 8. Envio ao cliente

O sistema deve permitir registrar que o documento foi enviado ao cliente.

Status possíveis:

- Não iniciado;
- Solicitado ao cliente;
- Gerado pelo sistema;
- Enviado ao cliente;
- Recebido do cliente;
- Em análise;
- Conforme;
- Parcial;
- Não conforme;
- Não aplicável.

## 9. Upload de evidência recebida

Quando o cliente devolver o arquivo preenchido/assinado, o consultor deve poder fazer upload da evidência no requisito correspondente.

Campos do upload:

- nome do arquivo;
- tipo de evidência;
- requisito vinculado;
- norma vinculada;
- data de recebimento;
- validade, se houver;
- observações;
- status da análise.

## 10. Avaliação da evidência

O consultor deve avaliar:

- atende;
- atende parcialmente;
- não atende;
- não aplicável.

Deve haver campo para comentário técnico.

Exemplo:

```txt
A matriz SWOT foi apresentada, porém não há evidência de análise de partes interessadas nem definição de ações relacionadas às ameaças identificadas.
```

## 11. Plano de ação

Se a evidência for parcial ou não conforme, o sistema deve permitir criar plano de ação.

Campos:

- ação;
- responsável;
- prazo;
- status;
- prioridade;
- vínculo com requisito;
- vínculo com cliente;
- vínculo com norma.

## 12. Relatórios

O sistema deve gerar relatórios:

- diagnóstico por cliente;
- status por norma;
- status por requisito;
- evidências pendentes;
- evidências recebidas;
- documentos gerados;
- plano de ação;
- relatório final de implantação;
- relatório de preparação para auditoria.

Exportar:

- PDF;
- Word;
- Excel, opcional futuramente.

---

# Módulos mínimos do MVP

## 1. Autenticação

- login;
- cadastro;
- sessão;
- usuário consultor.

Inicialmente pode ser simples.

## 2. Clientes

CRUD de clientes.

## 3. Projetos ISO

CRUD de projetos por cliente.

## 4. Normas

Catálogo inicial das normas.

Começar preferencialmente com:

- ISO 9001;
- ISO 14001;
- ISO 45001;
- ISO 27001;
- ISO 37001;
- ISO 37301.

Depois expandir.

## 5. Requisitos

Banco de requisitos por norma.

Cada requisito deve ter:

- norma;
- código;
- título;
- descrição;
- orientação ao consultor;
- evidências esperadas;
- tipos de templates vinculados.

## 6. Trilha de implantação

Tela principal do sistema.

Deve permitir navegar requisito por requisito.

## 7. Evidências

- upload;
- vínculo com requisito;
- status;
- comentários;
- validade;
- histórico.

## 8. Templates

Templates documentais vinculados aos requisitos.

Exemplos iniciais:

- Matriz SWOT;
- Matriz PESTEL;
- Procedimento de Comunicação;
- Matriz de Comunicação;
- Política do Sistema de Gestão;
- Procedimento de Auditoria Interna;
- Procedimento de Não Conformidade;
- Plano de Ação;
- Ata de Análise Crítica;
- Mapa de Processos;
- Matriz de Riscos e Oportunidades;
- Matriz de Competência;
- Plano de Treinamento.

## 9. Geração de documentos

Geração de evidências em:

- Word;
- PDF.

## 10. Dashboard

Dashboard simples com:

- clientes ativos;
- projetos ativos;
- percentual de conclusão;
- requisitos conformes;
- requisitos pendentes;
- evidências pendentes;
- documentos gerados.

---

# Modelo de dados sugerido

Criar modelos equivalentes a:

```txt
User
Client
IsoProject
IsoStandard
IsoRequirement
ProjectRequirement
Evidence
GeneratedDocument
DocumentTemplate
ActionPlan
RequirementComment
```

## Relação principal

```txt
Client
 └── IsoProject
      └── ProjectRequirement
           └── Evidence
           └── GeneratedDocument
           └── ActionPlan
           └── RequirementComment
```

---

# ProjectRequirement

Este é o coração do sistema.

Cada projeto deve gerar seus próprios requisitos de acompanhamento a partir do catálogo da norma.

Campos sugeridos:

```txt
id
projectId
standardId
requirementId
status
consultantNotes
clientNotes
responsible
dueDate
completionPercent
createdAt
updatedAt
```

---

# Evidence

Campos sugeridos:

```txt
id
projectRequirementId
title
type
fileUrl
fileName
receivedAt
expiresAt
status
technicalAnalysis
createdAt
updatedAt
```

---

# GeneratedDocument

Campos sugeridos:

```txt
id
projectRequirementId
templateId
title
contentHtml
contentJson
exportedDocxUrl
exportedPdfUrl
status
sentToClientAt
signedReceivedAt
createdAt
updatedAt
```

---

# DocumentTemplate

Campos sugeridos:

```txt
id
name
documentType
applicableStandards
applicableRequirementCodes
description
defaultStructure
contentTemplate
isActive
createdAt
updatedAt
```

---

# Status recomendados

## ProjectRequirementStatus

```txt
NAO_INICIADO
SOLICITADO_CLIENTE
GERADO_SISTEMA
ENVIADO_CLIENTE
RECEBIDO_CLIENTE
EM_ANALISE
CONFORME
PARCIAL
NAO_CONFORME
NAO_APLICAVEL
```

## EvidenceStatus

```txt
PENDENTE
RECEBIDA
EM_ANALISE
ACEITA
PARCIAL
REJEITADA
VENCIDA
```

## DocumentStatus

```txt
RASCUNHO
GERADO
EXPORTADO
ENVIADO_CLIENTE
RECEBIDO_ASSINADO
APROVADO
```

---

# Requisitos de UX

A tela principal deve ser simples e consultiva.

## Tela do projeto

Exibir:

```txt
Cliente: Empresa ABC
Projeto: Implantação ISO 9001
Normas: ISO 9001
Conclusão: 35%
```

Lista de requisitos:

```txt
4.1 Contexto da organização — Parcial
4.2 Partes interessadas — Não iniciado
4.3 Escopo — Conforme
```

## Tela do requisito

Exibir:

- código;
- título;
- texto explicativo;
- pergunta sugerida para fazer ao cliente;
- evidências esperadas;
- documentos que o sistema pode gerar;
- arquivos anexados;
- status;
- plano de ação;
- comentários.

Botões:

```txt
Gerar Evidência
Upload Evidência
Exportar Relatório do Requisito
Criar Plano de Ação
Marcar como Conforme
```

---

# Regras para documentos gerados

1. Documento deve citar as normas consideradas.
2. Documento deve citar o requisito ou requisitos atendidos.
3. Documento deve conter estrutura profissional.
4. Documento deve ser editável antes da exportação.
5. Documento não deve ser excessivamente resumido.
6. Procedimentos devem ser discursivos e explicativos.
7. Instruções de trabalho devem ter passo a passo detalhado.
8. Quando múltiplas normas estiverem vinculadas, o documento deve integrar requisitos comuns.
9. O documento deve conter controle de revisão.
10. O documento deve conter campos para aprovação/assinatura, quando aplicável.

---

# Exemplo de comportamento esperado

## Cenário 1

Projeto:

```txt
Cliente: Empresa ABC
Normas: ISO 9001
Requisito: 4.1
```

Sistema sugere:

```txt
Evidências:
- Matriz SWOT
- Matriz PESTEL
- Diagnóstico de contexto
```

Botão:

```txt
Gerar Matriz SWOT
```

Documento gerado deve conter:

- identificação do cliente;
- objetivo;
- referência à ISO 9001;
- requisito 4.1;
- matriz de forças;
- matriz de fraquezas;
- oportunidades;
- ameaças;
- análise consolidada;
- ações recomendadas;
- aprovação.

## Cenário 2

Projeto:

```txt
Cliente: Empresa ABC
Normas: ISO 9001 + ISO 14001 + ISO 45001
Requisito: Comunicação
```

Sistema sugere:

```txt
Gerar Procedimento de Comunicação
Gerar Matriz de Comunicação
```

O procedimento deve considerar:

- comunicação interna;
- comunicação externa;
- qualidade;
- meio ambiente;
- SST;
- partes interessadas;
- emergências;
- órgãos externos;
- requisitos legais;
- responsabilidades;
- registros;
- canais;
- frequência;
- retenção de informação documentada.

O documento deve ser discursivo e completo.

---

# Roadmap inicial

## Fase 1 — MVP funcional

- Criar projeto base.
- Criar autenticação simples.
- Criar CRUD de clientes.
- Criar CRUD de projetos.
- Criar catálogo ISO 9001.
- Criar trilha de requisitos.
- Criar upload de evidência.
- Criar geração básica de documentos.
- Criar exportação DOCX.
- Criar dashboard básico.

## Fase 2 — Expansão SGI

- Adicionar ISO 14001.
- Adicionar ISO 45001.
- Criar documentos integrados para múltiplas normas.
- Criar matriz de evidências.
- Criar planos de ação.
- Criar relatório final.

## Fase 3 — Produtização

- PDF robusto.
- Assinatura.
- Controle de versão.
- Permissões.
- Multiusuário.
- Billing.
- Templates avançados.
- Importação/exportação.

## Fase 4 — IA

- IA para gerar documentos.
- IA para avaliar evidências.
- IA para sugerir conformidade.
- IA para gerar plano de ação.
- IA para analisar lacunas documentais.

---

# Critérios de aceite do MVP

Ao final do MVP, o consultor deve conseguir:

1. cadastrar um cliente;
2. criar um projeto ISO 9001;
3. abrir a trilha de requisitos da ISO 9001;
4. clicar em um requisito;
5. ver evidências esperadas;
6. gerar uma evidência/documento;
7. editar o documento;
8. exportar em Word;
9. fazer upload de uma evidência recebida;
10. alterar status do requisito;
11. acompanhar percentual de implantação.

---

# Comportamento esperado do Claude Code

Antes de implementar:

1. analisar a estrutura desejada;
2. propor arquitetura;
3. propor modelagem Prisma;
4. propor rotas/telas;
5. propor fases de implementação.

Depois implementar incrementalmente.

Não tentar construir tudo de uma vez.

Começar pelo MVP funcional.

Evitar overengineering.

Priorizar a experiência prática do consultor.
