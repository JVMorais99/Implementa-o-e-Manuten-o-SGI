// Catálogo de requisitos da ISO 37001:2016 (Sistema de Gestão Antissuborno — SGA).
// Segue a estrutura de alto nível (Anexo SL), compartilhando a numeração das
// cláusulas 4–10 com as demais normas, e inclui os controles antissuborno
// característicos da cláusula 8.

import type { RequirementSeed } from "./iso9001-requirements";

export const ISO37001_REQUIREMENTS: RequirementSeed[] = [
  {
    code: "4.1",
    title: "Contexto da organização",
    description:
      "Determinar questões internas e externas pertinentes que afetam a capacidade de alcançar os resultados pretendidos do sistema de gestão antissuborno.",
    consultantGuidance:
      "Considere o setor de atuação, exposição a agentes públicos, atuação internacional e o histórico de integridade na análise de contexto.",
    suggestedQuestion:
      "A análise de contexto considera os fatores de exposição ao risco de suborno?",
    expectedEvidence: ["Análise de contexto antissuborno", "Matriz SWOT de integridade"],
  },
  {
    code: "4.2",
    title: "Necessidades e expectativas de partes interessadas",
    description:
      "Determinar as partes interessadas pertinentes ao sistema antissuborno e seus requisitos.",
    consultantGuidance:
      "Mapeie clientes, parceiros de negócio, agentes públicos, órgãos reguladores e a alta administração entre as partes interessadas.",
    suggestedQuestion: "As partes interessadas e seus requisitos antissuborno estão identificados?",
    expectedEvidence: ["Matriz de partes interessadas", "Requisitos legais antissuborno (ex.: Lei 12.846/2013)"],
  },
  {
    code: "4.3",
    title: "Escopo do sistema de gestão antissuborno",
    description:
      "Determinar os limites e a aplicabilidade do sistema de gestão antissuborno.",
    consultantGuidance:
      "Defina os limites do sistema (unidades, atividades, jurisdições) considerando a avaliação de risco de suborno.",
    suggestedQuestion: "O escopo do sistema antissuborno está documentado?",
    expectedEvidence: ["Declaração de escopo do sistema antissuborno"],
  },
  {
    code: "4.4",
    title: "Sistema de gestão antissuborno",
    description:
      "Estabelecer, implementar, manter e melhorar continuamente o sistema de gestão antissuborno, que deve ser razoável e proporcional.",
    consultantGuidance:
      "O sistema deve ser proporcional ao risco de suborno identificado. Mapeie processos e controles.",
    suggestedQuestion: "O sistema antissuborno é proporcional aos riscos identificados?",
    expectedEvidence: ["Manual/estrutura do sistema antissuborno", "Mapa de processos"],
  },
  {
    code: "4.5",
    title: "Avaliação de risco de suborno",
    description:
      "Realizar e documentar uma avaliação regular do risco de suborno, identificando, analisando, avaliando e priorizando os riscos de suborno.",
    consultantGuidance:
      "Construa a matriz de risco de suborno por atividade, parceiro e jurisdição. Requisito central da ISO 37001.",
    suggestedQuestion: "Existe uma avaliação de risco de suborno documentada e atualizada?",
    expectedEvidence: ["Metodologia de avaliação de risco de suborno", "Matriz de risco de suborno"],
  },
  {
    code: "5.1",
    title: "Liderança e comprometimento",
    description:
      "O órgão diretivo e a Alta Direção devem demonstrar liderança e comprometimento com o sistema de gestão antissuborno.",
    consultantGuidance:
      "Evidencie o 'tom vindo do topo' (tone at the top), a provisão de recursos e a promoção de uma cultura antissuborno.",
    suggestedQuestion: "Como a liderança demonstra comprometimento com o programa antissuborno?",
    expectedEvidence: ["Ata do órgão diretivo", "Manifestações da liderança", "Provisão de recursos"],
  },
  {
    code: "5.2",
    title: "Política antissuborno",
    description:
      "A Alta Direção deve estabelecer uma política antissuborno que proíba o suborno, exija conformidade legal e incentive o levantamento de preocupações de boa-fé sem retaliação.",
    consultantGuidance:
      "A política deve proibir explicitamente o suborno, garantir proteção a denunciantes e estar amplamente comunicada interna e externamente.",
    suggestedQuestion: "Existe uma política antissuborno que proíbe o suborno e protege denunciantes?",
    expectedEvidence: ["Política antissuborno", "Código de conduta/ética", "Evidência de divulgação"],
  },
  {
    code: "5.3",
    title: "Papéis, responsabilidades e função de compliance antissuborno",
    description:
      "Atribuir responsabilidades e autoridades e designar uma função de compliance antissuborno com independência e recursos adequados.",
    consultantGuidance:
      "Designe a função de compliance antissuborno com acesso direto ao órgão diretivo e independência adequada.",
    suggestedQuestion: "Há uma função de compliance antissuborno designada e independente?",
    expectedEvidence: ["Designação da função de compliance", "Matriz de responsabilidades"],
  },
  {
    code: "6.1",
    title: "Ações para abordar riscos e oportunidades",
    description:
      "Planejar ações para abordar os riscos e oportunidades determinados, integrando-as ao sistema de gestão antissuborno.",
    consultantGuidance:
      "Conecte as ações aos resultados da avaliação de risco de suborno.",
    suggestedQuestion: "As ações para tratar os riscos de suborno estão planejadas?",
    expectedEvidence: ["Plano de ações antissuborno"],
  },
  {
    code: "6.2",
    title: "Objetivos antissuborno e planejamento",
    description:
      "Estabelecer objetivos antissuborno mensuráveis, coerentes com a política, monitorados e com planos para alcançá-los.",
    consultantGuidance:
      "Defina objetivos mensuráveis (ex.: % de parceiros submetidos a due diligence, treinamentos realizados).",
    suggestedQuestion: "Existem objetivos antissuborno mensuráveis com planos para alcançá-los?",
    expectedEvidence: ["Quadro de objetivos antissuborno", "Planos de ação"],
  },
  {
    code: "7.1",
    title: "Recursos",
    description: "Determinar e prover os recursos necessários ao sistema de gestão antissuborno.",
    consultantGuidance: "Verifique a provisão de recursos para a função de compliance antissuborno.",
    suggestedQuestion: "A organização provê os recursos necessários ao programa antissuborno?",
    expectedEvidence: ["Plano de recursos"],
  },
  {
    code: "7.2",
    title: "Competência e due diligence de pessoal",
    description:
      "Assegurar a competência das pessoas e aplicar due diligence e controles para posições expostas ao risco de suborno.",
    consultantGuidance:
      "Inclua due diligence na contratação/promoção de cargos sensíveis e cláusulas antissuborno nos contratos de trabalho.",
    suggestedQuestion: "Há due diligence e competência definidas para posições expostas ao risco?",
    expectedEvidence: ["Matriz de competência", "Registros de due diligence de pessoal"],
  },
  {
    code: "7.3",
    title: "Conscientização e treinamento",
    description:
      "As pessoas devem estar conscientes da política antissuborno e receber treinamento adequado ao seu risco de exposição.",
    consultantGuidance:
      "Mantenha um programa de treinamento antissuborno proporcional ao risco, incluindo parceiros de negócio quando aplicável.",
    suggestedQuestion: "Há treinamento antissuborno proporcional ao risco de exposição?",
    expectedEvidence: ["Registros de treinamento antissuborno"],
  },
  {
    code: "7.4",
    title: "Comunicação",
    description:
      "Determinar as comunicações internas e externas pertinentes ao sistema de gestão antissuborno.",
    consultantGuidance:
      "Defina a comunicação da política antissuborno a parceiros de negócio e o tratamento de comunicações recebidas.",
    suggestedQuestion: "Existe um plano de comunicação antissuborno (interno e externo)?",
    expectedEvidence: ["Procedimento de comunicação", "Comunicação da política a parceiros"],
  },
  {
    code: "7.5",
    title: "Informação documentada",
    description:
      "O sistema antissuborno deve incluir a informação documentada requerida pela norma e a necessária para sua eficácia.",
    consultantGuidance: "Controle a informação documentada do programa antissuborno.",
    suggestedQuestion: "A informação documentada antissuborno é controlada adequadamente?",
    expectedEvidence: ["Procedimento de controle de informação documentada", "Lista mestra de documentos"],
  },
  {
    code: "8.2",
    title: "Due diligence",
    description:
      "Aplicar due diligence sobre transações, projetos, atividades, parceiros de negócio e pessoal específicos que apresentem risco de suborno mais do que baixo.",
    consultantGuidance:
      "Estabeleça procedimento de due diligence de terceiros (background check, beneficiários finais) proporcional ao risco.",
    suggestedQuestion: "Existe due diligence de parceiros de negócio proporcional ao risco?",
    expectedEvidence: ["Procedimento de due diligence", "Registros de due diligence de terceiros"],
  },
  {
    code: "8.7",
    title: "Brindes, presentes e hospitalidades",
    description:
      "Implementar controles para gerenciar ofertas e recebimentos de presentes, hospitalidades, doações e benefícios que possam configurar suborno.",
    consultantGuidance:
      "Defina política de brindes e hospitalidades com limites, registro e aprovação, e um livro/registro de presentes.",
    suggestedQuestion: "Há controles e registro para brindes, presentes e hospitalidades?",
    expectedEvidence: ["Política de brindes e hospitalidades", "Registro de presentes recebidos/ofertados"],
  },
  {
    code: "8.9",
    title: "Levantamento de preocupações (canal de denúncias)",
    description:
      "Implementar procedimentos que encorajem o relato de boa-fé de suspeitas de suborno, permitindo anonimato e protegendo o denunciante contra retaliação.",
    consultantGuidance:
      "Implante um canal de denúncias independente, com garantia de confidencialidade e não retaliação.",
    suggestedQuestion: "Existe um canal de denúncias com proteção ao denunciante?",
    expectedEvidence: ["Procedimento de canal de denúncias", "Registros de denúncias e tratamento"],
  },
  {
    code: "9.1",
    title: "Monitoramento, medição, análise e avaliação",
    description:
      "Monitorar, medir, analisar e avaliar o desempenho e a eficácia do sistema de gestão antissuborno.",
    consultantGuidance:
      "Defina indicadores antissuborno (due diligences realizadas, denúncias, treinamentos) e avalie a eficácia.",
    suggestedQuestion: "O desempenho do programa antissuborno é monitorado e avaliado?",
    expectedEvidence: ["Indicadores antissuborno", "Relatórios de desempenho"],
  },
  {
    code: "9.2",
    title: "Auditoria interna",
    description:
      "Conduzir auditorias internas a intervalos planejados para verificar a conformidade e a eficácia do sistema antissuborno.",
    consultantGuidance: "Inclua os controles antissuborno (cláusula 8) no escopo das auditorias internas.",
    suggestedQuestion: "As auditorias internas cobrem os controles antissuborno?",
    expectedEvidence: ["Programa de auditorias", "Relatório de auditoria antissuborno"],
  },
  {
    code: "9.3",
    title: "Análise crítica pela direção e função de compliance",
    description:
      "A Alta Direção e a função de compliance antissuborno devem analisar criticamente o sistema a intervalos planejados.",
    consultantGuidance:
      "Inclua na análise crítica os resultados de denúncias, investigações e due diligences.",
    suggestedQuestion: "A análise crítica contempla denúncias, investigações e desempenho antissuborno?",
    expectedEvidence: ["Ata de análise crítica", "Relatório da função de compliance ao órgão diretivo"],
  },
  {
    code: "10.1",
    title: "Não conformidade e ação corretiva",
    description:
      "Reagir às não conformidades (incluindo suspeitas de suborno), avaliar a necessidade de ação para eliminar as causas e implementar ações corretivas.",
    consultantGuidance: "Trate não conformidades e suspeitas com análise de causa, investigação e ações corretivas.",
    suggestedQuestion: "Existe tratamento estruturado de não conformidades e suspeitas de suborno?",
    expectedEvidence: ["Procedimento de não conformidade", "Registros de investigação"],
  },
  {
    code: "10.2",
    title: "Melhoria contínua",
    description:
      "Melhorar continuamente a adequação, suficiência e eficácia do sistema de gestão antissuborno.",
    consultantGuidance: "Evidencie a evolução do programa antissuborno ao longo do tempo.",
    suggestedQuestion: "Como a organização evidencia a melhoria contínua do programa antissuborno?",
    expectedEvidence: ["Evolução de indicadores antissuborno", "Ações de melhoria"],
  },
];
