// Catálogo de requisitos da ISO 45001:2018 (Saúde e Segurança Ocupacional).
// Segue a estrutura de alto nível (Anexo SL), compartilhando a numeração das
// cláusulas 4–10 com 9001/14001, permitindo documentos integrados (SGI).

import type { RequirementSeed } from "./iso9001-requirements";

export const ISO45001_REQUIREMENTS: RequirementSeed[] = [
  {
    code: "4.1",
    title: "Contexto da organização",
    description:
      "Determinar questões internas e externas pertinentes ao propósito que afetam a capacidade de alcançar os resultados pretendidos do sistema de gestão de SSO.",
    consultantGuidance:
      "Considere fatores que afetam a saúde e segurança: natureza das atividades, perfil da força de trabalho, requisitos legais de SST e cultura de segurança.",
    suggestedQuestion:
      "A análise de contexto considera os fatores que afetam a saúde e segurança ocupacional?",
    expectedEvidence: ["Análise de contexto de SSO", "Matriz SWOT com dimensão de SST"],
  },
  {
    code: "4.2",
    title: "Necessidades e expectativas dos trabalhadores e partes interessadas",
    description:
      "Determinar os trabalhadores e outras partes interessadas pertinentes ao sistema de gestão de SSO, suas necessidades e expectativas, e quais se tornam requisitos legais e outros requisitos.",
    consultantGuidance:
      "Os trabalhadores são partes interessadas centrais na ISO 45001. Inclua sindicatos, CIPA, SESMT e órgãos de fiscalização.",
    suggestedQuestion:
      "Os trabalhadores e demais partes interessadas de SSO e seus requisitos estão identificados?",
    expectedEvidence: [
      "Matriz de partes interessadas de SSO",
      "Levantamento de requisitos legais de SST",
    ],
  },
  {
    code: "4.3",
    title: "Escopo do sistema de gestão de SSO",
    description:
      "Determinar os limites e a aplicabilidade do sistema de gestão de SSO, considerando atividades, locais de trabalho e trabalhadores.",
    consultantGuidance:
      "Defina o escopo abrangendo todos os trabalhadores e locais sob controle da organização.",
    suggestedQuestion: "O escopo do sistema de gestão de SSO está documentado?",
    expectedEvidence: ["Declaração de escopo do sistema de SSO"],
  },
  {
    code: "4.4",
    title: "Sistema de gestão de SSO",
    description:
      "Estabelecer, implementar, manter e melhorar continuamente o sistema de gestão de SSO e seus processos.",
    consultantGuidance:
      "Mapeie os processos de SSO e suas interações, conectando-os aos perigos e riscos.",
    suggestedQuestion: "Os processos do sistema de gestão de SSO estão definidos?",
    expectedEvidence: ["Mapa de processos de SSO", "Estrutura do sistema de SSO"],
  },
  {
    code: "5.1",
    title: "Liderança e comprometimento",
    description:
      "A Alta Direção deve demonstrar liderança e comprometimento, assumindo responsabilização geral pela prevenção de lesões e problemas de saúde e pela provisão de locais de trabalho seguros e saudáveis.",
    consultantGuidance:
      "Evidencie o desenvolvimento de uma cultura de segurança, a proteção dos trabalhadores contra represálias e a provisão de recursos.",
    suggestedQuestion:
      "Como a Alta Direção demonstra comprometimento com a segurança e saúde dos trabalhadores?",
    expectedEvidence: ["Ata de análise crítica", "Evidências de provisão de recursos de SST"],
  },
  {
    code: "5.2",
    title: "Política de SSO",
    description:
      "Estabelecer uma política de SSO que inclua compromisso com condições de trabalho seguras e saudáveis, eliminação de perigos e redução de riscos, atendimento a requisitos legais e consulta e participação dos trabalhadores.",
    consultantGuidance:
      "A política de SSO deve conter compromissos explícitos de eliminação de perigos, redução de riscos e consulta dos trabalhadores.",
    suggestedQuestion:
      "Existe uma política de SSO com compromissos de eliminação de perigos e participação dos trabalhadores?",
    expectedEvidence: ["Política de SSO", "Evidência de divulgação"],
  },
  {
    code: "5.3",
    title: "Papéis, responsabilidades e autoridades",
    description:
      "Atribuir e comunicar responsabilidades e autoridades para papéis pertinentes do sistema de gestão de SSO.",
    consultantGuidance:
      "Defina responsabilidades de SSO incluindo SESMT, CIPA e brigada de emergência.",
    suggestedQuestion: "As responsabilidades de SSO estão definidas e comunicadas?",
    expectedEvidence: ["Matriz de responsabilidades de SSO", "Organograma de SST"],
  },
  {
    code: "5.4",
    title: "Consulta e participação dos trabalhadores",
    description:
      "Estabelecer processos para consulta e participação dos trabalhadores (e seus representantes) no desenvolvimento, planejamento, implementação, avaliação e ações de melhoria do sistema de gestão de SSO.",
    consultantGuidance:
      "Este é um requisito característico da ISO 45001. Evidencie a atuação da CIPA, reuniões de SST e canais de consulta/participação.",
    suggestedQuestion:
      "Existem mecanismos formais de consulta e participação dos trabalhadores em SSO?",
    expectedEvidence: [
      "Atas de CIPA",
      "Registros de consulta e participação dos trabalhadores",
      "Procedimento de consulta e participação",
    ],
  },
  {
    code: "6.1.2",
    title: "Identificação de perigos e avaliação de riscos",
    description:
      "Estabelecer processos para a identificação contínua de perigos e a avaliação de riscos de SSO e de outros riscos para o sistema de gestão, bem como a identificação de oportunidades.",
    consultantGuidance:
      "Construa o inventário de perigos e a avaliação de riscos (APR, GRO/PGR). Este é o requisito central da ISO 45001.",
    suggestedQuestion:
      "Existe um processo de identificação de perigos e avaliação de riscos (PGR/GRO) implementado?",
    expectedEvidence: [
      "Inventário de perigos e avaliação de riscos",
      "Programa de Gerenciamento de Riscos (PGR/GRO)",
      "Análise Preliminar de Riscos (APR)",
    ],
  },
  {
    code: "6.1.3",
    title: "Requisitos legais e outros requisitos",
    description:
      "Determinar e ter acesso aos requisitos legais e outros requisitos de SST aplicáveis e determinar como se aplicam.",
    consultantGuidance:
      "Mantenha uma matriz de requisitos legais de SST (NRs aplicáveis) atualizada e avaliada.",
    suggestedQuestion:
      "Há uma matriz de requisitos legais de SST (Normas Regulamentadoras) aplicáveis?",
    expectedEvidence: [
      "Matriz de requisitos legais de SST",
      "Levantamento de NRs aplicáveis",
    ],
  },
  {
    code: "6.2",
    title: "Objetivos de SSO e planejamento",
    description:
      "Estabelecer objetivos de SSO coerentes com a política e planejar como alcançá-los.",
    consultantGuidance:
      "Defina objetivos de SSO mensuráveis (ex.: redução de acidentes, taxa de frequência) com planos de ação.",
    suggestedQuestion: "Existem objetivos de SSO mensuráveis com planos para alcançá-los?",
    expectedEvidence: ["Quadro de objetivos e metas de SSO", "Indicadores de SST (TF, TG)"],
  },
  {
    code: "7.1",
    title: "Recursos",
    description: "Determinar e prover os recursos necessários ao sistema de gestão de SSO.",
    consultantGuidance:
      "Verifique a provisão de EPIs, recursos do SESMT, infraestrutura e recursos de emergência.",
    suggestedQuestion: "A organização provê os recursos necessários à SSO?",
    expectedEvidence: ["Plano de recursos de SST", "Controle de fornecimento de EPI"],
  },
  {
    code: "7.2",
    title: "Competência",
    description:
      "Determinar a competência necessária dos trabalhadores que afetam o desempenho de SSO, incluindo a capacidade de identificar perigos.",
    consultantGuidance:
      "Inclua treinamentos obrigatórios das NRs na matriz de competência (NR-35, NR-33, NR-10, etc.).",
    suggestedQuestion: "As competências de SSO, incluindo treinamentos legais (NRs), estão atendidas?",
    expectedEvidence: [
      "Matriz de competência de SST",
      "Registros de treinamentos das NRs",
    ],
  },
  {
    code: "7.3",
    title: "Conscientização",
    description:
      "Os trabalhadores devem estar conscientes da política de SSO, dos perigos e riscos de SSO pertinentes, dos incidentes e da sua capacidade de se afastar de situações de perigo grave.",
    consultantGuidance:
      "Promova DDS/DDSMS e conscientização sobre o direito de recusa diante de risco grave e iminente.",
    suggestedQuestion:
      "Os trabalhadores conhecem os perigos do seu trabalho e o direito de se afastar de risco grave?",
    expectedEvidence: ["Registros de DDS", "Registros de conscientização de SSO"],
  },
  {
    code: "7.4",
    title: "Comunicação",
    description:
      "Estabelecer processos de comunicação interna e externa pertinentes ao sistema de gestão de SSO, considerando aspectos de diversidade dos trabalhadores.",
    consultantGuidance:
      "Defina a comunicação de SSO interna (alertas, near-miss, resultados) e externa (órgãos, contratadas).",
    suggestedQuestion: "Existe um plano de comunicação de SSO interno e externo?",
    expectedEvidence: ["Procedimento de comunicação", "Matriz de comunicação de SSO"],
  },
  {
    code: "7.5",
    title: "Informação documentada",
    description:
      "O sistema de gestão de SSO deve incluir a informação documentada requerida e a necessária para sua eficácia, controlada adequadamente.",
    consultantGuidance:
      "Aplique o controle de informação documentada aos registros de SST (ASO, PGR, treinamentos, EPI).",
    suggestedQuestion: "A informação documentada de SSO é controlada adequadamente?",
    expectedEvidence: ["Procedimento de controle de informação documentada"],
  },
  {
    code: "8.1",
    title: "Planejamento e controle operacional",
    description:
      "Estabelecer e controlar os processos necessários, incluindo a eliminação de perigos e a redução de riscos de SSO conforme a hierarquia de controles, gestão de mudanças e aquisição/contratadas.",
    consultantGuidance:
      "Implemente controles segundo a hierarquia (eliminação, substituição, controles de engenharia, administrativos, EPI). Inclua gestão de mudanças e gestão de contratadas.",
    suggestedQuestion:
      "Os controles operacionais seguem a hierarquia de controles e abrangem contratadas?",
    expectedEvidence: [
      "Procedimentos operacionais de SST",
      "Permissões de trabalho (PT)",
      "Procedimento de gestão de contratadas",
    ],
  },
  {
    code: "8.2",
    title: "Preparação e resposta a emergências",
    description:
      "Estabelecer e manter processos para preparação e resposta a situações de emergência potenciais de SSO.",
    consultantGuidance:
      "Elabore plano de emergência (PAE) com brigada treinada e simulados periódicos.",
    suggestedQuestion:
      "Existe um plano de resposta a emergências de SSO com brigada e simulados?",
    expectedEvidence: [
      "Plano de atendimento a emergências (PAE)",
      "Registros de simulados de emergência",
    ],
  },
  {
    code: "9.1",
    title: "Monitoramento, medição, análise e avaliação",
    description:
      "Monitorar, medir, analisar e avaliar o desempenho de SSO e a eficácia do sistema, incluindo a avaliação do atendimento aos requisitos legais.",
    consultantGuidance:
      "Defina indicadores reativos e proativos de SST e avalie periodicamente o atendimento legal (NRs).",
    suggestedQuestion:
      "O desempenho de SSO e o atendimento legal (NRs) são monitorados e avaliados?",
    expectedEvidence: [
      "Indicadores de SST",
      "Avaliação de atendimento a requisitos legais de SST",
      "Exames ocupacionais (PCMSO/ASO)",
    ],
  },
  {
    code: "9.2",
    title: "Auditoria interna",
    description:
      "Conduzir auditorias internas a intervalos planejados para verificar a conformidade e a implementação eficaz do sistema de gestão de SSO.",
    consultantGuidance:
      "Inclua os requisitos de SST e legais no escopo das auditorias internas.",
    suggestedQuestion: "As auditorias internas cobrem o sistema de SSO e os requisitos legais?",
    expectedEvidence: [
      "Programa de auditorias",
      "Plano e checklist de auditoria de SSO",
      "Relatório de auditoria",
    ],
  },
  {
    code: "9.3",
    title: "Análise crítica pela direção",
    description:
      "A Alta Direção deve analisar criticamente o sistema de gestão de SSO a intervalos planejados, considerando as entradas definidas pela norma.",
    consultantGuidance:
      "Inclua na análise crítica o desempenho de SSO, incidentes, consulta dos trabalhadores e compliance legal.",
    suggestedQuestion:
      "A análise crítica contempla o desempenho de SSO e a consulta dos trabalhadores?",
    expectedEvidence: ["Ata de análise crítica do sistema de SSO"],
  },
  {
    code: "10.2",
    title: "Incidente, não conformidade e ação corretiva",
    description:
      "Estabelecer processos para relatar, investigar e tratar incidentes e não conformidades, determinar as causas e implementar ações corretivas, incluindo a participação dos trabalhadores.",
    consultantGuidance:
      "Implemente a investigação de incidentes e acidentes com análise de causa raiz e participação dos trabalhadores.",
    suggestedQuestion:
      "Existe processo de investigação de incidentes/acidentes com análise de causa e ação corretiva?",
    expectedEvidence: [
      "Procedimento de investigação de incidentes",
      "Registros de investigação de acidentes",
      "Comunicação de Acidente de Trabalho (CAT)",
    ],
  },
  {
    code: "10.3",
    title: "Melhoria contínua",
    description:
      "Melhorar continuamente a adequação, suficiência e eficácia do sistema de gestão de SSO, promovendo a cultura de segurança e a participação dos trabalhadores.",
    consultantGuidance:
      "Evidencie a evolução dos indicadores de SST e o amadurecimento da cultura de segurança.",
    suggestedQuestion: "Como a organização evidencia a melhoria contínua do desempenho de SSO?",
    expectedEvidence: ["Evolução de indicadores de SST", "Ações de melhoria de SSO"],
  },
];
