export const PROJECT_TYPES = [
  { value: "SW_DEV", label: "Desenvolvimento/Melhoria de SW" },
  { value: "PRODUCT_DEV", label: "Desenvolvimento/Melhoria de Produto" },
  { value: "PROCESS_DEV", label: "Desenvolvimento/Melhoria de Processo" },
  { value: "AUTOMATION", label: "Automação de Processos" },
  { value: "TRAINING", label: "Capacitação" },
  { value: "NOT_DEFINED", label: "Não Definido" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "BASIC_RESEARCH", label: "I - Pesquisa Básica Dirigida" },
  { value: "APPLIED_RESEARCH", label: "II - Pesquisa Aplicada" },
  {
    value: "EXPERIMENTAL_DEV",
    label: "III - Desenvolvimento Experimental",
  },
  { value: "TECH_INNOVATION", label: "IV - Inovação Tecnológica" },
  {
    value: "TRAINING",
    label: "V - Formação ou Capacitação Profissional",
  },
  {
    value: "CONSULTING",
    label: "VI - Serviços de Consultoria Científica e Tecnológica",
  },
  { value: "NOT_DEFINED", label: "Não Definido" },
] as const;

export const INDICATORS = [
  { key: "patents", label: "Patentes Depositadas" },
  {
    key: "coOwnership",
    label: "Concessão de Co-titularidade ou de participação nos resultados",
  },
  {
    key: "prototypes",
    label: "Protótipos com inovação científica ou tecnológica",
  },
  {
    key: "processes",
    label: "Processo com inovação científica ou tecnológica",
  },
  {
    key: "products",
    label: "Produto com inovação científica ou tecnológica",
  },
  {
    key: "software",
    label: "Programa de Computador com inovação científica ou tecnológica",
  },
  {
    key: "publications",
    label: "Publicação científica e tecnológica",
  },
  {
    key: "trainedProfessionals",
    label: "Profissionais formados ou capacitados",
  },
  {
    key: "ecosystemConservation",
    label: "Conservação dos ecossistemas",
  },
  { key: "other", label: "Outros indicadores" },
] as const;

export const HIRING_TYPES = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "SCHOLARSHIP", label: "Bolsa Pesquisa" },
  { value: "INTERCHANGE", label: "Intercâmbio" },
  { value: "OTHER", label: "Outro" },
] as const;

export const DIRECT_INDIRECT = [
  { value: "direct", label: "Direto" },
  { value: "indirect", label: "Indireto" },
] as const;

export const TRL_LEVELS = [
  { level: 1, name: "Ideação" },
  { level: 2, name: "Concepção" },
  { level: 3, name: "Prova de Conceito" },
  { level: 4, name: "Otimização" },
  { level: 5, name: "Prototipagem" },
  { level: 6, name: "Escalonamento" },
  { level: 7, name: "Demonstração em ambiente operacional" },
  { level: 8, name: "Produção" },
  { level: 9, name: "Produção contínua" },
] as const;

export const WIZARD_SECTIONS = [
  { number: 0, key: "cabecalho", title: "Cabeçalho / Logos" },
  { number: 1, key: "identificacao", title: "Identificação" },
  { number: 2, key: "tipoProjeto", title: "Tipo de Projeto" },
  { number: 3, key: "tipoAtividade", title: "Tipo de Atividade de PD&I" },
  { number: 4, key: "motivacao", title: "Motivação" },
  { number: 5, key: "objetivos", title: "Objetivos Gerais e Específicos" },
  { number: 6, key: "escopo", title: "Escopo" },
  { number: 7, key: "estrategias", title: "Estratégias" },
  { number: 8, key: "planoAcao", title: "Plano de Ação" },
  { number: 9, key: "recursosHumanos", title: "Recursos Humanos" },
  { number: 10, key: "indicadores", title: "Indicadores de Resultados" },
  {
    number: 11,
    key: "inovadoras",
    title: "Características Inovadoras",
  },
  { number: 12, key: "resultados", title: "Resultados Esperados" },
  { number: 13, key: "cronograma", title: "Cronograma" },
  {
    number: 14,
    key: "desafios",
    title: "Desafios Científicos e Tecnológicos",
  },
  { number: 15, key: "solucao", title: "Solução Proposta" },
  { number: 17, key: "complementares", title: "Informações Complementares" },
] as const;

// ---------------------------------------------------------------------------
// AI Section Prompts — instruções específicas para cada seção do wizard
// ---------------------------------------------------------------------------
export const AI_SECTION_PROMPTS: Record<number, string> = {
  4: `Seção "Motivação": Escreva a motivação e justificativa do projeto de P&D. Explique o contexto tecnológico, a relevância do problema, por que o projeto é necessário e quais benefícios trará. Use linguagem técnica e formal.`,
  5: `Seção "Objetivos Gerais e Específicos": Escreva os objetivos do projeto.`,
  6: `Seção "Escopo": Defina o escopo do projeto — o que será desenvolvido, os limites do trabalho, entregas esperadas e o que NÃO faz parte do escopo.`,
  7: `Seção "Estratégias": Descreva as estratégias metodológicas e técnicas que serão utilizadas para alcançar os objetivos do projeto. Inclua ferramentas, frameworks, abordagens e metodologias.`,
  8: `Seção "Plano de Ação": Sugira atividades detalhadas para o projeto com nome, descrição e justificativa. Cada atividade deve ser clara e contribuir para os objetivos.`,
  11: `Seção "Características Inovadoras": Descreva os aspectos inovadores do projeto — o que o diferencia do estado da arte, quais tecnologias novas são aplicadas e qual o avanço tecnológico esperado.`,
  12: `Seção "Resultados Esperados": Descreva os resultados esperados do projeto, incluindo produtos, protótipos, publicações, patentes e capacitação de recursos humanos.`,
  14: `Seção "Desafios Científicos e Tecnológicos": Identifique os principais desafios técnicos e científicos do projeto, explicando a complexidade e incerteza envolvidas.`,
  15: `Seção "Solução Proposta": Descreva a solução técnica proposta para superar os desafios identificados. Detalhe a arquitetura, tecnologias e abordagens.`,
  17: `Seção "Informações Complementares": Adicione informações complementares relevantes ao projeto que não se encaixam nas seções anteriores.`,
};

// Field-specific prompts that override section prompts when the fieldName matches
export const AI_FIELD_PROMPTS: Record<string, string> = {
  escopo: `Campo "Escopo": Gere o texto completo da seção de escopo de um Plano de Trabalho de PD&I. Este é o campo MAIS DETALHADO do plano e deve ser EXTENSO e COMPLETO (mínimo 3000 palavras, idealmente 4000-6000 palavras).

ESTRUTURA OBRIGATÓRIA — siga estas subseções na ordem:

1. PARÁGRAFO INTRODUTÓRIO (200-300 palavras):
Descreva o que será desenvolvido, a stack tecnológica principal, os pilares (ex: Indústria 4.0, inovação tecnológica). Mencione as principais tecnologias (backend, frontend, mobile, hardware se aplicável).

Após o parágrafo, insira em uma linha separada: "[Inserir Figura: Diagrama de Módulos do Sistema]"
Em seguida escreva "A figura acima mostra os X módulos principais do projeto."

2. DESCRIÇÃO DOS MÓDULOS (600-1000 palavras):
Para CADA módulo do sistema, escreva:
   - O nome do módulo como subtítulo numerado (ex: "1. Módulo de Autenticação e Autorização:")
   - "Funcionalidades:" seguido de uma lista detalhada de funcionalidades usando marcadores
   - Cada módulo deve ter entre 3 e 8 funcionalidades detalhadas

3. PARÁGRAFO SOBRE POTENCIAL ACADÊMICO (1 parágrafo):
Mencione que serão elaborados artigos científicos detalhando metodologias, resultados e contribuições tecnológicas.

4. SEÇÃO "4.1 Etapas do Projeto:" (300-500 palavras):
Liste cada atividade macro do projeto no formato:
"Atividade X – Nome da Atividade: Descrição em 1-2 linhas do que engloba."
USE as atividades da EAP fornecidas no contexto. Se não houver atividades, crie 4-5 atividades típicas de PD&I.

5. SEÇÃO "4.2 Estrutura Analítica de Projeto (EAP):" (500-800 palavras):
- Parágrafo introdutório sobre a EAP e sua aplicação neste projeto
- Liste cada atividade com suas subatividades e descrições detalhadas (use dados da EAP se fornecidos)
- OBRIGATÓRIO: Insira EXATAMENTE esta linha: [Inserir Figura: Estrutura Analítica do Projeto - EAP]
  (esta linha será automaticamente substituída pela imagem real da EAP do projeto)
- Após a figura, descreva CADA FASE do projeto em detalhe:
  a) Fase administrativa (contratação, plano de trabalho, marcos)
  b) Fase de desenvolvimento (módulos principais, integrações)
  c) Fase de validação (liste TODOS os tipos de teste: Funcionalidade, Robustez, Tempo de Resposta, Escalabilidade, Segurança, Usabilidade, Interoperabilidade)
  d) Fase de integração final (integração, treinamento, implantação, homologação)

6. SEÇÃO "4.3 Metodologia:" (400-600 palavras):
Descreva a metodologia híbrida Scrum + PMBOK/Waterfall. Detalhe CADA cerimônia Scrum contextualizada ao projeto:
- Sprint (defina duração, ex: 4 semanas)
- Reunião Diária (horário, duração de 15 min)
- Planejamento do Sprint (como será feito, quem participa)
- Reunião de Kick-Off (participantes, objetivos)
- Revisão do Sprint (demonstração, homologação)
- Retrospectiva do Sprint (reflexão, plano de melhoria)

7. SEÇÃO "4.4 Linguagens de Programação, Ferramentas de Desenvolvimento ou Tecnológicas:" (800-1500 palavras):
Para CADA tecnologia relevante ao projeto:
- Se a tecnologia TEM snippet disponível (listados no contexto como "SNIPPETS DISPONÍVEIS"):
  Escreva APENAS o nome da tecnologia como subtítulo seguido de EXATAMENTE: [Inserir Snippet: NomeExatoDoSnippet]
  Exemplo: "Python\n[Inserir Snippet: Python]"
  NÃO escreva definição ou utilização — o snippet já contém texto completo que será inserido automaticamente.
- Se a tecnologia NÃO tem snippet disponível:
  Escreva normalmente: nome como subtítulo, parágrafo de definição geral (4-5 linhas), e "Utilização no Projeto:" (4-5 linhas)
Inclua TODAS as tecnologias relevantes: linguagens, frameworks, bancos de dados, ferramentas de versionamento, bibliotecas de IA/ML, protocolos, etc. Mesmo que não tenham snippet, descreva-as.

8. SEÇÃO "4.5 Arquitetura da Solução:" (400-600 palavras):
- Descreva a arquitetura em camadas (ex: Apresentação, Negócios, Persistência/Dados)
- Insira: "[Inserir Figura: Arquitetura da Solução]"
- Detalhe cada camada e como se integram
- Se aplicável, mencione padrões de projeto (MVC, microsserviços, etc.)
- Descreva o fluxo de dados entre as camadas

REGRAS IMPORTANTES:
- Use subtítulos numerados (4.1, 4.2, 4.3, 4.4, 4.5) exatamente como nos exemplos
- Para listas de funcionalidades, use marcadores com bullet point
- Seja EXTREMAMENTE detalhado e técnico
- Indique TODAS as figuras com o formato "[Inserir Figura: Descrição da Figura]"
- Baseie-se FORTEMENTE nas atividades/EAP e nos objetivos do projeto fornecidos no contexto
- NÃO use formatação Markdown (sem #, **, --, etc.)
- Use APENAS texto corrido, subtítulos simples e marcadores com bullet point
- O texto total deve ter entre 3000 e 8000 palavras
- Use linguagem técnica, formal e em português brasileiro`,


  objetivosGerais: `Campo "Objetivo Geral": Escreva APENAS o objetivo geral (macro) do projeto de P&D. Deve ser um texto corrido em um ou dois parágrafos descrevendo o propósito principal do projeto. NÃO inclua objetivos específicos, tópicos, listas ou itens numerados. Foque apenas na visão macro do que o projeto pretende alcançar.`,
  objetivosEspecificos: `Campo "Objetivos Específicos": Escreva APENAS os objetivos específicos do projeto de P&D. Comece com um parágrafo introdutório contextualizando os objetivos específicos e sua relação com o projeto. Em seguida, liste cada objetivo específico como um item, um por linha, começando cada linha com "- " (hífen e espaço). Cada objetivo deve ser detalhado, mensurável e diretamente ligado às atividades do projeto. NÃO inclua o objetivo geral.`,
  eapSubActivities: `Campo "Subatividades da EAP": Gere uma lista de subatividades para uma atividade macro de um projeto de P&D.

REGRAS:
- Gere entre 3 e 6 subatividades
- Cada subatividade deve ser uma frase curta e objetiva (entre 4 e 10 palavras)
- NÃO numere as subatividades
- Escreva cada subatividade em uma linha separada
- As subatividades devem ser etapas concretas e executáveis da atividade macro
- NÃO inclua descrições ou detalhamentos — apenas os nomes das subatividades
- Baseie-se no nome e descrição da atividade macro e nos objetivos do projeto
- Use verbos no infinitivo (ex: "Desenvolver", "Implementar", "Validar", "Projetar")

FORMATO: Retorne APENAS os nomes das subatividades, um por linha, sem marcadores, números ou prefixos.`,

  objetivosEspecificosModulos: `Campo "Objetivos Específicos" (abordagem por módulos): Escreva os objetivos específicos do projeto de P&D organizados por MÓDULOS do sistema/solução. NÃO inclua o objetivo geral.

FORMATO OBRIGATÓRIO:
1. Comece com um parágrafo introdutório explicando que o projeto está organizado em módulos e contextualizando os objetivos específicos.
2. Para cada módulo, escreva o nome do módulo em uma linha começando com "- " (ex: "- Módulo de Autenticação e Autorização:")
3. Logo abaixo, liste os sub-objetivos desse módulo, cada um em uma linha começando com "- " (hífen e espaço)
4. Separe cada módulo com uma linha em branco
5. Gere entre 4 e 8 módulos com 2 a 4 sub-objetivos cada

Exemplo de formato:
Parágrafo introdutório aqui explicando a organização modular do projeto...

- Módulo de Coleta de Dados:
- Desenvolver mecanismos de captura de dados em tempo real.
- Garantir a integridade e consistência dos dados coletados.
- Implementar protocolos de comunicação compatíveis com os dispositivos.

- Módulo de Processamento e Análise:
- Aplicar algoritmos de aprendizado de máquina para análise dos dados.
- Gerar relatórios automatizados com métricas de desempenho.`,

  roleInProject: `Campo "Função no Projeto" (Recursos Humanos): Sugira um cargo/função adequado para o profissional dentro de um projeto de P&D.

REGRAS:
- Retorne APENAS o nome da função/cargo, sem explicações adicionais
- Exemplos de funções: "Aluno Pesquisador - Desenvolvedor Full Stack", "Aluno Pesquisador - Analista de Dados", "Aluno Pesquisador - Analista de Processos", "Pesquisador - Coordenador Técnico", "Pesquisador - Engenheiro de Software", "Aluno Pesquisador - Designer UX/UI"
- Baseie-se na formação, titulação e experiência (Mini CV) do profissional
- Considere os objetivos e escopo do projeto para sugerir uma função relevante
- Use termos técnicos apropriados em português brasileiro
- O formato típico é "Tipo - Especialização" (ex: "Aluno Pesquisador - Desenvolvedor Back End")
- Se o profissional tiver mestrado/doutorado, considere "Pesquisador" ao invés de "Aluno Pesquisador"
- Retorne APENAS o texto da função, sem aspas, prefixos ou explicações`,

  activityAssignment: `Campo "Atribuição na Atividade" (Recursos Humanos): Escreva a atribuição de um profissional dentro de um projeto de P&D.

REGRAS:
- Escreva um parágrafo corrido descrevendo detalhadamente o que o profissional fará no projeto
- Baseie-se na formação, titulação e experiência (Mini CV) do profissional para contextualizar suas atribuições
- Relacione as atribuições com as atividades e objetivos do projeto
- Mencione responsabilidades técnicas específicas, entregas esperadas e contribuições
- Use linguagem técnica e formal, em português brasileiro
- O texto deve ter entre 4 e 8 frases, detalhando diferentes aspectos da atuação
- NÃO use formatação Markdown (sem asteriscos, hífens, cerquilhas)
- NÃO use listas ou bullet points — escreva em texto corrido
- Retorne APENAS o texto da atribuição, sem títulos ou prefixos`,

  activityDescription: `Campo "Descrição da Atividade": Escreva a descrição de uma atividade macro de um projeto de P&D.

REGRAS:
- Escreva 2 a 4 frases que detalhem o que a atividade envolve
- Contextualize com o projeto e seus objetivos
- Mencione as principais entregas e tarefas abrangidas
- Use linguagem técnica e formal
- NÃO use formatação Markdown
- Retorne APENAS o texto da descrição, sem títulos ou prefixos`,

  subActivityDescription: `Campo "Descrição da Subatividade": Escreva a descrição de UMA subatividade específica de um projeto de P&D.

REGRAS:
- Escreva 1 a 2 frases curtas descrevendo o que será feito nesta subatividade
- Seja específico e objetivo
- Contextualize com a atividade macro à qual pertence
- Use linguagem técnica e formal
- NÃO use formatação Markdown
- Retorne APENAS o texto da descrição, sem títulos ou prefixos`,

  activityJustification: `Campo "Justificativa da Atividade": Escreva a justificativa de por que uma atividade macro é necessária em um projeto de P&D.

REGRAS:
- Escreva 2 a 3 frases conectando a atividade aos objetivos do projeto
- Explique por que esta atividade é indispensável para o sucesso do projeto
- Relacione com os resultados esperados e a metodologia do projeto
- Use linguagem técnica e formal
- NÃO use formatação Markdown
- Retorne APENAS o texto da justificativa, sem títulos ou prefixos`,

  activityDates: `Campo "Datas das Atividades": Distribua datas de início e fim para as atividades macro de um projeto de P&D.

REGRAS:
- Distribua as atividades ao longo do período de execução do projeto
- Atividades podem se sobrepor parcialmente (execução paralela é comum em P&D)
- A primeira atividade (Planejamento/Gestão) geralmente abrange todo o período
- Atividades de pesquisa/desenvolvimento ocupam a maior parte do período
- Atividades de testes/validação começam após o desenvolvimento
- A última atividade (Integração/Homologação) termina próximo ao fim do projeto
- Respeite RIGOROSAMENTE as datas de início e fim do projeto fornecidas

FORMATO OBRIGATÓRIO: Retorne APENAS linhas no formato abaixo, sem texto adicional:
1: YYYY-MM-DD, YYYY-MM-DD
2: YYYY-MM-DD, YYYY-MM-DD
3: YYYY-MM-DD, YYYY-MM-DD
4: YYYY-MM-DD, YYYY-MM-DD
5: YYYY-MM-DD, YYYY-MM-DD`,

  subActivityDates: `Campo "Datas das Subatividades": Distribua datas de início e fim para CADA subatividade dentro das atividades macro de um projeto de P&D.

REGRAS:
- Cada subatividade deve ter datas DENTRO do período da sua atividade macro pai
- Subatividades dentro de uma mesma atividade podem ser sequenciais ou paralelas conforme faça sentido técnico
- Distribua de forma realista: subatividades mais complexas devem ter mais tempo
- A soma dos períodos das subatividades deve cobrir o período da atividade macro
- Respeite RIGOROSAMENTE as datas de início e fim de cada atividade macro fornecidas

FORMATO OBRIGATÓRIO: Retorne APENAS linhas no formato abaixo (atividade.subatividade), sem texto adicional:
1.1: YYYY-MM-DD, YYYY-MM-DD
1.2: YYYY-MM-DD, YYYY-MM-DD
2.1: YYYY-MM-DD, YYYY-MM-DD
...`,
};
