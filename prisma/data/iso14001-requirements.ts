// Catálogo de requisitos da ISO 14001:2015 (Sistema de Gestão Ambiental).
// Segue a estrutura de alto nível (Anexo SL), compartilhando a numeração das
// cláusulas 4–10 com a ISO 9001, o que permite documentos integrados (SGI).

import type { RequirementSeed } from "./iso9001-requirements";

export const ISO14001_REQUIREMENTS: RequirementSeed[] = [
  {
    code: "4.1",
    title: "Contexto da organização",
    description:
      "Determinar questões internas e externas pertinentes ao propósito que afetam a capacidade de alcançar os resultados pretendidos do SGA, incluindo condições ambientais capazes de afetar ou serem afetadas pela organização.",
    consultantGuidance:
      "Inclua na análise de contexto as condições ambientais (clima, qualidade do ar/água/solo, disponibilidade de recursos naturais, biodiversidade) além das questões de negócio.",
    suggestedQuestion:
      "A análise de contexto considera as condições ambientais que afetam ou são afetadas pela organização?",
    expectedEvidence: [
      "Matriz SWOT com dimensão ambiental",
      "Análise de contexto ambiental",
      "Levantamento de condições ambientais",
    ],
  },
  {
    code: "4.2",
    title: "Necessidades e expectativas de partes interessadas",
    description:
      "Determinar partes interessadas pertinentes ao SGA, suas necessidades e expectativas, e quais delas se tornam requisitos legais e outros requisitos.",
    consultantGuidance:
      "Mapeie órgãos ambientais, comunidade, vizinhança e ONGs entre as partes interessadas. Identifique quais expectativas viram obrigações de compliance.",
    suggestedQuestion:
      "As partes interessadas ambientais (órgãos, comunidade) e seus requisitos estão identificados?",
    expectedEvidence: [
      "Matriz de partes interessadas ambientais",
      "Levantamento de requisitos legais e outros",
    ],
  },
  {
    code: "4.3",
    title: "Escopo do sistema de gestão ambiental",
    description:
      "Determinar os limites e a aplicabilidade do SGA, considerando contexto, partes interessadas, unidades, atividades, produtos e serviços e sua autoridade e capacidade de controle e influência.",
    consultantGuidance:
      "Defina claramente os limites físicos e organizacionais do SGA. O escopo deve estar disponível como informação documentada.",
    suggestedQuestion:
      "O escopo do SGA está documentado, incluindo atividades, produtos e serviços abrangidos?",
    expectedEvidence: ["Declaração de escopo do SGA"],
  },
  {
    code: "4.4",
    title: "Sistema de gestão ambiental",
    description:
      "Estabelecer, implementar, manter e melhorar continuamente o SGA, incluindo os processos necessários e suas interações.",
    consultantGuidance:
      "Mapeie os processos do SGA e suas interações, conectando-os aos aspectos e impactos ambientais.",
    suggestedQuestion: "Os processos do SGA estão definidos e interagem de forma sistêmica?",
    expectedEvidence: ["Mapa de processos do SGA", "Manual/estrutura do SGA"],
  },
  {
    code: "5.1",
    title: "Liderança e comprometimento",
    description:
      "A Alta Direção deve demonstrar liderança e comprometimento com o SGA, assumindo responsabilização pela sua eficácia.",
    consultantGuidance:
      "Evidencie a integração da gestão ambiental ao negócio, a provisão de recursos e a promoção da melhoria pela liderança.",
    suggestedQuestion:
      "Como a Alta Direção demonstra comprometimento com o desempenho ambiental?",
    expectedEvidence: ["Ata de análise crítica", "Evidências de provisão de recursos"],
  },
  {
    code: "5.2",
    title: "Política ambiental",
    description:
      "A Alta Direção deve estabelecer uma política ambiental que inclua compromisso com a proteção do meio ambiente (incluindo prevenção da poluição), atendimento a requisitos legais e melhoria contínua.",
    consultantGuidance:
      "A política ambiental deve conter explicitamente os compromissos de proteção ambiental, prevenção da poluição e atendimento aos requisitos legais.",
    suggestedQuestion:
      "Existe uma política ambiental com compromissos de proteção ambiental e prevenção da poluição?",
    expectedEvidence: ["Política ambiental", "Evidência de divulgação"],
  },
  {
    code: "5.3",
    title: "Papéis, responsabilidades e autoridades",
    description:
      "Assegurar que responsabilidades e autoridades para papéis pertinentes do SGA sejam atribuídas e comunicadas.",
    consultantGuidance:
      "Defina responsabilidades ambientais em organograma e matriz de responsabilidades.",
    suggestedQuestion: "As responsabilidades ambientais estão definidas e comunicadas?",
    expectedEvidence: ["Matriz de responsabilidades ambientais", "Organograma"],
  },
  {
    code: "6.1.2",
    title: "Aspectos ambientais",
    description:
      "Determinar os aspectos ambientais das atividades, produtos e serviços que pode controlar/influenciar e seus impactos associados, considerando uma perspectiva de ciclo de vida, e determinar os aspectos significativos.",
    consultantGuidance:
      "Construa um levantamento de aspectos e impactos ambientais (LAIA) com critérios de significância. Este é o requisito central da ISO 14001.",
    suggestedQuestion:
      "Existe um levantamento de aspectos e impactos ambientais (LAIA) com definição dos aspectos significativos?",
    expectedEvidence: [
      "Levantamento de aspectos e impactos ambientais (LAIA)",
      "Matriz de significância ambiental",
    ],
  },
  {
    code: "6.1.3",
    title: "Requisitos legais e outros requisitos",
    description:
      "Determinar e ter acesso aos requisitos legais e outros requisitos relacionados aos aspectos ambientais e determinar como se aplicam.",
    consultantGuidance:
      "Mantenha uma matriz de requisitos legais ambientais (licenças, outorgas, condicionantes) atualizada e avaliada periodicamente.",
    suggestedQuestion:
      "Há uma matriz de requisitos legais ambientais aplicáveis, incluindo licenças e condicionantes?",
    expectedEvidence: [
      "Matriz de requisitos legais ambientais",
      "Licenças e outorgas ambientais",
    ],
  },
  {
    code: "6.2",
    title: "Objetivos ambientais e planejamento",
    description:
      "Estabelecer objetivos ambientais coerentes com a política, considerando aspectos significativos e requisitos legais, e planejar como alcançá-los.",
    consultantGuidance:
      "Defina objetivos ambientais mensuráveis (ex.: redução de resíduos, consumo de água/energia) com planos de ação.",
    suggestedQuestion:
      "Existem objetivos ambientais mensuráveis com planos para alcançá-los?",
    expectedEvidence: ["Quadro de objetivos e metas ambientais", "Programas ambientais"],
  },
  {
    code: "7.1",
    title: "Recursos",
    description: "Determinar e prover os recursos necessários ao SGA.",
    consultantGuidance:
      "Verifique a provisão de recursos humanos, financeiros, tecnológicos e de infraestrutura para a gestão ambiental.",
    suggestedQuestion: "A organização provê os recursos necessários ao SGA?",
    expectedEvidence: ["Plano de recursos do SGA"],
  },
  {
    code: "7.2",
    title: "Competência",
    description:
      "Determinar a competência necessária das pessoas cujo trabalho afeta o desempenho ambiental e o atendimento a requisitos legais.",
    consultantGuidance:
      "Inclua competências ambientais específicas (operação de ETE, gestão de resíduos, resposta a emergências) na matriz de competência.",
    suggestedQuestion:
      "As competências ambientais necessárias estão definidas e atendidas?",
    expectedEvidence: ["Matriz de competência ambiental", "Registros de treinamento"],
  },
  {
    code: "7.3",
    title: "Conscientização",
    description:
      "As pessoas devem estar conscientes da política ambiental, dos aspectos significativos e impactos associados ao seu trabalho e das implicações de não conformidade.",
    consultantGuidance:
      "Promova conscientização sobre aspectos/impactos significativos e respostas a emergências.",
    suggestedQuestion:
      "Os colaboradores conhecem os aspectos ambientais significativos do seu trabalho?",
    expectedEvidence: ["Registros de conscientização ambiental"],
  },
  {
    code: "7.4",
    title: "Comunicação",
    description:
      "Estabelecer processos de comunicação interna e externa pertinentes ao SGA, incluindo o que, quando, com quem e como comunicar, atendendo a requisitos legais de comunicação.",
    consultantGuidance:
      "Defina a comunicação ambiental interna e externa, incluindo obrigações legais de reporte a órgãos ambientais.",
    suggestedQuestion:
      "Existe um plano de comunicação ambiental, incluindo comunicações externas obrigatórias?",
    expectedEvidence: [
      "Procedimento de comunicação",
      "Matriz de comunicação ambiental",
    ],
  },
  {
    code: "7.5",
    title: "Informação documentada",
    description:
      "O SGA deve incluir a informação documentada requerida pela norma e a necessária para sua eficácia, com controle adequado.",
    consultantGuidance:
      "Aplique o procedimento de controle de informação documentada também aos registros ambientais (monitoramentos, licenças).",
    suggestedQuestion: "A informação documentada ambiental é controlada adequadamente?",
    expectedEvidence: [
      "Procedimento de controle de informação documentada",
      "Lista mestra de documentos",
    ],
  },
  {
    code: "8.1",
    title: "Planejamento e controle operacional",
    description:
      "Estabelecer, implementar e controlar os processos necessários para atender aos requisitos do SGA e implementar as ações dos requisitos 6, considerando o ciclo de vida.",
    consultantGuidance:
      "Estabeleça controles operacionais para os aspectos significativos (gestão de resíduos, efluentes, emissões, produtos químicos).",
    suggestedQuestion:
      "Os controles operacionais para os aspectos ambientais significativos estão implementados?",
    expectedEvidence: [
      "Procedimentos/instruções de controle operacional ambiental",
      "Plano de gerenciamento de resíduos (PGRS)",
    ],
  },
  {
    code: "8.2",
    title: "Preparação e resposta a emergências",
    description:
      "Estabelecer, implementar e manter processos para preparação e resposta a situações potenciais de emergência ambiental.",
    consultantGuidance:
      "Elabore plano de atendimento a emergências ambientais (vazamentos, incêndios, derramamentos) e realize simulados.",
    suggestedQuestion:
      "Existe um plano de resposta a emergências ambientais com simulados realizados?",
    expectedEvidence: [
      "Plano de atendimento a emergências ambientais",
      "Registros de simulados",
    ],
  },
  {
    code: "9.1",
    title: "Monitoramento, medição, análise e avaliação",
    description:
      "Monitorar, medir, analisar e avaliar o desempenho ambiental e a eficácia do SGA, incluindo a avaliação do atendimento aos requisitos legais.",
    consultantGuidance:
      "Defina monitoramentos ambientais (efluentes, emissões, resíduos, ruído) e avalie periodicamente o atendimento legal.",
    suggestedQuestion:
      "O desempenho ambiental e o atendimento a requisitos legais são monitorados e avaliados?",
    expectedEvidence: [
      "Plano de monitoramento ambiental",
      "Laudos e relatórios de monitoramento",
      "Avaliação de atendimento a requisitos legais",
    ],
  },
  {
    code: "9.2",
    title: "Auditoria interna",
    description:
      "Conduzir auditorias internas a intervalos planejados para verificar a conformidade e a implementação eficaz do SGA.",
    consultantGuidance:
      "Inclua os requisitos ambientais e legais no escopo das auditorias internas.",
    suggestedQuestion: "As auditorias internas cobrem o SGA e os requisitos legais ambientais?",
    expectedEvidence: [
      "Programa de auditorias",
      "Plano e checklist de auditoria ambiental",
      "Relatório de auditoria",
    ],
  },
  {
    code: "9.3",
    title: "Análise crítica pela direção",
    description:
      "A Alta Direção deve analisar criticamente o SGA a intervalos planejados, considerando as entradas definidas pela norma.",
    consultantGuidance:
      "Inclua na análise crítica o desempenho ambiental, o atendimento legal e o status de emergências.",
    suggestedQuestion: "A análise crítica contempla o desempenho ambiental e o compliance legal?",
    expectedEvidence: ["Ata de análise crítica do SGA"],
  },
  {
    code: "10.2",
    title: "Não conformidade e ação corretiva",
    description:
      "Reagir às não conformidades (incluindo incidentes ambientais), avaliar a necessidade de ação para eliminar as causas e implementar ações corretivas.",
    consultantGuidance:
      "Trate incidentes e não conformidades ambientais com análise de causa e verificação de eficácia.",
    suggestedQuestion:
      "Existe tratamento estruturado de não conformidades e incidentes ambientais?",
    expectedEvidence: [
      "Procedimento de não conformidade",
      "Registros de tratamento de incidentes ambientais",
    ],
  },
  {
    code: "10.3",
    title: "Melhoria contínua",
    description:
      "Melhorar continuamente a adequação, suficiência e eficácia do SGA para aprimorar o desempenho ambiental.",
    consultantGuidance:
      "Evidencie a evolução do desempenho ambiental ao longo do tempo.",
    suggestedQuestion: "Como a organização evidencia a melhoria contínua do desempenho ambiental?",
    expectedEvidence: ["Evolução de indicadores ambientais", "Ações de melhoria"],
  },
];
