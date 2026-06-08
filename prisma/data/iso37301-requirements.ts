// Catálogo de requisitos da ISO 37301:2021 (Sistema de Gestão de Compliance — SGC).
// Segue a estrutura de alto nível (Anexo SL), compartilhando a numeração das
// cláusulas 4–10 com as demais normas, e inclui os elementos característicos de
// compliance (obrigações e avaliação de risco de compliance).

import type { RequirementSeed } from "./iso9001-requirements";

export const ISO37301_REQUIREMENTS: RequirementSeed[] = [
  {
    code: "4.1",
    title: "Contexto da organização",
    description:
      "Determinar questões internas e externas pertinentes que afetam a capacidade de alcançar os resultados pretendidos do sistema de gestão de compliance.",
    consultantGuidance:
      "Considere o ambiente regulatório, o setor, a cultura organizacional e o histórico de compliance na análise de contexto.",
    suggestedQuestion: "A análise de contexto considera o ambiente regulatório e a cultura de compliance?",
    expectedEvidence: ["Análise de contexto de compliance", "Matriz SWOT de compliance"],
  },
  {
    code: "4.2",
    title: "Necessidades e expectativas de partes interessadas",
    description:
      "Determinar as partes interessadas pertinentes ao sistema de gestão de compliance e seus requisitos.",
    consultantGuidance:
      "Mapeie órgãos reguladores, clientes, investidores, colaboradores e a sociedade entre as partes interessadas.",
    suggestedQuestion: "As partes interessadas e suas expectativas de compliance estão identificadas?",
    expectedEvidence: ["Matriz de partes interessadas"],
  },
  {
    code: "4.3",
    title: "Escopo do sistema de gestão de compliance",
    description:
      "Determinar os limites e a aplicabilidade do sistema de gestão de compliance.",
    consultantGuidance:
      "Defina os limites do sistema (unidades, atividades, jurisdições) considerando as obrigações de compliance.",
    suggestedQuestion: "O escopo do sistema de compliance está documentado?",
    expectedEvidence: ["Declaração de escopo do sistema de compliance"],
  },
  {
    code: "4.4",
    title: "Sistema de gestão de compliance",
    description:
      "Estabelecer, desenvolver, implementar, avaliar, manter e melhorar um sistema de gestão de compliance baseado nos princípios de boa governança, proporcionalidade, transparência e sustentabilidade.",
    consultantGuidance:
      "Estruture o sistema com base nos princípios de boa governança. Mapeie processos e cultura de compliance.",
    suggestedQuestion: "O sistema de compliance está estruturado segundo os princípios de boa governança?",
    expectedEvidence: ["Manual/estrutura do sistema de compliance", "Mapa de processos"],
  },
  {
    code: "4.5",
    title: "Obrigações de compliance",
    description:
      "Identificar sistematicamente as obrigações de compliance (legais, regulatórias, contratuais e voluntárias) e avaliar seus impactos nas atividades.",
    consultantGuidance:
      "Construa a matriz de obrigações de compliance e mantenha-a atualizada. Elemento central da ISO 37301.",
    suggestedQuestion: "Existe uma matriz de obrigações de compliance identificada e atualizada?",
    expectedEvidence: ["Matriz de obrigações de compliance", "Fontes legais e regulatórias mapeadas"],
  },
  {
    code: "4.6",
    title: "Avaliação de riscos de compliance",
    description:
      "Identificar, analisar e avaliar os riscos de compliance relacionando as obrigações de compliance às atividades, produtos, serviços e operações.",
    consultantGuidance:
      "Relacione cada obrigação de compliance a um risco avaliado, priorizando os de maior impacto e probabilidade.",
    suggestedQuestion: "Os riscos de compliance estão avaliados e relacionados às obrigações?",
    expectedEvidence: ["Metodologia de avaliação de riscos de compliance", "Matriz de risco de compliance"],
  },
  {
    code: "5.1",
    title: "Liderança e comprometimento",
    description:
      "O órgão diretivo e a Alta Direção devem demonstrar liderança e comprometimento, promovendo uma cultura de compliance.",
    consultantGuidance:
      "Evidencie a promoção da cultura de compliance, a provisão de recursos e o comprometimento do órgão diretivo.",
    suggestedQuestion: "Como a liderança promove a cultura de compliance?",
    expectedEvidence: ["Ata do órgão diretivo", "Manifestações da liderança", "Provisão de recursos"],
  },
  {
    code: "5.2",
    title: "Política de compliance",
    description:
      "A Alta Direção deve estabelecer uma política de compliance alinhada aos valores, objetivos e direção estratégica, com compromisso de atender às obrigações de compliance.",
    consultantGuidance:
      "A política deve declarar os compromissos de compliance, ser comunicada e prever consequências para violações.",
    suggestedQuestion: "Existe uma política de compliance aprovada e comunicada?",
    expectedEvidence: ["Política de compliance", "Código de conduta", "Evidência de divulgação"],
  },
  {
    code: "5.3",
    title: "Papéis, responsabilidades e função de compliance",
    description:
      "Atribuir responsabilidades e estabelecer uma função de compliance com independência, autoridade e recursos adequados, com acesso ao órgão diretivo.",
    consultantGuidance:
      "Designe a função de compliance com independência e acesso direto ao órgão diretivo; defina a governança de compliance.",
    suggestedQuestion: "Há uma função de compliance designada, independente e com recursos adequados?",
    expectedEvidence: ["Designação da função de compliance", "Matriz de responsabilidades", "Estrutura de governança"],
  },
  {
    code: "6.1",
    title: "Ações para abordar riscos e oportunidades",
    description:
      "Planejar ações para abordar os riscos e oportunidades de compliance, integrando-as ao sistema de gestão.",
    consultantGuidance: "Conecte as ações aos resultados da avaliação de riscos de compliance.",
    suggestedQuestion: "As ações para tratar os riscos de compliance estão planejadas?",
    expectedEvidence: ["Plano de ações de compliance"],
  },
  {
    code: "6.2",
    title: "Objetivos de compliance e planejamento",
    description:
      "Estabelecer objetivos de compliance mensuráveis, coerentes com a política, monitorados e com planos para alcançá-los.",
    consultantGuidance:
      "Defina objetivos mensuráveis (ex.: % de obrigações monitoradas, treinamentos, redução de incidentes).",
    suggestedQuestion: "Existem objetivos de compliance mensuráveis com planos para alcançá-los?",
    expectedEvidence: ["Quadro de objetivos de compliance", "Planos de ação"],
  },
  {
    code: "7.1",
    title: "Recursos",
    description: "Determinar e prover os recursos necessários ao sistema de gestão de compliance.",
    consultantGuidance: "Verifique a provisão de recursos para a função de compliance.",
    suggestedQuestion: "A organização provê os recursos necessários ao sistema de compliance?",
    expectedEvidence: ["Plano de recursos"],
  },
  {
    code: "7.2",
    title: "Competência",
    description:
      "Assegurar a competência das pessoas cujo trabalho afeta o desempenho de compliance, incluindo a função de compliance.",
    consultantGuidance:
      "Defina competências de compliance e mantenha registros de capacitação da função e dos colaboradores.",
    suggestedQuestion: "As competências de compliance necessárias estão definidas e atendidas?",
    expectedEvidence: ["Matriz de competência", "Registros de treinamento"],
  },
  {
    code: "7.3",
    title: "Conscientização e treinamento",
    description:
      "As pessoas devem estar conscientes da política de compliance, das obrigações pertinentes ao seu trabalho e das implicações de não conformidade.",
    consultantGuidance:
      "Mantenha um programa de conscientização e treinamento de compliance proporcional aos riscos.",
    suggestedQuestion: "Há um programa de conscientização e treinamento em compliance?",
    expectedEvidence: ["Registros de treinamento em compliance"],
  },
  {
    code: "7.4",
    title: "Comunicação",
    description:
      "Determinar as comunicações internas e externas pertinentes ao sistema de gestão de compliance.",
    consultantGuidance:
      "Defina a comunicação de assuntos de compliance, incluindo a comunicação com órgãos reguladores.",
    suggestedQuestion: "Existe um plano de comunicação de compliance?",
    expectedEvidence: ["Procedimento de comunicação", "Matriz de comunicação"],
  },
  {
    code: "7.5",
    title: "Informação documentada",
    description:
      "O sistema de compliance deve incluir a informação documentada requerida pela norma e a necessária para sua eficácia.",
    consultantGuidance: "Controle a informação documentada do sistema de compliance.",
    suggestedQuestion: "A informação documentada de compliance é controlada adequadamente?",
    expectedEvidence: ["Procedimento de controle de informação documentada", "Lista mestra de documentos"],
  },
  {
    code: "8.1",
    title: "Planejamento e controle operacional",
    description:
      "Planejar, implementar e controlar os processos e controles necessários para atender às obrigações de compliance e implementar as ações da cláusula 6.",
    consultantGuidance:
      "Implemente controles de compliance proporcionais aos riscos (due diligence, conflitos de interesse, canal de denúncias).",
    suggestedQuestion: "Os controles de compliance planejados estão implementados?",
    expectedEvidence: [
      "Procedimentos e controles de compliance",
      "Procedimento de canal de denúncias",
      "Registros de gestão de conflitos de interesse",
    ],
  },
  {
    code: "9.1",
    title: "Monitoramento, medição, análise e avaliação",
    description:
      "Monitorar, medir, analisar e avaliar o desempenho e a eficácia do sistema de gestão de compliance.",
    consultantGuidance:
      "Defina indicadores de compliance (obrigações atendidas, denúncias, incidentes) e avalie a eficácia.",
    suggestedQuestion: "O desempenho de compliance é monitorado e avaliado?",
    expectedEvidence: ["Indicadores de compliance", "Relatórios de desempenho"],
  },
  {
    code: "9.2",
    title: "Auditoria interna",
    description:
      "Conduzir auditorias internas a intervalos planejados para verificar a conformidade e a eficácia do sistema de compliance.",
    consultantGuidance: "Inclua as obrigações e controles de compliance no escopo das auditorias internas.",
    suggestedQuestion: "As auditorias internas cobrem o sistema de compliance?",
    expectedEvidence: ["Programa de auditorias", "Relatório de auditoria de compliance"],
  },
  {
    code: "9.3",
    title: "Análise crítica pela direção",
    description:
      "A Alta Direção e o órgão diretivo devem analisar criticamente o sistema de gestão de compliance a intervalos planejados.",
    consultantGuidance:
      "Inclua na análise crítica os relatos da função de compliance, denúncias, investigações e desempenho.",
    suggestedQuestion: "A análise crítica contempla denúncias, investigações e desempenho de compliance?",
    expectedEvidence: ["Ata de análise crítica", "Relatório da função de compliance"],
  },
  {
    code: "10.1",
    title: "Não conformidade e ação corretiva",
    description:
      "Reagir às não conformidades de compliance, avaliar a necessidade de ação para eliminar as causas e implementar ações corretivas.",
    consultantGuidance: "Trate não conformidades de compliance com análise de causa e verificação de eficácia.",
    suggestedQuestion: "Existe tratamento estruturado de não conformidades de compliance?",
    expectedEvidence: ["Procedimento de não conformidade", "Registros de tratamento"],
  },
  {
    code: "10.2",
    title: "Melhoria contínua",
    description:
      "Melhorar continuamente a adequação, suficiência e eficácia do sistema de gestão de compliance.",
    consultantGuidance: "Evidencie a evolução do desempenho de compliance ao longo do tempo.",
    suggestedQuestion: "Como a organização evidencia a melhoria contínua do sistema de compliance?",
    expectedEvidence: ["Evolução de indicadores de compliance", "Ações de melhoria"],
  },
];
