// Catálogo de requisitos da ISO/IEC 27001:2022 (Sistema de Gestão de Segurança
// da Informação — SGSI). Segue a estrutura de alto nível (Anexo SL), compartilhando
// a numeração das cláusulas 4–10 com as demais normas (permite SGI integrado).
// Os controles do Anexo A são tratados via Declaração de Aplicabilidade (6.1.3).

import type { RequirementSeed } from "./iso9001-requirements";

export const ISO27001_REQUIREMENTS: RequirementSeed[] = [
  {
    code: "4.1",
    title: "Contexto da organização",
    description:
      "Determinar questões internas e externas pertinentes ao propósito que afetam a capacidade de alcançar os resultados pretendidos do SGSI.",
    consultantGuidance:
      "Considere ameaças cibernéticas, dependência tecnológica, requisitos contratuais de clientes e o cenário regulatório (LGPD) na análise de contexto.",
    suggestedQuestion:
      "A análise de contexto considera as questões de segurança da informação que afetam a organização?",
    expectedEvidence: [
      "Análise de contexto do SGSI",
      "Matriz SWOT com dimensão de segurança da informação",
    ],
  },
  {
    code: "4.2",
    title: "Necessidades e expectativas de partes interessadas",
    description:
      "Determinar as partes interessadas pertinentes ao SGSI e seus requisitos, incluindo requisitos legais, regulatórios e contratuais de segurança da informação.",
    consultantGuidance:
      "Mapeie clientes, titulares de dados, órgãos reguladores (ANPD) e fornecedores; identifique quais expectativas viram obrigações.",
    suggestedQuestion:
      "As partes interessadas e seus requisitos de segurança da informação estão identificados?",
    expectedEvidence: [
      "Matriz de partes interessadas",
      "Levantamento de requisitos legais e contratuais de SI",
    ],
  },
  {
    code: "4.3",
    title: "Escopo do sistema de gestão de segurança da informação",
    description:
      "Determinar os limites e a aplicabilidade do SGSI, considerando contexto, partes interessadas e interfaces e dependências entre atividades.",
    consultantGuidance:
      "Defina claramente os limites do SGSI (unidades, processos, ativos de informação e tecnologias abrangidos). O escopo deve ser informação documentada.",
    suggestedQuestion:
      "O escopo do SGSI está documentado, incluindo interfaces e dependências?",
    expectedEvidence: ["Declaração de escopo do SGSI"],
  },
  {
    code: "4.4",
    title: "Sistema de gestão de segurança da informação",
    description:
      "Estabelecer, implementar, manter e melhorar continuamente o SGSI, incluindo os processos necessários e suas interações.",
    consultantGuidance:
      "Mapeie os processos do SGSI e suas interações, conectando-os aos ativos de informação e à gestão de riscos.",
    suggestedQuestion: "Os processos do SGSI estão definidos e interagem de forma sistêmica?",
    expectedEvidence: ["Mapa de processos do SGSI", "Manual/estrutura do SGSI"],
  },
  {
    code: "5.1",
    title: "Liderança e comprometimento",
    description:
      "A Alta Direção deve demonstrar liderança e comprometimento com o SGSI, assegurando recursos e integração aos processos da organização.",
    consultantGuidance:
      "Evidencie a provisão de recursos para segurança da informação e a integração dos requisitos do SGSI aos processos de negócio.",
    suggestedQuestion: "Como a Alta Direção demonstra comprometimento com o SGSI?",
    expectedEvidence: ["Ata de análise crítica", "Evidências de provisão de recursos"],
  },
  {
    code: "5.2",
    title: "Política de segurança da informação",
    description:
      "A Alta Direção deve estabelecer uma política de segurança da informação adequada ao propósito, com compromisso de atender aos requisitos aplicáveis e de melhoria contínua do SGSI.",
    consultantGuidance:
      "A política de SI deve estar disponível, comunicada e considerar os pilares de confidencialidade, integridade e disponibilidade.",
    suggestedQuestion:
      "Existe uma política de segurança da informação aprovada, divulgada e mantida?",
    expectedEvidence: ["Política de segurança da informação", "Evidência de divulgação"],
  },
  {
    code: "5.3",
    title: "Papéis, responsabilidades e autoridades",
    description:
      "Atribuir e comunicar responsabilidades e autoridades para os papéis pertinentes à segurança da informação.",
    consultantGuidance:
      "Defina o responsável pela segurança da informação (CISO/encarregado), o comitê de SI e as responsabilidades por ativos.",
    suggestedQuestion: "As responsabilidades de segurança da informação estão definidas e comunicadas?",
    expectedEvidence: ["Matriz de responsabilidades de SI", "Designação do responsável pela SI"],
  },
  {
    code: "6.1.2",
    title: "Avaliação de riscos de segurança da informação",
    description:
      "Definir e aplicar um processo de avaliação de riscos de segurança da informação que identifique, analise e avalie os riscos sobre confidencialidade, integridade e disponibilidade.",
    consultantGuidance:
      "Construa o inventário de ativos de informação e a metodologia de avaliação de riscos com critérios de aceitação. Requisito central do SGSI.",
    suggestedQuestion:
      "Existe um processo documentado de avaliação de riscos de SI com inventário de ativos?",
    expectedEvidence: [
      "Metodologia de gestão de riscos de SI",
      "Inventário de ativos de informação",
      "Relatório de avaliação de riscos",
    ],
  },
  {
    code: "6.1.3",
    title: "Tratamento de riscos e Declaração de Aplicabilidade",
    description:
      "Definir e aplicar um processo de tratamento de riscos, selecionando controles (comparando com o Anexo A) e produzindo a Declaração de Aplicabilidade (SoA) e o plano de tratamento de riscos.",
    consultantGuidance:
      "Elabore a Declaração de Aplicabilidade (SoA) justificando inclusões/exclusões dos controles do Anexo A e o plano de tratamento de riscos aprovado pelos donos do risco.",
    suggestedQuestion:
      "Existem Declaração de Aplicabilidade (SoA) e plano de tratamento de riscos aprovados?",
    expectedEvidence: [
      "Declaração de Aplicabilidade (SoA)",
      "Plano de tratamento de riscos",
      "Aprovação dos riscos residuais pelos donos do risco",
    ],
  },
  {
    code: "6.2",
    title: "Objetivos de segurança da informação e planejamento",
    description:
      "Estabelecer objetivos de segurança da informação coerentes com a política, mensuráveis, monitorados e com planos para alcançá-los.",
    consultantGuidance:
      "Defina objetivos de SI mensuráveis (ex.: redução de incidentes, % de ativos avaliados) com planos de ação.",
    suggestedQuestion: "Existem objetivos de SI mensuráveis com planos para alcançá-los?",
    expectedEvidence: ["Quadro de objetivos de SI", "Planos de ação"],
  },
  {
    code: "7.1",
    title: "Recursos",
    description: "Determinar e prover os recursos necessários ao SGSI.",
    consultantGuidance:
      "Verifique a provisão de recursos humanos, tecnológicos e financeiros para a segurança da informação.",
    suggestedQuestion: "A organização provê os recursos necessários ao SGSI?",
    expectedEvidence: ["Plano de recursos do SGSI"],
  },
  {
    code: "7.2",
    title: "Competência",
    description:
      "Determinar e assegurar a competência das pessoas cujo trabalho afeta o desempenho de segurança da informação.",
    consultantGuidance:
      "Inclua competências específicas (gestão de riscos, resposta a incidentes, segurança de redes) na matriz de competência.",
    suggestedQuestion: "As competências de SI necessárias estão definidas e atendidas?",
    expectedEvidence: ["Matriz de competência", "Registros de treinamento em SI"],
  },
  {
    code: "7.3",
    title: "Conscientização",
    description:
      "As pessoas devem estar conscientes da política de SI, de sua contribuição para a eficácia do SGSI e das implicações de não conformidade.",
    consultantGuidance:
      "Mantenha um programa contínuo de conscientização em segurança da informação (phishing, senhas, classificação da informação).",
    suggestedQuestion: "Há um programa de conscientização em segurança da informação?",
    expectedEvidence: ["Registros de campanhas de conscientização em SI"],
  },
  {
    code: "7.4",
    title: "Comunicação",
    description:
      "Determinar a necessidade de comunicações internas e externas pertinentes ao SGSI (o quê, quando, com quem e como).",
    consultantGuidance:
      "Defina a comunicação de assuntos de SI, incluindo a notificação de incidentes a partes interessadas e reguladores.",
    suggestedQuestion: "Existe um plano de comunicação do SGSI?",
    expectedEvidence: ["Procedimento de comunicação", "Matriz de comunicação"],
  },
  {
    code: "7.5",
    title: "Informação documentada",
    description:
      "O SGSI deve incluir a informação documentada requerida pela norma e a necessária para sua eficácia, com controle adequado.",
    consultantGuidance:
      "Controle a informação documentada do SGSI considerando classificação, acesso e retenção seguros.",
    suggestedQuestion: "A informação documentada do SGSI é controlada adequadamente?",
    expectedEvidence: [
      "Procedimento de controle de informação documentada",
      "Lista mestra de documentos",
    ],
  },
  {
    code: "8.1",
    title: "Planejamento e controle operacional",
    description:
      "Planejar, implementar e controlar os processos necessários para atender aos requisitos e implementar as ações da cláusula 6, incluindo os controles selecionados.",
    consultantGuidance:
      "Implemente os controles do plano de tratamento de riscos e os controles operacionais de SI (gestão de acessos, backup, mudanças).",
    suggestedQuestion: "Os controles de segurança da informação planejados estão implementados?",
    expectedEvidence: [
      "Procedimentos operacionais de SI",
      "Evidências de implementação de controles",
    ],
  },
  {
    code: "8.2",
    title: "Avaliação de riscos de segurança da informação",
    description:
      "Executar avaliações de riscos de SI a intervalos planejados ou quando ocorrerem mudanças significativas, retendo a informação documentada dos resultados.",
    consultantGuidance:
      "Mantenha as avaliações de risco atualizadas e disparadas por mudanças relevantes (novos sistemas, incidentes).",
    suggestedQuestion: "As avaliações de risco de SI são realizadas periodicamente e após mudanças?",
    expectedEvidence: ["Relatórios periódicos de avaliação de riscos"],
  },
  {
    code: "8.3",
    title: "Tratamento de riscos de segurança da informação",
    description:
      "Implementar o plano de tratamento de riscos de SI, retendo a informação documentada dos resultados.",
    consultantGuidance:
      "Acompanhe a execução do plano de tratamento e a evolução dos riscos residuais.",
    suggestedQuestion: "O plano de tratamento de riscos está sendo executado e monitorado?",
    expectedEvidence: ["Acompanhamento do plano de tratamento de riscos"],
  },
  {
    code: "9.1",
    title: "Monitoramento, medição, análise e avaliação",
    description:
      "Avaliar o desempenho de segurança da informação e a eficácia do SGSI, definindo o que medir, métodos e responsáveis.",
    consultantGuidance:
      "Defina indicadores de SI (incidentes, vulnerabilidades, conformidade de controles) e avalie a eficácia.",
    suggestedQuestion: "O desempenho de segurança da informação é monitorado e avaliado?",
    expectedEvidence: ["Indicadores de SI", "Relatórios de desempenho do SGSI"],
  },
  {
    code: "9.2",
    title: "Auditoria interna",
    description:
      "Conduzir auditorias internas a intervalos planejados para verificar a conformidade e a implementação eficaz do SGSI.",
    consultantGuidance:
      "Inclua os controles do Anexo A aplicáveis (via SoA) no escopo das auditorias internas.",
    suggestedQuestion: "As auditorias internas cobrem o SGSI e os controles aplicáveis?",
    expectedEvidence: [
      "Programa de auditorias",
      "Plano e checklist de auditoria de SI",
      "Relatório de auditoria",
    ],
  },
  {
    code: "9.3",
    title: "Análise crítica pela direção",
    description:
      "A Alta Direção deve analisar criticamente o SGSI a intervalos planejados, considerando as entradas definidas pela norma.",
    consultantGuidance:
      "Inclua na análise crítica o resultado das avaliações de risco, o status de incidentes e a eficácia dos controles.",
    suggestedQuestion: "A análise crítica contempla riscos, incidentes e desempenho do SGSI?",
    expectedEvidence: ["Ata de análise crítica do SGSI"],
  },
  {
    code: "10.1",
    title: "Melhoria contínua",
    description:
      "Melhorar continuamente a adequação, suficiência e eficácia do SGSI.",
    consultantGuidance:
      "Evidencie a evolução do desempenho de segurança da informação ao longo do tempo.",
    suggestedQuestion: "Como a organização evidencia a melhoria contínua do SGSI?",
    expectedEvidence: ["Evolução de indicadores de SI", "Ações de melhoria"],
  },
  {
    code: "10.2",
    title: "Não conformidade e ação corretiva",
    description:
      "Reagir às não conformidades (incluindo incidentes de segurança da informação), avaliar a necessidade de ação para eliminar as causas e implementar ações corretivas.",
    consultantGuidance:
      "Trate incidentes de SI e não conformidades com análise de causa e verificação de eficácia.",
    suggestedQuestion: "Existe tratamento estruturado de não conformidades e incidentes de SI?",
    expectedEvidence: [
      "Procedimento de não conformidade",
      "Registros de tratamento de incidentes de SI",
    ],
  },
];
