// Templates documentais iniciais. O corpo (contentTemplate) é HTML com
// placeholders no formato {{chave}} substituídos por src/lib/doc-generator.ts.
//
// Placeholders disponíveis:
//   {{cliente.nome}} {{cliente.cnpj}} {{cliente.segmento}} {{cliente.escopo}}
//   {{cliente.responsavel}} {{projeto.tipo}} {{normas}} {{requisito.codigo}}
//   {{requisito.titulo}} {{data}} {{codigoDocumento}}

export interface TemplateSeed {
  name: string;
  documentType: string; // MATRIZ | PROCEDIMENTO | POLITICA | PLANO
  applicableStandards: string[];
  applicableRequirementCodes: string[];
  description: string;
  defaultStructure: string[];
  contentTemplate: string;
}

const REVISION_CONTROL = `
<h2>Controle de Revisão</h2>
<table>
  <tr><th>Revisão</th><th>Data</th><th>Descrição da alteração</th><th>Responsável</th></tr>
  <tr><td>00</td><td>{{data}}</td><td>Emissão inicial</td><td>{{cliente.responsavel}}</td></tr>
</table>
<h2>Aprovação</h2>
<table>
  <tr><th>Elaborado por</th><th>Analisado por</th><th>Aprovado por</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
`;

const HEADER = `
<table>
  <tr><th>Documento</th><td>{{codigoDocumento}}</td><th>Revisão</th><td>00</td></tr>
  <tr><th>Cliente</th><td>{{cliente.nome}}</td><th>Data</th><td>{{data}}</td></tr>
  <tr><th>Normas de referência</th><td>{{normas}}</td><th>Requisito</th><td>{{requisito.codigo}} — {{requisito.titulo}}</td></tr>
</table>
`;

export const DOCUMENT_TEMPLATES: TemplateSeed[] = [
  {
    name: "Matriz SWOT",
    documentType: "MATRIZ",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["4.1"],
    description:
      "Análise de contexto interno e externo (forças, fraquezas, oportunidades e ameaças) para atender ao requisito de contexto da organização.",
    defaultStructure: [
      "Identificação",
      "Objetivo",
      "Análise do ambiente interno",
      "Análise do ambiente externo",
      "Matriz SWOT",
      "Análise consolidada",
      "Ações recomendadas",
      "Controle de revisão",
    ],
    contentTemplate: `
<h1>Matriz SWOT — Análise de Contexto</h1>
${HEADER}
<h2>1. Objetivo</h2>
<p>Este documento apresenta a análise do contexto interno e externo da organização <strong>{{cliente.nome}}</strong>, em atendimento ao requisito <strong>{{requisito.codigo}} — {{requisito.titulo}}</strong> da(s) norma(s) <strong>{{normas}}</strong>. A análise visa identificar as forças, fraquezas, oportunidades e ameaças pertinentes ao propósito e à direção estratégica da organização, subsidiando o planejamento do sistema de gestão e a determinação de riscos e oportunidades.</p>
<h2>2. Campo de Aplicação</h2>
<p>Aplica-se ao escopo do sistema de gestão da organização: {{cliente.escopo}}. Segmento de atuação: {{cliente.segmento}}.</p>
<h2>3. Análise do Ambiente Interno</h2>
<p>O ambiente interno compreende os fatores sobre os quais a organização possui governança e capacidade de atuação direta, tais como recursos, competências, cultura organizacional, infraestrutura, processos e desempenho.</p>
<h2>4. Análise do Ambiente Externo</h2>
<p>O ambiente externo compreende fatores que influenciam a organização, porém estão fora de seu controle direto, como mercado, concorrência, requisitos legais e regulatórios, tecnologia, economia, sociedade e meio ambiente.</p>
<h2>5. Matriz SWOT</h2>
<table>
  <tr><th>Forças (Strengths)</th><th>Fraquezas (Weaknesses)</th></tr>
  <tr><td>Descrever as forças internas identificadas.</td><td>Descrever as fraquezas internas identificadas.</td></tr>
  <tr><th>Oportunidades (Opportunities)</th><th>Ameaças (Threats)</th></tr>
  <tr><td>Descrever as oportunidades externas identificadas.</td><td>Descrever as ameaças externas identificadas.</td></tr>
</table>
<h2>6. Análise Consolidada</h2>
<p>Apresentar a leitura cruzada da matriz: como as forças podem aproveitar oportunidades, como mitigar ameaças, e como as fraquezas podem comprometer o alcance dos objetivos. Esta análise deve alimentar a matriz de riscos e oportunidades (requisito 6.1).</p>
<h2>7. Ações Recomendadas</h2>
<table>
  <tr><th>Questão identificada</th><th>Ação recomendada</th><th>Responsável</th><th>Prazo</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
${REVISION_CONTROL}
`,
  },
  {
    name: "Matriz PESTEL",
    documentType: "MATRIZ",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["4.1"],
    description:
      "Análise dos fatores externos (Políticos, Econômicos, Sociais, Tecnológicos, Ambientais e Legais) que influenciam a organização.",
    defaultStructure: [
      "Identificação",
      "Objetivo",
      "Fatores PESTEL",
      "Análise consolidada",
      "Controle de revisão",
    ],
    contentTemplate: `
<h1>Matriz PESTEL — Análise do Ambiente Externo</h1>
${HEADER}
<h2>1. Objetivo</h2>
<p>Analisar os fatores externos que influenciam a organização <strong>{{cliente.nome}}</strong>, em atendimento ao requisito <strong>{{requisito.codigo}} — {{requisito.titulo}}</strong> da(s) norma(s) <strong>{{normas}}</strong>.</p>
<h2>2. Fatores PESTEL</h2>
<table>
  <tr><th>Dimensão</th><th>Fatores identificados</th><th>Impacto para a organização</th></tr>
  <tr><td>Políticos</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Econômicos</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Sociais</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Tecnológicos</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Ambientais</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Legais</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
<h2>3. Análise Consolidada</h2>
<p>Apresentar as conclusões da análise e como os fatores externos se relacionam com os riscos e oportunidades do sistema de gestão.</p>
${REVISION_CONTROL}
`,
  },
  {
    name: "Política do Sistema de Gestão",
    documentType: "POLITICA",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["5.2"],
    description:
      "Política do sistema de gestão, apropriada ao propósito da organização, com compromissos de atendimento a requisitos e melhoria contínua.",
    defaultStructure: [
      "Identificação",
      "Declaração da política",
      "Compromissos",
      "Diretrizes",
      "Divulgação",
      "Controle de revisão",
    ],
    contentTemplate: `
<h1>Política do Sistema de Gestão</h1>
${HEADER}
<h2>1. Declaração da Política</h2>
<p>A <strong>{{cliente.nome}}</strong>, atuante no segmento de {{cliente.segmento}}, no âmbito do escopo {{cliente.escopo}}, estabelece a presente Política do Sistema de Gestão como expressão do seu comprometimento com a satisfação das partes interessadas e com a melhoria contínua, em conformidade com a(s) norma(s) <strong>{{normas}}</strong>.</p>
<h2>2. Compromissos</h2>
<p>A organização compromete-se a:</p>
<ul>
  <li>atender aos requisitos aplicáveis dos clientes, legais, regulatórios e das demais partes interessadas;</li>
  <li>estabelecer e analisar criticamente objetivos coerentes com esta política;</li>
  <li>prover os recursos necessários ao funcionamento do sistema de gestão;</li>
  <li>promover a conscientização e a competência das pessoas;</li>
  {{#norma:ISO 9001}}<li>assegurar a qualidade de produtos e serviços e o aumento da satisfação dos clientes;</li>{{/norma}}
  {{#norma:ISO 14001}}<li>proteger o meio ambiente, incluindo a prevenção da poluição e o uso sustentável de recursos;</li>{{/norma}}
  {{#norma:ISO 45001}}<li>prover condições de trabalho seguras e saudáveis, eliminando perigos e reduzindo os riscos de SSO, com a consulta e a participação dos trabalhadores;</li>{{/norma}}
  <li>melhorar continuamente a adequação, suficiência e eficácia do sistema de gestão.</li>
</ul>
{{#sgi}}<p>Esta política aplica-se ao <strong>Sistema de Gestão Integrado (SGI)</strong>, contemplando de forma harmonizada os requisitos das normas {{normas}}.</p>{{/sgi}}
<h2>3. Diretrizes</h2>
<p>Esta política fornece a estrutura para o estabelecimento e a análise crítica dos objetivos do sistema de gestão e orienta a tomada de decisão em todos os níveis da organização.</p>
<h2>4. Divulgação</h2>
<p>Esta política é documentada, mantida como informação documentada, comunicada e compreendida dentro da organização e disponibilizada às partes interessadas pertinentes.</p>
${REVISION_CONTROL}
`,
  },
  {
    name: "Procedimento de Comunicação",
    documentType: "PROCEDIMENTO",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["7.4"],
    description:
      "Procedimento que estabelece as comunicações internas e externas do sistema de gestão, integrando, quando aplicável, qualidade, meio ambiente e SST.",
    defaultStructure: [
      "Objetivo",
      "Campo de Aplicação",
      "Referências Normativas",
      "Termos e Definições",
      "Responsabilidades",
      "Descrição do Processo",
      "Entradas e Saídas",
      "Registros Gerados",
      "Controle de Revisão",
    ],
    contentTemplate: `
<h1>Procedimento de Comunicação</h1>
${HEADER}
<h2>1. Objetivo</h2>
<p>Estabelecer as diretrizes e responsabilidades para as comunicações internas e externas pertinentes ao sistema de gestão da <strong>{{cliente.nome}}</strong>, assegurando que as informações relevantes sejam transmitidas de forma clara, oportuna e controlada, em atendimento ao requisito <strong>{{requisito.codigo}} — {{requisito.titulo}}</strong> da(s) norma(s) <strong>{{normas}}</strong>.</p>
<h2>2. Campo de Aplicação</h2>
<p>Aplica-se a todas as comunicações relacionadas ao sistema de gestão, dentro do escopo {{cliente.escopo}}, abrangendo a comunicação interna entre os diversos níveis e funções e a comunicação externa com clientes, fornecedores, órgãos reguladores e demais partes interessadas. Quando o sistema for integrado, contempla as comunicações de qualidade, meio ambiente e segurança e saúde ocupacional.</p>
<h2>3. Referências Normativas</h2>
<p>{{normas}} e demais requisitos legais e regulatórios aplicáveis à organização.</p>
<h2>4. Termos e Definições</h2>
<p><strong>Comunicação interna:</strong> troca de informações entre os níveis e funções da organização. <strong>Comunicação externa:</strong> troca de informações com partes interessadas externas. <strong>Parte interessada:</strong> pessoa ou organização que pode afetar, ser afetada ou perceber-se afetada por uma decisão ou atividade.</p>
<h2>5. Responsabilidades</h2>
<table>
  <tr><th>Função</th><th>Responsabilidade</th></tr>
  <tr><td>Alta Direção</td><td>Assegurar recursos e definir diretrizes de comunicação.</td></tr>
  <tr><td>Representante do Sistema de Gestão</td><td>Manter este procedimento e a matriz de comunicação atualizados.</td></tr>
  <tr><td>Líderes de processo</td><td>Executar as comunicações de sua área e reter os registros.</td></tr>
</table>
<h2>6. Descrição do Processo</h2>
<h3>6.1 Planejamento da comunicação</h3>
<p>A organização determina, por meio da matriz de comunicação, <strong>o que</strong> será comunicado, <strong>quando</strong>, <strong>com quem</strong> (público-alvo), <strong>como</strong> (canal/meio) e <strong>quem comunica</strong> (responsável). São consideradas as necessidades das partes interessadas identificadas no requisito de contexto.</p>
<h3>6.2 Comunicação interna</h3>
<p>Compreende a divulgação da política e dos objetivos, resultados de indicadores, mudanças no sistema de gestão e demais informações pertinentes. Os canais podem incluir reuniões, murais, e-mails, diálogos diários e sistemas internos.</p>
{{#norma:ISO 9001}}<p><strong>Qualidade:</strong> comunicação de requisitos de clientes, alertas de qualidade, não conformidades de produto/serviço e resultados de satisfação do cliente.</p>{{/norma}}
{{#norma:ISO 14001}}<p><strong>Meio ambiente:</strong> comunicação dos aspectos e impactos ambientais significativos, requisitos legais ambientais, desempenho ambiental e instruções de resposta a emergências ambientais.</p>{{/norma}}
{{#norma:ISO 45001}}<p><strong>Saúde e segurança ocupacional:</strong> comunicação de perigos e riscos de SSO, ocorrências e quase-acidentes (near miss), resultados das investigações, diálogos de segurança (DDS) e deliberações da CIPA, assegurando a consulta e a participação dos trabalhadores.</p>{{/norma}}
<h3>6.3 Comunicação externa</h3>
<p>Compreende as comunicações com partes interessadas externas, incluindo as comunicações obrigatórias por requisitos legais, tratadas com prioridade e registradas.</p>
{{#norma:ISO 9001}}<p><strong>Qualidade:</strong> consultas, contratos, reclamações e pesquisas de satisfação de clientes; comunicação com fornecedores.</p>{{/norma}}
{{#norma:ISO 14001}}<p><strong>Meio ambiente:</strong> comunicação com órgãos ambientais (relatórios, condicionantes de licença), comunidade/vizinhança e atendimento a emergências ambientais.</p>{{/norma}}
{{#norma:ISO 45001}}<p><strong>Saúde e segurança ocupacional:</strong> comunicação com órgãos de fiscalização do trabalho, contratadas e prestadores de serviço quanto aos riscos e regras de SSO, e notificações legais de acidentes (CAT).</p>{{/norma}}
<h3>6.4 Recebimento e tratamento de comunicações</h3>
<p>As comunicações recebidas das partes interessadas são registradas, analisadas e encaminhadas ao responsável pertinente, com retorno ao remetente quando aplicável. Reclamações e manifestações relevantes podem originar tratamento de não conformidade e ações corretivas.</p>
<h2>7. Entradas e Saídas do Processo</h2>
<table>
  <tr><th>Entradas</th><th>Saídas</th></tr>
  <tr><td>Necessidades das partes interessadas; requisitos legais; resultados do sistema de gestão.</td><td>Comunicações realizadas; registros de comunicação; matriz de comunicação atualizada.</td></tr>
</table>
<h2>8. Registros Gerados</h2>
<ul>
  <li>Matriz de comunicação;</li>
  <li>Atas de reunião e listas de presença;</li>
  <li>Registros de comunicação externa (e-mails, ofícios, protocolos);</li>
  <li>Registros de tratamento de manifestações de partes interessadas.</li>
</ul>
${REVISION_CONTROL}
`,
  },
  {
    name: "Plano de Ação (5W2H)",
    documentType: "PLANO",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["6.1", "6.2", "10.2"],
    description:
      "Plano de ação no formato 5W2H para tratamento de riscos, objetivos, não conformidades e oportunidades de melhoria.",
    defaultStructure: ["Identificação", "Plano de ação 5W2H", "Acompanhamento", "Controle de revisão"],
    contentTemplate: `
<h1>Plano de Ação</h1>
${HEADER}
<h2>1. Objetivo</h2>
<p>Registrar e acompanhar as ações definidas para a organização <strong>{{cliente.nome}}</strong> relativas ao requisito <strong>{{requisito.codigo}} — {{requisito.titulo}}</strong> da(s) norma(s) <strong>{{normas}}</strong>.</p>
<h2>2. Plano de Ação (5W2H)</h2>
<table>
  <tr><th>O quê (What)</th><th>Por quê (Why)</th><th>Quem (Who)</th><th>Quando (When)</th><th>Onde (Where)</th><th>Como (How)</th><th>Quanto (How much)</th><th>Status</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Aberto</td></tr>
</table>
<h2>3. Acompanhamento</h2>
<p>As ações são monitoradas quanto ao cumprimento de prazos e à eficácia. Ações concluídas têm sua eficácia verificada e registrada.</p>
${REVISION_CONTROL}
`,
  },
  {
    name: "Procedimento de Auditoria Interna",
    documentType: "PROCEDIMENTO",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["9.2"],
    description:
      "Procedimento que estabelece o processo de auditorias internas do sistema de gestão.",
    defaultStructure: [
      "Objetivo",
      "Campo de Aplicação",
      "Referências Normativas",
      "Responsabilidades",
      "Descrição do Processo",
      "Registros Gerados",
      "Controle de Revisão",
    ],
    contentTemplate: `
<h1>Procedimento de Auditoria Interna</h1>
${HEADER}
<h2>1. Objetivo</h2>
<p>Estabelecer o processo para planejar, conduzir e relatar as auditorias internas do sistema de gestão da <strong>{{cliente.nome}}</strong>, verificando a conformidade e a eficácia da implementação, em atendimento ao requisito <strong>{{requisito.codigo}} — {{requisito.titulo}}</strong> da(s) norma(s) <strong>{{normas}}</strong>.</p>
<h2>2. Campo de Aplicação</h2>
<p>Aplica-se a todas as auditorias internas realizadas no escopo {{cliente.escopo}}.</p>
<h2>3. Referências Normativas</h2>
<p>{{normas}}; ABNT NBR ISO 19011 (diretrizes para auditoria de sistemas de gestão).</p>
<h2>4. Responsabilidades</h2>
<table>
  <tr><th>Função</th><th>Responsabilidade</th></tr>
  <tr><td>Representante do Sistema de Gestão</td><td>Elaborar o programa de auditorias e designar auditores.</td></tr>
  <tr><td>Auditor líder</td><td>Planejar e conduzir a auditoria, elaborar o relatório.</td></tr>
  <tr><td>Auditados</td><td>Disponibilizar evidências e tratar as constatações.</td></tr>
</table>
<h2>5. Descrição do Processo</h2>
<h3>5.1 Programa de auditoria</h3>
<p>É elaborado um programa anual considerando a importância dos processos, mudanças e resultados de auditorias anteriores.</p>
<h3>5.2 Planejamento da auditoria</h3>
<p>Para cada auditoria é elaborado um plano com escopo, critérios, datas, processos auditados e auditores. Os auditores não auditam o próprio trabalho.</p>
<h3>5.3 Execução</h3>
<p>A auditoria é conduzida com base em checklist, coletando evidências objetivas por meio de entrevistas, observação e análise de registros.</p>
<h3>5.4 Relato e tratamento</h3>
<p>As constatações (conformidades, não conformidades e oportunidades de melhoria) são registradas em relatório. As não conformidades originam ações corretivas conforme o procedimento aplicável.</p>
<h2>6. Registros Gerados</h2>
<ul>
  <li>Programa anual de auditorias;</li>
  <li>Plano de auditoria;</li>
  <li>Checklist de auditoria;</li>
  <li>Relatório de auditoria;</li>
  <li>Registros de ação corretiva decorrentes.</li>
</ul>
${REVISION_CONTROL}
`,
  },
  {
    name: "Procedimento de Tratamento de Não Conformidade",
    documentType: "PROCEDIMENTO",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["10.2", "8.7"],
    description:
      "Procedimento para tratamento de não conformidades e ações corretivas, com análise de causa raiz.",
    defaultStructure: [
      "Objetivo",
      "Campo de Aplicação",
      "Responsabilidades",
      "Descrição do Processo",
      "Registros Gerados",
      "Controle de Revisão",
    ],
    contentTemplate: `
<h1>Procedimento de Tratamento de Não Conformidade e Ação Corretiva</h1>
${HEADER}
<h2>1. Objetivo</h2>
<p>Estabelecer a sistemática para identificar, registrar, tratar e analisar a eficácia do tratamento de não conformidades da <strong>{{cliente.nome}}</strong>, em atendimento ao requisito <strong>{{requisito.codigo}} — {{requisito.titulo}}</strong> da(s) norma(s) <strong>{{normas}}</strong>.</p>
<h2>2. Campo de Aplicação</h2>
<p>Aplica-se a não conformidades originadas de auditorias, reclamações, monitoramento de processos, produtos/serviços não conformes e demais fontes, no escopo {{cliente.escopo}}.</p>
<h2>3. Responsabilidades</h2>
<table>
  <tr><th>Função</th><th>Responsabilidade</th></tr>
  <tr><td>Identificador</td><td>Registrar a não conformidade.</td></tr>
  <tr><td>Responsável pela área</td><td>Conduzir correção, análise de causa e ação corretiva.</td></tr>
  <tr><td>Representante do Sistema de Gestão</td><td>Acompanhar e verificar a eficácia.</td></tr>
</table>
<h2>4. Descrição do Processo</h2>
<h3>4.1 Identificação e registro</h3>
<p>A não conformidade é registrada no formulário de RAC, descrevendo o fato, o requisito não atendido e a evidência objetiva.</p>
<h3>4.2 Correção imediata e contenção</h3>
<p>São adotadas ações imediatas para controlar e corrigir a não conformidade e lidar com suas consequências.</p>
<h3>4.3 Análise de causa raiz</h3>
<p>Avalia-se a necessidade de ação para eliminar as causas, utilizando ferramentas como os 5 Porquês ou o Diagrama de Ishikawa.</p>
<h3>4.4 Ação corretiva e verificação de eficácia</h3>
<p>As ações corretivas são implementadas e, após prazo definido, sua eficácia é verificada. Atualiza-se a análise de riscos e oportunidades quando pertinente.</p>
<h2>5. Registros Gerados</h2>
<ul>
  <li>Formulário de RAC (Relatório de Ação Corretiva);</li>
  <li>Registros de análise de causa raiz;</li>
  <li>Registros de verificação de eficácia.</li>
</ul>
${REVISION_CONTROL}
`,
  },
  {
    name: "Ata de Análise Crítica pela Direção",
    documentType: "ATA",
    applicableStandards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    applicableRequirementCodes: ["9.3"],
    description:
      "Modelo de ata de análise crítica pela direção, cobrindo as entradas e saídas exigidas pela norma.",
    defaultStructure: ["Identificação", "Participantes", "Entradas", "Saídas/Decisões", "Controle de revisão"],
    contentTemplate: `
<h1>Ata de Análise Crítica pela Direção</h1>
${HEADER}
<h2>1. Participantes</h2>
<table>
  <tr><th>Nome</th><th>Função</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
<h2>2. Entradas Analisadas</h2>
<ul>
  <li>Situação de ações de análises críticas anteriores;</li>
  <li>Mudanças em questões internas e externas pertinentes ao sistema de gestão;</li>
  <li>Desempenho e eficácia do sistema (indicadores, satisfação do cliente, objetivos);</li>
  <li>Não conformidades e ações corretivas;</li>
  <li>Resultados de monitoramento e medição;</li>
  <li>Resultados de auditorias;</li>
  <li>Desempenho de provedores externos;</li>
  <li>Suficiência de recursos;</li>
  <li>Eficácia das ações para abordar riscos e oportunidades;</li>
  <li>Oportunidades de melhoria.</li>
</ul>
<h2>3. Saídas / Decisões</h2>
<table>
  <tr><th>Decisão / Ação</th><th>Responsável</th><th>Prazo</th></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
${REVISION_CONTROL}
`,
  },
];
