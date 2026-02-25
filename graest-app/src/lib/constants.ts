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
  objetivosGerais: `Campo "Objetivo Geral": Escreva APENAS o objetivo geral (macro) do projeto de P&D. Deve ser um texto corrido em um ou dois parágrafos descrevendo o propósito principal do projeto. NÃO inclua objetivos específicos, tópicos, listas ou itens numerados. Foque apenas na visão macro do que o projeto pretende alcançar.`,
  objetivosEspecificos: `Campo "Objetivos Específicos": Escreva APENAS os objetivos específicos do projeto de P&D. Comece com um parágrafo introdutório contextualizando os objetivos específicos e sua relação com o projeto. Em seguida, liste cada objetivo específico como um item, um por linha, começando cada linha com "- " (hífen e espaço). Cada objetivo deve ser detalhado, mensurável e diretamente ligado às atividades do projeto. NÃO inclua o objetivo geral.`,
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
};
