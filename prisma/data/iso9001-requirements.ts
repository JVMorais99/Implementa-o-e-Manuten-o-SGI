// Catálogo de requisitos da ISO 9001:2015 (cláusulas 4 a 10).
// Cada item alimenta a trilha de implantação do consultor.

export interface RequirementSeed {
  code: string;
  title: string;
  description: string;
  consultantGuidance: string;
  suggestedQuestion: string;
  expectedEvidence: string[];
}

export const ISO9001_REQUIREMENTS: RequirementSeed[] = [
  {
    code: "4.1",
    title: "Contexto da organização",
    description:
      "A organização deve determinar questões internas e externas pertinentes ao seu propósito e direção estratégica que afetam a capacidade de alcançar os resultados pretendidos do sistema de gestão da qualidade.",
    consultantGuidance:
      "Conduza uma análise estruturada do ambiente interno e externo. Ferramentas como SWOT e PESTEL ajudam a evidenciar o entendimento do contexto. Garanta que as questões levantadas sejam monitoradas e analisadas criticamente.",
    suggestedQuestion:
      "A empresa possui uma análise formal e atualizada do seu contexto interno e externo (forças, fraquezas, oportunidades e ameaças)?",
    expectedEvidence: [
      "Matriz SWOT",
      "Matriz PESTEL",
      "Diagnóstico estratégico de contexto",
      "Ata de reunião de planejamento estratégico",
    ],
  },
  {
    code: "4.2",
    title: "Necessidades e expectativas de partes interessadas",
    description:
      "A organização deve determinar as partes interessadas pertinentes ao SGQ e seus requisitos, monitorando e analisando criticamente essas informações.",
    consultantGuidance:
      "Identifique clientes, fornecedores, colaboradores, órgãos reguladores e demais partes interessadas. Para cada uma, mapeie necessidades, expectativas e requisitos aplicáveis.",
    suggestedQuestion:
      "Existe um levantamento documentado das partes interessadas e dos requisitos de cada uma delas?",
    expectedEvidence: [
      "Matriz de partes interessadas",
      "Levantamento de requisitos das partes interessadas",
      "Mapa de stakeholders",
    ],
  },
  {
    code: "4.3",
    title: "Escopo do sistema de gestão da qualidade",
    description:
      "A organização deve determinar os limites e a aplicabilidade do SGQ para estabelecer o seu escopo, considerando questões internas/externas, requisitos das partes interessadas e produtos/serviços.",
    consultantGuidance:
      "Defina claramente os limites do SGQ (unidades, processos, produtos/serviços). Justifique eventuais exclusões de requisitos da norma.",
    suggestedQuestion:
      "O escopo do SGQ está documentado, incluindo justificativa para eventuais requisitos não aplicáveis?",
    expectedEvidence: [
      "Declaração de escopo do SGQ",
      "Documento de justificativa de exclusões",
    ],
  },
  {
    code: "4.4",
    title: "Sistema de gestão da qualidade e seus processos",
    description:
      "A organização deve estabelecer, implementar, manter e melhorar continuamente o SGQ, incluindo os processos necessários e suas interações.",
    consultantGuidance:
      "Mapeie os processos do SGQ, suas entradas, saídas, sequência, interações, indicadores e responsáveis. Um mapa de processos (turtle diagram) é uma boa evidência.",
    suggestedQuestion:
      "Os processos do SGQ estão mapeados, com entradas, saídas, indicadores e responsáveis definidos?",
    expectedEvidence: [
      "Mapa de processos",
      "Fluxogramas de processo",
      "Matriz de interação de processos",
      "Diagramas de tartaruga (turtle)",
    ],
  },
  {
    code: "5.1",
    title: "Liderança e comprometimento",
    description:
      "A Alta Direção deve demonstrar liderança e comprometimento com relação ao SGQ e ao foco no cliente.",
    consultantGuidance:
      "Evidencie a atuação da liderança: definição de política e objetivos, disponibilização de recursos, promoção da melhoria e do foco no cliente. Atas de reunião e comunicados internos ajudam.",
    suggestedQuestion:
      "Como a Alta Direção demonstra, na prática, seu comprometimento com o sistema de gestão e com o foco no cliente?",
    expectedEvidence: [
      "Ata de análise crítica pela direção",
      "Comunicados da liderança",
      "Evidências de provisão de recursos",
    ],
  },
  {
    code: "5.2",
    title: "Política da qualidade",
    description:
      "A Alta Direção deve estabelecer, implementar e manter uma política da qualidade apropriada ao propósito e contexto da organização.",
    consultantGuidance:
      "A política deve ser apropriada ao propósito, prover estrutura para objetivos, incluir compromisso com requisitos aplicáveis e melhoria contínua, estar documentada, comunicada e disponível às partes interessadas.",
    suggestedQuestion:
      "Existe uma política da qualidade documentada, comunicada e compreendida por todos os níveis da organização?",
    expectedEvidence: [
      "Política do sistema de gestão",
      "Evidência de divulgação da política",
      "Registro de conscientização sobre a política",
    ],
  },
  {
    code: "5.3",
    title: "Papéis, responsabilidades e autoridades",
    description:
      "A Alta Direção deve assegurar que responsabilidades e autoridades para papéis pertinentes sejam atribuídas, comunicadas e entendidas.",
    consultantGuidance:
      "Defina responsabilidades e autoridades em organograma, descrições de cargo e/ou matriz de responsabilidades (RACI).",
    suggestedQuestion:
      "As responsabilidades e autoridades relacionadas ao SGQ estão definidas e comunicadas (organograma, descrições de cargo)?",
    expectedEvidence: [
      "Organograma",
      "Matriz de responsabilidades (RACI)",
      "Descrições de cargo",
    ],
  },
  {
    code: "6.1",
    title: "Ações para abordar riscos e oportunidades",
    description:
      "Ao planejar o SGQ, a organização deve determinar riscos e oportunidades e planejar ações para abordá-los, integrando-as aos processos do SGQ.",
    consultantGuidance:
      "Construa uma matriz de riscos e oportunidades vinculada ao contexto (4.1) e às partes interessadas (4.2). Defina ações, responsáveis e avaliação de eficácia.",
    suggestedQuestion:
      "A empresa identifica e trata formalmente os riscos e oportunidades que afetam o SGQ?",
    expectedEvidence: [
      "Matriz de riscos e oportunidades",
      "Plano de ação para tratamento de riscos",
      "Avaliação de eficácia das ações",
    ],
  },
  {
    code: "6.2",
    title: "Objetivos da qualidade e planejamento",
    description:
      "A organização deve estabelecer objetivos da qualidade nas funções, níveis e processos pertinentes, e planejar como alcançá-los.",
    consultantGuidance:
      "Os objetivos devem ser mensuráveis, coerentes com a política, monitorados e comunicados. Cada objetivo deve ter plano: o que, recursos, responsável, prazo e avaliação.",
    suggestedQuestion:
      "Existem objetivos da qualidade mensuráveis, com indicadores, metas e planos para alcançá-los?",
    expectedEvidence: [
      "Quadro de objetivos e metas da qualidade",
      "Indicadores de desempenho (KPIs)",
      "Plano de ação para objetivos",
    ],
  },
  {
    code: "6.3",
    title: "Planejamento de mudanças",
    description:
      "Quando a organização determina a necessidade de mudanças no SGQ, estas devem ser realizadas de forma planejada.",
    consultantGuidance:
      "Estabeleça um procedimento/registro de gestão de mudanças considerando propósito, integridade do SGQ, recursos e responsabilidades.",
    suggestedQuestion:
      "As mudanças no sistema de gestão são planejadas e controladas de forma estruturada?",
    expectedEvidence: [
      "Procedimento de gestão de mudanças",
      "Registros de análise de mudanças",
    ],
  },
  {
    code: "7.1",
    title: "Recursos",
    description:
      "A organização deve determinar e prover os recursos necessários para o SGQ, incluindo pessoas, infraestrutura, ambiente, recursos de monitoramento/medição e conhecimento organizacional.",
    consultantGuidance:
      "Verifique provisão de pessoas, infraestrutura, ambiente de processo, recursos de medição (com calibração) e gestão do conhecimento organizacional.",
    suggestedQuestion:
      "A organização provê e mantém a infraestrutura, o ambiente e os recursos de medição necessários (incluindo calibração)?",
    expectedEvidence: [
      "Plano de manutenção de infraestrutura",
      "Plano de calibração de equipamentos",
      "Registro de conhecimento organizacional",
    ],
  },
  {
    code: "7.2",
    title: "Competência",
    description:
      "A organização deve determinar a competência necessária das pessoas, assegurá-la com base em educação, treinamento ou experiência e reter informação documentada.",
    consultantGuidance:
      "Defina requisitos de competência por função (matriz de competências), avalie lacunas e planeje treinamentos, retendo evidências.",
    suggestedQuestion:
      "Existe uma matriz de competências por função e evidências de que as competências necessárias são atendidas?",
    expectedEvidence: [
      "Matriz de competência",
      "Plano de treinamento",
      "Registros/certificados de treinamento",
    ],
  },
  {
    code: "7.3",
    title: "Conscientização",
    description:
      "As pessoas que realizam trabalho sob o controle da organização devem estar conscientes da política, objetivos, sua contribuição e implicações de não conformidade.",
    consultantGuidance:
      "Promova ações de conscientização (integração, campanhas, DDS) e mantenha registros de participação.",
    suggestedQuestion:
      "Os colaboradores conhecem a política da qualidade, os objetivos e a sua contribuição para o SGQ?",
    expectedEvidence: [
      "Registros de conscientização/integração",
      "Lista de presença de campanhas",
    ],
  },
  {
    code: "7.4",
    title: "Comunicação",
    description:
      "A organização deve determinar as comunicações internas e externas pertinentes ao SGQ, incluindo o que, quando, com quem, como e quem comunica.",
    consultantGuidance:
      "Estabeleça uma matriz/plano de comunicação e, quando aplicável, um procedimento de comunicação cobrindo comunicação interna e externa, partes interessadas, canais, frequência, responsáveis e registros.",
    suggestedQuestion:
      "A empresa possui um plano ou matriz de comunicação definindo o que, quando, com quem e como comunicar?",
    expectedEvidence: [
      "Procedimento de comunicação",
      "Matriz de comunicação",
      "Plano de comunicação",
    ],
  },
  {
    code: "7.5",
    title: "Informação documentada",
    description:
      "O SGQ deve incluir a informação documentada requerida pela norma e a determinada como necessária. Deve haver controle de criação, atualização e controle de documentos e registros.",
    consultantGuidance:
      "Implante um procedimento de controle de informação documentada (identificação, formato, análise/aprovação, distribuição, controle de versões, retenção e disposição).",
    suggestedQuestion:
      "Existe um procedimento de controle de documentos e registros, com controle de versões e retenção definida?",
    expectedEvidence: [
      "Procedimento de controle de informação documentada",
      "Lista mestra de documentos",
      "Tabela de retenção de registros",
    ],
  },
  {
    code: "8.1",
    title: "Planejamento e controle operacionais",
    description:
      "A organização deve planejar, implementar e controlar os processos necessários para atender aos requisitos para a provisão de produtos e serviços.",
    consultantGuidance:
      "Estabeleça critérios de processo, controles e informação documentada que dê confiança de que os processos foram conduzidos conforme planejado.",
    suggestedQuestion:
      "Os processos operacionais possuem critérios definidos e são controlados conforme planejado?",
    expectedEvidence: [
      "Procedimentos operacionais",
      "Instruções de trabalho",
      "Planos de controle / planos da qualidade",
    ],
  },
  {
    code: "8.2",
    title: "Requisitos para produtos e serviços",
    description:
      "A organização deve determinar e analisar criticamente os requisitos relativos aos produtos e serviços antes de se comprometer a fornecê-los, incluindo comunicação com o cliente.",
    consultantGuidance:
      "Evidencie análise crítica de pedidos/contratos e a comunicação com o cliente (consultas, contratos, tratamento de reclamações).",
    suggestedQuestion:
      "Os requisitos de produtos/serviços e dos clientes são analisados criticamente antes do compromisso de fornecimento?",
    expectedEvidence: [
      "Procedimento de análise crítica de contrato",
      "Registros de análise crítica de pedidos",
      "Procedimento de atendimento ao cliente",
    ],
  },
  {
    code: "8.3",
    title: "Projeto e desenvolvimento",
    description:
      "Quando aplicável, a organização deve estabelecer um processo de projeto e desenvolvimento, com entradas, controles, saídas e gestão de mudanças.",
    consultantGuidance:
      "Se aplicável ao escopo, documente planejamento, entradas, análises críticas, verificação, validação e controle de alterações de projeto. Caso não aplicável, justifique como exclusão.",
    suggestedQuestion:
      "A organização realiza projeto e desenvolvimento de produtos/serviços? Se sim, o processo é controlado e documentado?",
    expectedEvidence: [
      "Procedimento de projeto e desenvolvimento",
      "Registros de verificação e validação de projeto",
      "Justificativa de exclusão (se não aplicável)",
    ],
  },
  {
    code: "8.4",
    title: "Controle de processos, produtos e serviços externos",
    description:
      "A organização deve assegurar que processos, produtos e serviços providos externamente estejam conformes aos requisitos, incluindo avaliação e seleção de fornecedores.",
    consultantGuidance:
      "Implante critérios de qualificação, avaliação e monitoramento de fornecedores, definindo controles proporcionais ao impacto.",
    suggestedQuestion:
      "Existe um processo de qualificação, avaliação e monitoramento de fornecedores externos?",
    expectedEvidence: [
      "Procedimento de qualificação de fornecedores",
      "Critérios de avaliação de fornecedores",
      "Registros de reavaliação de fornecedores",
    ],
  },
  {
    code: "8.5",
    title: "Produção e provisão de serviço",
    description:
      "A produção e a provisão de serviço devem ser realizadas sob condições controladas, incluindo identificação e rastreabilidade, preservação, propriedade do cliente e controle de mudanças.",
    consultantGuidance:
      "Verifique controles de produção/serviço, identificação e rastreabilidade, preservação do produto e cuidado com a propriedade do cliente/fornecedor externo.",
    suggestedQuestion:
      "As atividades de produção/serviço são realizadas sob condições controladas, com identificação e rastreabilidade adequadas?",
    expectedEvidence: [
      "Instruções de trabalho de produção/serviço",
      "Registros de rastreabilidade",
      "Procedimento de preservação de produto",
    ],
  },
  {
    code: "8.6",
    title: "Liberação de produtos e serviços",
    description:
      "A organização deve implementar disposições planejadas para verificar se os requisitos do produto/serviço foram atendidos antes da liberação ao cliente.",
    consultantGuidance:
      "Evidencie inspeções/ensaios e a aprovação por autoridade competente antes da liberação, com rastreabilidade.",
    suggestedQuestion:
      "Há verificação documentada de atendimento aos requisitos antes da liberação do produto/serviço ao cliente?",
    expectedEvidence: [
      "Registros de inspeção e ensaios",
      "Plano de inspeção",
      "Registro de liberação/aprovação",
    ],
  },
  {
    code: "8.7",
    title: "Controle de saídas não conformes",
    description:
      "A organização deve assegurar que saídas não conformes sejam identificadas e controladas para prevenir seu uso ou entrega não pretendidos.",
    consultantGuidance:
      "Estabeleça procedimento para identificação, segregação, tratamento (correção, segregação, contenção, devolução) e registro de saídas não conformes.",
    suggestedQuestion:
      "Existe um procedimento para identificar, segregar e tratar produtos/serviços não conformes?",
    expectedEvidence: [
      "Procedimento de controle de produto não conforme",
      "Registros de tratamento de não conformidade",
    ],
  },
  {
    code: "9.1",
    title: "Monitoramento, medição, análise e avaliação",
    description:
      "A organização deve determinar o que, como e quando monitorar e medir, avaliar o desempenho do SGQ e a satisfação do cliente.",
    consultantGuidance:
      "Defina indicadores, métodos e periodicidade. Inclua a avaliação da satisfação do cliente e a análise crítica de dados.",
    suggestedQuestion:
      "A empresa monitora indicadores de desempenho e a satisfação do cliente de forma sistemática?",
    expectedEvidence: [
      "Painel de indicadores (KPIs)",
      "Pesquisa de satisfação do cliente",
      "Relatório de análise de dados",
    ],
  },
  {
    code: "9.2",
    title: "Auditoria interna",
    description:
      "A organização deve conduzir auditorias internas a intervalos planejados para verificar se o SGQ está conforme e implementado eficazmente.",
    consultantGuidance:
      "Implante um programa de auditoria, procedimento, plano por auditoria, checklist, qualificação de auditores e relatório com tratamento de constatações.",
    suggestedQuestion:
      "Existe um programa de auditorias internas, com procedimento, plano, checklist e relatórios?",
    expectedEvidence: [
      "Procedimento de auditoria interna",
      "Programa anual de auditorias",
      "Plano de auditoria",
      "Checklist de auditoria",
      "Relatório de auditoria",
    ],
  },
  {
    code: "9.3",
    title: "Análise crítica pela direção",
    description:
      "A Alta Direção deve analisar criticamente o SGQ a intervalos planejados, considerando entradas definidas pela norma e gerando saídas de decisões e ações.",
    consultantGuidance:
      "Conduza a análise crítica cobrindo as entradas da norma (status de ações, mudanças, desempenho, satisfação, NCs, auditorias, riscos, recursos) e registre decisões/ações.",
    suggestedQuestion:
      "A Alta Direção realiza análise crítica do SGQ a intervalos planejados, com ata e decisões registradas?",
    expectedEvidence: [
      "Ata de análise crítica pela direção",
      "Modelo/pauta de análise crítica",
    ],
  },
  {
    code: "10.1",
    title: "Melhoria — Generalidades",
    description:
      "A organização deve determinar e selecionar oportunidades de melhoria e implementar ações necessárias para atender a requisitos e aumentar a satisfação do cliente.",
    consultantGuidance:
      "Evidencie iniciativas de melhoria (corretivas, incrementais, inovação) e como surgem das análises de dados e da análise crítica.",
    suggestedQuestion:
      "A empresa identifica e implementa oportunidades de melhoria de forma estruturada?",
    expectedEvidence: [
      "Registro de oportunidades de melhoria",
      "Planos de melhoria",
    ],
  },
  {
    code: "10.2",
    title: "Não conformidade e ação corretiva",
    description:
      "Ao ocorrer uma não conformidade, a organização deve reagir, avaliar a necessidade de ação para eliminar as causas e implementar ações corretivas, analisando sua eficácia.",
    consultantGuidance:
      "Implante procedimento de tratamento de NC e ação corretiva (RAC), com análise de causa raiz (ex.: 5 porquês, Ishikawa) e verificação de eficácia.",
    suggestedQuestion:
      "Existe um procedimento de tratamento de não conformidades e ações corretivas, com análise de causa raiz?",
    expectedEvidence: [
      "Procedimento de tratamento de não conformidade",
      "Formulário de RAC (Relatório de Ação Corretiva)",
      "Registros de análise de causa raiz",
    ],
  },
  {
    code: "10.3",
    title: "Melhoria contínua",
    description:
      "A organização deve melhorar continuamente a adequação, suficiência e eficácia do SGQ, considerando resultados de análise, avaliação e da análise crítica.",
    consultantGuidance:
      "Demonstre a evolução do SGQ ao longo do tempo: evolução de indicadores, ações de melhoria concluídas e decisões da análise crítica.",
    suggestedQuestion:
      "Como a organização evidencia a melhoria contínua do sistema de gestão ao longo do tempo?",
    expectedEvidence: [
      "Evolução histórica de indicadores",
      "Registros de ações de melhoria contínua",
    ],
  },
];
