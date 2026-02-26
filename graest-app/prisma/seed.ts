import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Snippets padrão — textos reutilizáveis para a seção de Escopo (seção 6)
// ---------------------------------------------------------------------------
const defaultSnippets = [
  {
    name: "Metodologia Scrum",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Este projeto possui características quanto a tamanho, legislação, normas, equipe, dentre outras características, que necessitam tanto de uma abordagem preditiva mais tradicional, quanto outras características que necessitam de abordagens mais ágeis. Assim, o Scrum será utilizado em conjunto ao estabelecido tradicionalmente no PMBOK, principalmente o desenvolvimento do software utilizará os ritos Scrum, enquanto outras partes como a pesquisa médica e o desenvolvimento de hardware terão seu método mais aproximado ao waterfall.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "O " },
            { type: "text", marks: [{ type: "bold" }], text: "Scrum" },
            {
              type: "text",
              text: " é uma metodologia ágil para gerenciamento de projetos que se concentra em entregas iterativas e incrementais. A estrutura do Scrum inclui práticas, cerimônias e reuniões que as equipes realizam com regularidade. As etapas do Scrum que serão utilizadas neste projeto serão:",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Sprint:" },
                    {
                      type: "text",
                      text: " É o período definido para o trabalho, geralmente entre uma e quatro semanas. Durante o Sprint, a equipe de desenvolvimento se concentra em entregar o que foi planejado. Para este projeto, ficou definido que cada ciclo terá a duração de quatro semanas, com entregas ocorrendo conforme a ordem de prioridade estabelecida no cronograma de atividades da equipe.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Reunião Diária:" },
                    {
                      type: "text",
                      text: " São reuniões curtas diárias, geralmente de 15 minutos, nas quais a equipe de desenvolvimento se reúne para discutir o progresso do trabalho e quaisquer impedimentos que possam estar enfrentando. Para este projeto, essas reuniões ocorrerão todos os dias no início do expediente, na primeira hora da manhã, para atualizar o status das atividades e identificar possíveis obstáculos.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Planejamento do Sprint:" },
                    {
                      type: "text",
                      text: " Após a contratação de toda a equipe de bolsistas, a coordenação do projeto pela ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "UEA" },
                    {
                      type: "text",
                      text: " realizará uma reunião para planejar o Sprint. Nesta reunião, serão definidos os objetivos, as expectativas, as atividades a serem realizadas, as tarefas, as prioridades e os responsáveis por cada tarefa. Após essa reunião, o ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "Cronograma de Atividades Técnicas" },
                    {
                      type: "text",
                      text: " será atualizado com os nomes dos responsáveis, permitindo que cada um insira o status das suas atividades. O objetivo é refinar todo o planejamento do projeto conforme o cronograma.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Reunião de Kick-Off:" },
                    {
                      type: "text",
                      text: " Realizada na fase inicial do projeto, tem o objetivo de alinhar todos os detalhes entre os stakeholders envolvidos — cliente, gestor do projeto e membros da equipe. Para este projeto, a reunião de kick-off contará com a participação de toda a equipe da empresa, incluindo a gestão do ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "PD&I" },
                    { type: "text", text: ", Área da Saúde, Área Tecnológica e os bolsistas do projeto por parte da " },
                    { type: "text", marks: [{ type: "bold" }], text: "UEA" },
                    {
                      type: "text",
                      text: ". Nesta etapa, serão definidos o escopo, as metas, os prazos e os direcionamentos estratégicos.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Revisão do Sprint:" },
                    { type: "text", text: " Ocorre ao final do Sprint. Para este projeto, espera-se que a " },
                    { type: "text", marks: [{ type: "bold" }], text: "Salcomp" },
                    {
                      type: "text",
                      text: ", por meio de sua gestão técnica, se reúna com toda a equipe de desenvolvimento da ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "UEA" },
                    {
                      type: "text",
                      text: " para revisar, de forma conjunta, o que foi entregue. Durante esta revisão, a equipe da ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "UEA" },
                    {
                      type: "text",
                      text: ", representada pelo coordenador, demonstrará e celebrará os resultados do trabalho, verificará se o objetivo do Sprint foi atingido e se o resultado atendeu aos critérios de aceitação. A gestão técnica da ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "Salcomp" },
                    { type: "text", text: " receberá o produto e realizará a homologação." },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Retrospectiva do Sprint:" },
                    {
                      type: "text",
                      text: " É o evento que finaliza a Sprint ou ciclo de desenvolvimento do produto. Para este projeto, a equipe de desenvolvimento da ",
                    },
                    { type: "text", marks: [{ type: "bold" }], text: "UEA" },
                    {
                      type: "text",
                      text: " que participou da revisão do Sprint se reunirá para refletir sobre o ciclo anterior e identificar oportunidades de melhoria. Este será o momento de inspecionar o trabalho realizado, avaliar os pontos mencionados na reunião de revisão e identificar problemas e áreas que podem ser aprimoradas, criando um plano de ação para a próxima Sprint.",
                    },
                  ],
                },
              ],
            },
          ],
        },
        { type: "paragraph" },
      ],
    }),
  },
  {
    name: "Python",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: 'Python é uma linguagem de programação amplamente reconhecida por sua simplicidade, versatilidade e eficiência. Sua sintaxe clara e direta facilita a leitura e escrita do código, o que aumenta a produtividade das equipes de desenvolvimento. Python conta com uma vasta gama de bibliotecas e framework, como o Flask e Django, que permitem o desenvolvimento de sistemas backend robustos, aplicações de inteligência artificial, processamento de imagens e APIs RESTful. Python também é conhecido por sua comunidade ativa, que fornece suporte contínuo e atualizações frequentes. ',
            },
            { type: "text", marks: [{ type: "bold" }], text: "Utilização no Projeto:" },
            {
              type: "text",
              text: " Python será utilizado no desenvolvimento do backend do aplicativo mobile e em processos de análise de dados. Com o framework ",
            },
            { type: "text", marks: [{ type: "bold" }], text: "Django" },
            {
              type: "text",
              text: ", será possível criar servidores escaláveis e seguros, gerenciar operações de banco de dados e disponibilizar APIs para integração com dispositivos Bluetooth. Python também será empregado em scripts para automação de processos, manipulação de dados e implementação de funcionalidades específicas, garantindo eficiência no processamento e flexibilidade no desenvolvimento",
            },
          ],
        },
      ],
    }),
  },
  {
    name: "Github",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "GitHub é uma plataforma de desenvolvimento colaborativo que utiliza o sistema de controle de versão Git. Ele oferece um ambiente centralizado para armazenar, versionar e gerenciar o código-fonte de projetos, permitindo que equipes trabalhem de forma integrada e organizada. GitHub facilita o rastreamento de mudanças, a revisão de código, a resolução de conflitos e a colaboração assíncrona. Além disso, a plataforma fornece ferramentas para automação, integração contínua e implantação contínua (CI/CD), que ajudam a manter a qualidade e a eficiência do processo de desenvolvimento. ",
            },
            { type: "text", marks: [{ type: "bold" }], text: "Utilização no Projeto" },
            {
              type: "text",
              text: ": GitHub será utilizado como repositório central para armazenar o código-fonte do aplicativo e dos componentes associados. A equipe de desenvolvimento utilizará GitHub para versionamento de código, gerenciamento de branches, rastreamento de problemas e colaboração em tempo real. Ferramentas como GitHub Actions serão aplicadas para automatizar os processos de build e teste, garantindo a integração contínua e a entrega rápida de novas funcionalidades. A plataforma também facilitará a documentação",
            },
            {
              type: "text",
              marks: [{ type: "bold" }],
              text: " do projeto e a revisão de código, assegurando a qualidade e a consistência das entregas.",
            },
          ],
        },
      ],
    }),
  },
  {
    name: "Microcontroladores",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Os microcontroladores são dispositivos eletrônicos compactos que integram em um único chip uma CPU (Unidade Central de Processamento), memória (RAM e ROM), e interfaces de entrada e saída (I/O). Eles são projetados para executar tarefas específicas em sistemas embarcados, desempenhando um papel crucial em aplicações de automação industrial, dispositivos domésticos, sistemas de controle e projetos eletrônicos em geral.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Os microcontroladores são programáveis e capazes de realizar diversas funções de controle, desde operações simples, como acender LEDs, até processos complexos, como gerenciamento de motores e sensores em tempo real. Eles operam em baixas frequências (normalmente entre 1 MHz e 200 MHz) e consomem pouca energia, o que os torna ideais para aplicações portáteis e de longa duração.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "No projeto de um sistema de monitoramento de uma linha industrial, os microcontroladores desempenham um papel fundamental na aquisição e transmissão de dados dos equipamentos em tempo real. Eles são responsáveis por capturar informações dos sensores e sinaleiras das máquinas, como o status de operação (em funcionamento, parada ou falha), temperatura, pressão e velocidade. Esses dados são processados localmente no microcontrolador, o que permite aplicar filtros de ruído e lógicas de controle simples para garantir que apenas informações relevantes e precisas sejam transmitidas ao sistema supervisório.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "A comunicação entre os microcontroladores e o servidor pode ser realizada utilizando protocolos como Modbus, Ethernet/IP, I2C ou UART, facilitando a integração com o back-end desenvolvido em Django. Por meio dessa comunicação, os dados coletados são enviados para o servidor, onde são armazenados e disponibilizados para visualização em dashboards em tempo real. A Figura 3, por exemplo, mostra o esquemático de um microcontrolador qualquer.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "image",
          attrs: { src: "/uploads/1772061075703-1dbhu1.png", alt: null, title: null, width: null, height: null },
        },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "Figura - Diagrama de um microcontrolador." }] },
      ],
    }),
  },
  {
    name: "CLP",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Um CLP (Controlador Lógico Programável) é um dispositivo eletrônico usado para automação e controle de processos industriais. Ele foi desenvolvido para substituir os circuitos de relés eletromecânicos e facilitar o gerenciamento de máquinas e sistemas automatizados. O CLP é projetado para operar em ambientes industriais adversos e possui características como resistência a poeira, umidade, vibração e variações de temperatura, o que garante alta confiabilidade e durabilidade em condições extremas.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Em sua estrutura básica, um CLP é composto por uma CPU (Unidade Central de Processamento), memória e módulos de entrada e saída (I/O). A CPU é responsável por processar as instruções do programa e controlar o funcionamento do sistema. A memória armazena o programa de controle e os dados temporários necessários para a execução das tarefas. Os módulos de entrada permitem que o CLP receba sinais de dispositivos como sensores, botões e chaves de fim de curso, enquanto os módulos de saída permitem o envio de comandos para atuadores, motores, válvulas, sinaleiras e outros dispositivos.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Os CLPs utilizam linguagens de programação específicas, como Ladder, Figura 2, (Linguagem Ladder), Texto Estruturado (ST) e Blocos Funcionais (FBD). A linguagem Ladder, por exemplo, é amplamente usada por se assemelhar aos esquemas de relés elétricos, facilitando o aprendizado e a implementação de lógicas de controle.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Em um sistema de automação industrial, o CLP atua como o cérebro do processo, monitorando os sinais dos sensores em tempo real, processando essas informações e tomando decisões lógicas com base no programa previamente instalado. Quando detecta uma condição específica, como uma peça em determinada posição ou uma temperatura elevada, o CLP pode executar ações automáticas, como acionar um motor, abrir uma válvula ou enviar um alerta visual por meio de sinaleiras.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "No contexto de um sistema de monitoramento de uma linha industrial, o CLP é essencial para garantir o monitoramento contínuo e o controle eficiente das operações. Ele coleta dados sobre o status das máquinas, como funcionamento, parada ou falha, e transmite essas informações para o sistema supervisório. Isso permite que os operadores identifiquem rapidamente problemas, tomem decisões informadas e otimizem o processo produtivo.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "A principal vantagem dos CLPs é sua flexibilidade e escalabilidade. É possível reprogramá-los para novas tarefas sem grandes modificações no hardware, o que facilita adaptações em processos industriais. Sua robustez, confiabilidade e capacidade de automação tornam os CLPs indispensáveis para qualquer sistema moderno de controle e supervisão industrial.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "image",
          attrs: { src: "/uploads/1772061121702-vwg0ov.png", alt: null, title: null, width: null, height: null },
        },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "Figura 5 - Linguagem Ladder." }] },
      ],
    }),
  },
  {
    name: "Redes industriais e protocolos",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Os protocolos de comunicação industriais são conjuntos de regras e padrões que permitem a troca eficiente e confiável de informações entre máquinas, sensores, controladores, e sistemas supervisórios em ambientes industriais. Eles desempenham um papel crucial na automação industrial, garantindo que diferentes dispositivos possam se comunicar de forma sincronizada e sem perda de dados. No sistema, garantem a transmissão confiável dos dados capturados pelo hardware, facilitando o monitoramento em tempo real e a análise dos status das operações. Abaixo, têm-se algumas opções que podem ser utilizadas no projeto.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "bold" }],
              text: "Protocolo Modbus - ",
            },
            {
              type: "text",
              text: "O Modbus é um protocolo de comunicação de dados amplamente utilizado em sistemas de automação industrial para facilitar a troca eficiente de informações entre dispositivos eletrônicos. Desenvolvido originalmente em 1979 pela Modicon (agora parte da Schneider Electric), o Modbus se consolidou como uma solução open-source, o que significa que seu uso é gratuito e não requer pagamento de taxas de licenciamento, tornando-o acessível para uma ampla gama de aplicações industriais.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "O Modbus é projetado para transmitir dados numéricos e discretos entre Controladores Lógicos Programáveis (CLPs), sensores, atuadores e sistemas supervisórios (SCADA). Ele permite a comunicação de dados em formatos como:",
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "·       Bits discretos: Entradas e saídas digitais (ligado ou desligado)." }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "·       Palavra de 16 bits: Entradas e saídas analógicas, registros de dados e estados dos dispositivos.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Os dados são transmitidos em um formato padronizado, o que facilita a interoperabilidade entre dispositivos de diferentes fabricantes. O protocolo Modbus, como mostrado na Figura 5, utiliza uma arquitetura mestre-escravo, na qual um dispositivo mestre envia solicitações e os dispositivos escravos respondem com os dados solicitados.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "image",
          attrs: { src: "/uploads/1772061169795-3nfo41.png", alt: null, title: null, width: null, height: null },
        },
        { type: "paragraph", content: [{ type: "text", text: "Figura  - Protocolo Modbus." }] },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Protocolo Ethernet /IP - O Ethernet/IP (Ethernet Industrial Protocol) é um dos protocolos de comunicação industrial mais utilizados atualmente, especialmente em sistemas de automação que requerem alta velocidade, confiabilidade e integração com redes modernas. Desenvolvido pela ODVA (Open DeviceNet Vendors Association), o Ethernet/IP combina a familiaridade das redes Ethernet padrão com os requisitos específicos dos ambientes industriais, permitindo a comunicação eficiente entre dispositivos como CLPs (Controladores Lógicos Programáveis), sensores, atuadores e sistemas supervisórios (SCADA).",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "O Ethernet/IP utiliza o padrão Ethernet IEEE 802.3 para transmissão de dados e o protocolo TCP/IP como base para comunicação. Ele implementa a CIP (Common Industrial Protocol) para possibilitar a troca estruturada de informações entre dispositivos industriais. A arquitetura do Ethernet/IP permite tanto a comunicação cíclica (em tempo real) quanto a comunicação acíclica (sob demanda), oferecendo flexibilidade para diferentes necessidades.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "O Ethernet/IP, Figura 2, é uma solução robusta e eficiente para comunicação em ambientes industriais modernos. Sua alta velocidade, confiabilidade e integração com tecnologias padrão tornam-no ideal para o desenvolvimento de um sistema supervisório, permitindo monitoramento contínuo, tomada de decisões em tempo real e otimização dos processos industriais.",
            },
          ],
        },
      ],
    }),
  },
  {
    name: "React",
    targetSection: 6,
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "O React é uma biblioteca JavaScript desenvolvida pelo Facebook em 2013 para a criação de interfaces de usuário (UI) dinâmicas e eficientes. Ele é amplamente utilizado para o desenvolvimento de aplicações web modernas devido à sua flexibilidade, desempenho e facilidade de manutenção. O React adota uma abordagem baseada em componentes reutilizáveis, permitindo que os desenvolvedores construam interfaces complexas dividindo-as em pequenas partes independentes e reaproveitáveis.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Uma das principais características do React é o Virtual DOM (Document Object Model). Em vez de atualizar o DOM real diretamente, o React cria uma representação virtual dele e aplica apenas as alterações necessárias ao DOM real. Isso torna o processo de renderização mais rápido e eficiente, melhorando o desempenho geral da aplicação, especialmente em interfaces com muitas atualizações dinâmicas.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "O React também suporta JSX (JavaScript XML), uma sintaxe que combina JavaScript com HTML, permitindo escrever componentes de forma intuitiva e declarativa. Essa combinação facilita a criação de componentes visuais e a manipulação de dados de forma clara e concisa.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Outro ponto forte do React é sua capacidade de gerenciar o estado da aplicação de forma eficiente. O estado representa os dados dinâmicos da interface, e qualquer alteração nele faz com que os componentes relevantes sejam re-renderizados automaticamente. Para gerenciar estados mais complexos, bibliotecas como Redux, MobX e Context API são frequentemente usadas.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Além disso, o React possui uma vasta comunidade de desenvolvedores e um ecossistema rico em ferramentas e bibliotecas adicionais. Isso inclui soluções para roteamento, como o React Router, e bibliotecas para requisições HTTP, como o Axios e o Fetch API. Ferramentas como Create React App facilitam a configuração inicial do projeto, enquanto React Developer Tools ajudam a depurar e otimizar aplicações.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "No contexto de um sistema de monitoramento de uma linha industrial, o React pode ser utilizado para desenvolver o front-end da aplicação web. Ele permite criar dashboards interativos para visualizar o status das operações em tempo real, exibir gráficos, tabelas e alertas dinâmicos. A modularidade dos componentes facilita a criação de interfaces personalizadas para diferentes funções, como visualização de paradas, histórico de falhas e relatórios de desempenho. Além disso, o React pode consumir dados de APIs fornecidas por um back-end em Django, garantindo uma integração fluida e eficiente entre os diferentes componentes do sistema supervisório. Na Figura 6, têm-se um modelo de dashboard desenvolvida em React.",
            },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: " " }] },
        {
          type: "image",
          attrs: { src: "/uploads/1772061213939-fbzus9.png", alt: null, title: null, width: null, height: null },
        },
        { type: "paragraph", content: [{ type: "text", text: "Figura 7 - Dashboard feita em React." }] },
      ],
    }),
  },
];

// ---------------------------------------------------------------------------
// Staff Members padrão — profissionais cadastrados globalmente
// ---------------------------------------------------------------------------
const defaultStaffMembers = [
  {
    name: "Marivan Silva Gomes",
    category: "professor",
    education: "Doutorando em Engenharia Elétrica. Mestre em Engenharia de Processos, Bacharel em Engenharia Elétrica pela Universidade Federal do Amazonas.",
    degree: "Mestre em Engenharia de Processos",
    miniCv: "",
  },
  {
    name: "Alan Ferreira Pinheiro Tavares",
    category: "professor",
    education: "Doutor em Engenharia Mecânica, com foco em Robótica e ênfase em Visão Computacional e Inteligência Artificial.",
    degree: "Doutor",
    miniCv:
      "Trabalha como professor voluntário da (UEA-EST) Universidade do Estado do Amazonas - Escola Superior de Tecnologia, atuou como consultor técnico científico do (CREATHUS) Instituto de Tecnologia da Amazônia, desenvolvedor na empresa Acta Robotics na área de dispositivos robóticos, navegação autônoma e visão computacional. Finalizou doutorado na Universidade Estadual de Campinas (FEM-UNICAMP) na área de robótica. Atuou como pesquisador convidado na Faculdade de Engenharia Mecânica da Universidade do Porto (FEUP-UP) em parceria com a Startup Connect Robotics. Recebeu título de M.Sc. Licenciado em Engenharia Mecânica pela Universidade de Campinas na área de Segurança Veicular, B.Sc. Licenciado em Engenharia Mecatrônica pela Universidade Estadual do Amazonas (EST-UEA). Tem experiência em robótica móvel, algoritmos de inteligência artificial voltados para imagem, automação industrial, sistemas embarcados, e desenvilvimento web backend. Trabalhou com projetos e consultoria de automação industrial e fabricação industrial para a empresa Samsung através de um acordo com uma Universidade do Estado do Amazonas. Trabalhou como revisor do Congresso Nacional de Engenharia Mecânica (CONEM2016), bem como o Congresso Brasileiro de Engenharia de Manufatura (COBEF2017).",
  },
  {
    name: "André Dias de Lima Machado",
    category: "aluno",
    education: "Mestre em Engenharia Elétrica",
    degree: "Mestre",
    miniCv:
      "Possui graduação em Engenharia Mecatrônica pela Universidade do Estado do Amazonas (2013), Pós-graduação em Desenvolvimento de Jogos Eletrônicos, Mestrado em Engenharia Elétrica. Atualmente é Gerente de Portfólio do Instituto Creathus. Mais de 5 anos de experiência como coordenador de projetos de PD&I nas áreas de Robótica, Mecatrônica e Automação, com ênfase em Robótica móvel e Processamento Digital de Imagens.",
  },
  {
    name: "Kauê Martins de Souza",
    category: "aluno",
    education: "Bacharel em Engenharia de Controle e Automação e outras áreas correlatas ao projeto.",
    degree: "Mestrando",
    miniCv:
      "Mestrando no Instituto Tecnológico de Aeronáutica (ITA), na área de Dispositivos Eletrônicos do Programa de pós-graduação em Engenharia Eletrônica e Computação. Graduado em Engenharia de Controle e Automação pela Universidade do Estado do Amazonas (2023). Membro do grupo de pesquisa do Núcleo de Robótica (UEA). Tem experiência na área de Engenharia de Controle e Automação, com ênfase em Computação e Eletrônica, atuando principalmente nas seguintes áreas: Sistemas embarcados, Automação Industrial, Visão Computacional e fabricação Digital.",
  },
  {
    name: "Arleson Brito da Silva Junior",
    category: "aluno",
    education: "Graduando Engenharia da Computação",
    degree: "Graduando",
    miniCv:
      "Graduando em Engenharia de Computação (5º período - FUCAPI), com foco em desenvolvimento de software web e experiência prática em tecnologias front-end. Especializado na criação de interfaces responsivas utilizando HTML, CSS e JavaScript (React), com domínio de ferramentas como Figma e Websim para prototipação de telas. Utiliza o Visual Studio Code como ambiente principal de desenvolvimento. Habilidades em Python e integração de sistemas, conectando front-end com back-end. Participa de projetos como membro do Grupo de Pesquisa KRAKEN, vinculado à Faculdade FUCAPI, atuando de forma ativa em diversas iniciativas voltadas para pesquisa, automação e robótica. Tendo como responsabilidades a elaboração e publicação de artigos e pesquisas científicas, e no desenvolvimento de front-end.",
  },
  {
    name: "Matheus Pedrosa Dácio",
    category: "aluno",
    education: "Bacharel em área correlata",
    degree: "Pós-graduando",
    miniCv:
      "Bacharel em Engenharia Eletrônica pela Escola Superior de Tecnologia (EST) da Universidade do Estado do Amazonas (UEA). Possui experiência na área de Tecnologia da Informação e Comunicação, com ênfase em Sistemas para Internet, Arquitetura de Software, Sistemas Embarcados, Ciência de Dados, Automação de Processos e Inteligência Artificial.",
  },
  {
    name: "Marcus Eduardo Nascimento Sena",
    category: "aluno",
    education: "Graduando em Engenharia de Software",
    degree: "Graduando",
    miniCv:
      "Graduando em Engenharia de Software pela FIAP, atualmente no 5º período, possuo sólida experiência em desenvolvimento Android em projetos de P&D com a utilização de Kotlin e Jetpack Compose para aplicações médicas com uso de Inteligência Artificial. Possuo experiência em Back-end com a utilização de Java com Springboot e Python com Django e FastAPI. Quanto a parte de Infraestrutura, possuo experiência com Docker, Docker-Compose, Git, Podman, Jenkins, AWS, Terraform. Além disso, na parte de DB possuo experiência com PostgreSQL, Oracle, MySQL, Sqlite, Hive, Mongo.",
  },
  {
    name: "Samuel Teixeira dos Santos",
    category: "aluno",
    education: "Graduando Engenharia de Software",
    degree: "Graduando",
    miniCv:
      "Cursando Engenharia de Software pela FUCAPI (5º período), tenho formação com sólida experiência em desenvolvimento de software, com ênfase em backend. Atua em projetos acadêmicos e colaborativos que envolvem desde a criação de APIs até o desenvolvimento de aplicações web. Possui domínio em estruturas de dados com C e prática com paradigmas de orientação a objetos em Java e Python. Com participações em eventos como hackathons, assumindo funções técnicas e contribuindo para o planejamento e a implementação de sistemas backend. Tem conhecimentos em ferramentas modernas como Git, GitHub, Spring Boot, Firebase e Maven, além de experiência com boas práticas de versionamento e organização de projetos. Possuo capacidade de adaptação, resolução de problemas e trabalho em equipe e me destaco como um desenvolvedor comprometido com a entrega de soluções bem arquitetadas.",
  },
  {
    name: "Nelson Emiliano Silva",
    category: "aluno",
    education: "Graduando Engenharia Eletrônica",
    degree: "Graduando",
    miniCv:
      "Graduação em andamento em Engenharia Eletrônica pela Universidade do Estado do Amazonas e em Análise e Desenvolvimento de Sistemas pela UNINTER. Participação em projetos de pesquisa voltados à visão computacional e machine learning, projeto voltado a ambientes multi-thread em C. Experiência como estagiário na Moto Honda da Amazônia, com atuação na área de Compras e Novos Modelos, trabalhando em atividades como contratação e negociação com fornecedores, processos logísticos, desenvolvimento de novos fornecedores e implantação de melhorias sistêmicas.",
  },
  {
    name: "Victor Hugo de Sá Reis",
    category: "aluno",
    education: "Bacharel em Engenharia da Computação",
    degree: "Pós-graduando",
    miniCv:
      "Graduando em Engenharia da computação pelo Uninorte atualmente no 9º, possuo 2 anos atuando na de área inteligência artificial e NLP voltado principalmente para o campo de assistentes virtuais, minha experiência profissional abrange desde a implementação e manutenção de modelos de IA tanto para o mercado dos EUA e da América Latina como um todo, possuo domínios em Python, C, C#, Java, javascript, git, Kotlin e já utilizei ferramentas como TensorFlow, Scikit-Learn, Pandas, github, gitlab, atualmente sei duas línguas sendo português e inglês e tenho habilidades em trabalho colaborativo e comunicação em equipes multidisciplinares.",
  },
  {
    name: "Ricardo Bulcão Dias Júnior",
    category: "professor",
    education: "Direito",
    degree: "Pós-graduando",
    miniCv:
      "Realiza Pós-graduação de Gerenciamento de Projetos, possui experiência e forte atuação em análise técnica de projetos, acompanhamento de indicadores e suporte metodológico à coordenação de projetos.",
  },
  {
    name: "Geoliana Matos de Souza",
    category: "aluno",
    education: "Graduanda em Análise e Desenvolvimento de Sistemas",
    degree: "Graduanda",
    miniCv:
      "Graduanda em Análise e Desenvolvimento de Sistemas, em fase inicial de formação acadêmica, com atuação voltada para o desenvolvimento de aplicações e integração de soluções tecnológicos. Possui experiência prátca em Python para automação e análise de dados, além de conhecimentos em Vue.js para construção de interfaces web responsivas.",
  },
  {
    name: "Paulo Rodrigo Gomes Santana",
    category: "aluno",
    education: "Graduando em Engenharia Controle e Automação",
    degree: "Graduando",
    miniCv:
      "Graduando em Engenharia Eletrônica pela Universidade Estadual do Amazonas, possui mais de 4 anos de experiência em desenvolvimento mobile, com foco em Android e atuação em iOS e React Native. Especializado em Kotlin e Java, destaca-se na migração de sistemas legados e na implementação de soluções de segurança, como criptografia e integração com RASP. Domina ferramentas como Android SDK, Jetpack, MVVM, Firebase e CI/CD, entregando soluções nativas e multiplataforma de alta qualidade.",
  },
  {
    name: "Marcos Cesar da Rocha Seruffo",
    category: "professor",
    education: "Pós-Doutorado em Engenharia Elétrica – A4 capes",
    degree: "Doutor em Engenharia Elétrica",
    miniCv:
      "Graduação em Tecnologia em Processamento de Dados pelo Centro Universitário do Estado do Pará (CESUPA - 2004), Especialização em Suporte Técnico de Sistemas Computacionais pela Universidade Federal do Pará (UFPA - 2005), Mestrado em Ciência da Computação (PPGCC - UFPA - 2008) e Doutorado em Engenharia Elétrica, com ênfase em Computação Aplicada (PPGEE - UFPA - 2012). Pós-Doutorado na Pontifícia Universidade Católica do Rio de Janeiro, no Programa de Pós-Graduação em Engenharia Elétrica (PPGEE - PUC-RJ - 2020). Atualmente sou Professor Associado II da Universidade Federal do Pará, estando vinculado ao Programa de Pós-Graduação em Estudos Antrópicos na Amazônia (PPGEAA-Castanhal) e Programa de Pós-graduação em Engenharia Elétrica (PPGEE-ITEC), estando atualmente (2023) como Coordenador da Área de Computação Aplicada do PPGEE e Vice Coordenador do PPGEAA. Desenvolvo atividades de ensino, extensão e pesquisa em áreas interdisciplinares como Ciência de Dados, Mineração de Dados e Processamento de Linguagem Natural. Sou Bolsista Produtividade em Desenvolvimento Tecnológico e Extensão Inovadora - DT - Nível 2 do CNPq.",
  },
  {
    name: "João Evangelista Neto",
    category: "professor",
    education: "Bacharel em Engenharias",
    degree: "Pós-doutorando",
    miniCv:
      "Pós-doutorando em engenharia de materiais e metalurgia na Poli USP, graduação em Tecnologia Mecânica pelo Instituto de Tecnologia da Amazônia (1987), graduação em Engenharia Mecânica pelo Instituto de Tecnologia da Amazônia (2002), graduação em Engenharia Elétrica pelo Instituto de Tecnologia da Amazônia (2004), graduação em Engenharia Civil pelo Centro Universitário do Norte (2016), graduação em Engenharia Química (2021) UNINASSAU e doutorado em Engenharia Elétrica pela Universidade Federal do Pará (2012). Tem experiência em diversas áreas da Engenharia Elétrica, Mecânica, Civil e Química, com ênfase em Petróleo e Gás, Automação e Engenharia Biomédica.",
  },
  {
    name: "Brenda Rodrigues Bezerra",
    category: "aluno",
    education: "Design Gráfico",
    degree: "Pós-graduando",
    miniCv:
      "Possui sete anos de experiência com foco em UX/UI, identidade visual e projetos de PD&II. Tem expertise em levantamento de requisitos, criação de interfaces, pesquisa com usuários, wireframing e ampla experiência em prototipagem de sites, sistemas e aplicativos.",
  },
  {
    name: "Waldeyde Oderilda Magalhães dos Santos",
    category: "professor",
    education: "Odontologia",
    degree: "Doutor",
    miniCv:
      "Doutorado em Saúde Pública pela Universidade de Ciências Empresariais e Sociais-UCES/B.A.Argentina. Possui graduação em Odontologia pela Universidade Federal do Amazonas (1988), possui MBA em Gestão e Auditoria dos Sistemas de Saúde, especialização em Gestão Hospitalar e Serviços de Saúde. Professora efetiva da Universidade do Estado do Amazonas-UEA, coordenou durante 6 anos o Centro de Pesquisa e Desenvolvimento da Escola de Saúde da UEA. Atua na coordenação de projetos de pesquisa, desenvolvimento e inovação.",
  },
];

async function main() {
  console.log("Seeding default data...");

  // Copy seed images to public/uploads if they don't exist
  const seedImagesDir = path.join(__dirname, "..", "public", "seed-images");
  const uploadsDir = path.join(__dirname, "..", "public", "uploads");

  if (fs.existsSync(seedImagesDir)) {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    for (const file of fs.readdirSync(seedImagesDir)) {
      const dest = path.join(uploadsDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(seedImagesDir, file), dest);
        console.log(`  📷 Imagem copiada: ${file}`);
      }
    }
  }

  // Upsert snippets — só cria se não existir um com o mesmo nome
  for (const snippet of defaultSnippets) {
    const existing = await prisma.snippet.findFirst({
      where: { name: snippet.name },
    });

    if (!existing) {
      await prisma.snippet.create({ data: snippet });
      console.log(`  ✔ Snippet criado: "${snippet.name}"`);
    } else {
      console.log(`  ⏭ Snippet já existe: "${snippet.name}"`);
    }
  }

  // Upsert staff members — cria ou atualiza dados
  for (const member of defaultStaffMembers) {
    const existing = await prisma.staffMember.findFirst({
      where: { name: member.name },
    });

    if (!existing) {
      await prisma.staffMember.create({ data: member });
      console.log(`  ✔ Staff member criado: "${member.name}"`);
    } else {
      await prisma.staffMember.update({
        where: { id: existing.id },
        data: {
          category: member.category,
          education: member.education,
          degree: member.degree,
          miniCv: member.miniCv,
        },
      });
      console.log(`  🔄 Staff member atualizado: "${member.name}"`);
    }
  }

  console.log("\nSeed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
