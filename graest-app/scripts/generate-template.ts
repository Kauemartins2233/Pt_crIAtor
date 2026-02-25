/**
 * Script para gerar um template.docx com tags do docxtemplater.
 *
 * Este é um template INICIAL para teste. O usuário deve abrir o modeloPT.docx
 * original no Word e inserir as mesmas tags nos lugares corretos para
 * preservar a formatação original.
 *
 * Executar: npx tsx scripts/generate-template.ts
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  convertMillimetersToTwip,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const FONT = "Arial";
const SZ = 20;
const SZ_SM = 18;
const SZ_H = 24;
const SZ_TITLE = 22;

const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const BORDERS = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const BLUE_FILL = { type: ShadingType.CLEAR as const, fill: "D9E2F3" };
const GRAY_FILL = { type: ShadingType.CLEAR as const, fill: "F2F2F2" };

function text(t: string, opts: Partial<{ bold: boolean; italic: boolean; size: number; font: string }> = {}): TextRun {
  return new TextRun({ text: t, font: opts.font ?? FONT, size: opts.size ?? SZ, bold: opts.bold, italics: opts.italic });
}

function p(children: TextRun[], opts: Partial<{ align: typeof AlignmentType[keyof typeof AlignmentType]; shading: typeof BLUE_FILL; spacing: { before?: number; after?: number } }> = {}): Paragraph {
  return new Paragraph({ children, alignment: opts.align, shading: opts.shading, spacing: opts.spacing ?? { after: 60 } });
}

function sectionHead(num: number, titlePT: string, titleEN: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { after: 0 }, children: [] }),
    p(
      [text(`${num} - ${titlePT}`, { bold: true, size: SZ_H }), text(` / ${titleEN}`, { bold: true, italic: true, size: SZ_H })],
      { shading: BLUE_FILL, spacing: { before: 200, after: 100 } }
    ),
  ];
}

function fieldRow(labelPT: string, labelEN: string, tag: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BORDERS, width: { size: 35, type: WidthType.PERCENTAGE }, shading: BLUE_FILL,
            children: [p([text(`${labelPT} / ${labelEN}`, { bold: true })])],
          }),
          new TableCell({
            borders: BORDERS, width: { size: 65, type: WidthType.PERCENTAGE },
            children: [p([text(`{${tag}}`)])],
          }),
        ],
      }),
    ],
  });
}

function richTextBox(tag: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BORDERS,
            children: [p([text(`{@${tag}}`)])],
          }),
        ],
      }),
    ],
  });
}

function checkboxRow(label: string, tag: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: BORDERS, width: { size: 10, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [p([text(`{${tag}}`)], { align: AlignmentType.CENTER })],
      }),
      new TableCell({
        borders: BORDERS, width: { size: 90, type: WidthType.PERCENTAGE },
        children: [p([text(label)])],
      }),
    ],
  });
}

async function main() {
  const children: (Paragraph | Table)[] = [];

  // === HEADER (3 logos) ===
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS, width: { size: 33, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER,
            children: [
              p([text("UEA", { bold: true, size: 28 })], { align: AlignmentType.CENTER }),
              p([text("Universidade do Estado do Amazonas", { size: 14 })], { align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            borders: NO_BORDERS, width: { size: 34, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER,
            children: [p([text("{partnerName}", { bold: true, size: SZ_H })], { align: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: NO_BORDERS, width: { size: 33, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER,
            children: [p([text("{foundationName}", { bold: true, size: SZ_H })], { align: AlignmentType.CENTER })],
          }),
        ],
      }),
    ],
  }));

  children.push(p([]));

  // === TITLE ===
  children.push(p([text("PLANO DE TRABALHO DE PROJETO DE PESQUISA E DESENVOLVIMENTO", { bold: true, size: SZ_TITLE })], { align: AlignmentType.CENTER }));
  children.push(p([text("RESEARCH AND DEVELOPMENT PROJECT WORK PLAN", { bold: true, italic: true, size: SZ_TITLE })], { align: AlignmentType.CENTER }));
  children.push(p([text("Lei de Informática da Amazônia Ocidental (Lei nº 8.387/1991)", { size: SZ_SM })], { align: AlignmentType.CENTER, spacing: { after: 200 } }));

  // === SECTION 1: IDENTIFICAÇÃO ===
  children.push(...sectionHead(1, "IDENTIFICAÇÃO", "IDENTIFICATION"));
  children.push(fieldRow("Nome do Projeto", "Project Name", "projectName"));
  children.push(fieldRow("Apelido do Projeto", "Project Nickname", "projectNickname"));
  children.push(fieldRow("Coordenador(a) da Instituição", "Institution Coordinator", "coordinatorInstitution"));
  children.push(fieldRow("Coordenador(a) da Empresa", "Company Coordinator", "coordinatorFoxconn"));
  children.push(fieldRow("Valor Total do Projeto", "Total Project Value", "totalValue"));
  children.push(fieldRow("Valor Total por Extenso", "Total Value in Words", "totalValueWritten"));
  children.push(fieldRow("Período de Execução", "Execution Period", "executionPeriod"));
  children.push(fieldRow("Período de Vigência", "Validity Period", "validityPeriod"));

  // === SECTION 2: TIPO DE PROJETO ===
  children.push(...sectionHead(2, "TIPO DE PROJETO", "PROJECT TYPE"));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      checkboxRow("Desenvolvimento/Melhoria de SW", "sw_dev_check"),
      checkboxRow("Desenvolvimento/Melhoria de Produto", "product_dev_check"),
      checkboxRow("Desenvolvimento/Melhoria de Processo", "process_dev_check"),
      checkboxRow("Automação de Processos", "automation_check"),
      checkboxRow("Capacitação", "training_pt_check"),
      checkboxRow("Não Definido", "not_defined_pt_check"),
    ],
  }));

  // === SECTION 3: TIPO DE ATIVIDADE ===
  children.push(...sectionHead(3, "TIPO DE ATIVIDADE DE PD&I", "R&D ACTIVITY TYPE"));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      checkboxRow("I - Pesquisa Básica Dirigida", "basic_research_check"),
      checkboxRow("II - Pesquisa Aplicada", "applied_research_check"),
      checkboxRow("III - Desenvolvimento Experimental", "experimental_dev_check"),
      checkboxRow("IV - Inovação Tecnológica", "tech_innovation_check"),
      checkboxRow("V - Formação ou Capacitação Profissional", "training_at_check"),
      checkboxRow("VI - Serviços de Consultoria Científica e Tecnológica", "consulting_check"),
      checkboxRow("Não Definido", "not_defined_at_check"),
    ],
  }));

  // === SECTIONS 4-7: Rich text ===
  children.push(...sectionHead(4, "MOTIVAÇÃO", "MOTIVATION"));
  children.push(richTextBox("motivacao"));

  children.push(...sectionHead(5, "OBJETIVOS GERAIS E ESPECÍFICOS", "GENERAL AND SPECIFIC OBJECTIVES"));
  children.push(p([text("5.1 Objetivos Gerais / General Objectives", { bold: true })], { shading: GRAY_FILL }));
  children.push(richTextBox("objetivosGerais"));
  children.push(p([text("5.2 Objetivos Específicos / Specific Objectives", { bold: true })], { shading: GRAY_FILL }));
  children.push(richTextBox("objetivosEspecificos"));

  children.push(...sectionHead(6, "ESCOPO", "SCOPE"));
  children.push(richTextBox("escopo"));

  children.push(...sectionHead(7, "ESTRATÉGIAS", "STRATEGIES"));
  children.push(richTextBox("estrategias"));

  // === SECTION 8: PLANO DE AÇÃO (loop) ===
  children.push(...sectionHead(8, "PLANO DE AÇÃO", "ACTION PLAN"));
  // Loop: each activity as a mini-table
  children.push(p([text("{#activities}")]));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [new TableCell({
          borders: BORDERS, shading: BLUE_FILL, columnSpan: 2,
          children: [p([text("Atividade {index}", { bold: true })])],
        })],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, width: { size: 35, type: WidthType.PERCENTAGE }, shading: GRAY_FILL, children: [p([text("Nome / Name", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, width: { size: 65, type: WidthType.PERCENTAGE }, children: [p([text("{name}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Descrição / Description", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{description}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Justificativa / Justification", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{justification}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Período / Period", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{startDate} a {endDate}")])] }),
        ],
      }),
    ],
  }));
  children.push(p([text("{/activities}")]));

  // === SECTION 9: RECURSOS HUMANOS (loop) ===
  children.push(...sectionHead(9, "RECURSOS HUMANOS", "HUMAN RESOURCES"));
  children.push(p([text("{#professionals}")]));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [new TableCell({
          borders: BORDERS, shading: BLUE_FILL, columnSpan: 2,
          children: [p([text("Profissional {index}", { bold: true })])],
        })],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, width: { size: 35, type: WidthType.PERCENTAGE }, shading: GRAY_FILL, children: [p([text("Nome / Name", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, width: { size: 65, type: WidthType.PERCENTAGE }, children: [p([text("{name}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Formação / Education", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{education}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Titulação / Degree", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{degree}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Mini CV", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{miniCv}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Atividade / Activity", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{activityAssignment}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Contratação / Hiring", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{hiringType}")])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: GRAY_FILL, children: [p([text("Direto/Indireto", { bold: true, size: SZ_SM })])] }),
          new TableCell({ borders: BORDERS, children: [p([text("{directIndirect}")])] }),
        ],
      }),
    ],
  }));
  children.push(p([text("{/professionals}")]));

  // === SECTION 10: INDICADORES ===
  children.push(...sectionHead(10, "INDICADORES DE RESULTADOS", "RESULT INDICATORS"));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: BORDERS, shading: BLUE_FILL, width: { size: 80, type: WidthType.PERCENTAGE }, children: [p([text("Indicador", { bold: true })])] }),
          new TableCell({ borders: BORDERS, shading: BLUE_FILL, width: { size: 20, type: WidthType.PERCENTAGE }, children: [p([text("Qtd.", { bold: true })], { align: AlignmentType.CENTER })] }),
        ],
      }),
      ...[
        ["Patentes Depositadas", "patents"],
        ["Concessão de Co-titularidade", "coOwnership"],
        ["Protótipos com inovação", "prototypes"],
        ["Processo com inovação", "processes"],
        ["Produto com inovação", "products"],
        ["Programa de Computador com inovação", "software"],
        ["Publicação científica", "publications"],
        ["Profissionais formados", "trainedProfessionals"],
        ["Conservação dos ecossistemas", "ecosystemConservation"],
        ["Outros indicadores", "other"],
      ].map(([label, key]) =>
        new TableRow({
          children: [
            new TableCell({ borders: BORDERS, children: [p([text(`{${key}_check} ${label}`)])] }),
            new TableCell({ borders: BORDERS, children: [p([text(`{${key}_qty}`)], { align: AlignmentType.CENTER })] }),
          ],
        })
      ),
    ],
  }));

  // === SECTIONS 11-12 ===
  children.push(...sectionHead(11, "CARACTERÍSTICAS INOVADORAS", "INNOVATIVE FEATURES"));
  children.push(richTextBox("inovadoras"));

  children.push(...sectionHead(12, "RESULTADOS ESPERADOS", "EXPECTED RESULTS"));
  children.push(richTextBox("resultados"));
  children.push(fieldRow("Nível TRL/MRL", "TRL/MRL Level", "trlMrlLevel"));

  // === SECTION 13: CRONOGRAMA ===
  // Uses raw OOXML placeholder — the table is built programmatically in DocxGenerator
  children.push(...sectionHead(13, "CRONOGRAMA", "SCHEDULE"));
  children.push(richTextBox("cronogramaTable"));
  // === SECTIONS 14-15 ===
  children.push(...sectionHead(14, "DESAFIOS CIENTÍFICOS E TECNOLÓGICOS", "SCIENTIFIC AND TECHNOLOGICAL CHALLENGES"));
  children.push(richTextBox("desafios"));

  children.push(...sectionHead(15, "SOLUÇÃO PROPOSTA", "PROPOSED SOLUTION"));
  children.push(richTextBox("solucao"));

  // === SECTION 17 ===
  children.push(...sectionHead(17, "INFORMAÇÕES COMPLEMENTARES", "ADDITIONAL INFORMATION"));
  children.push(richTextBox("complementares"));

  // === SIGNATURES ===
  children.push(p([]));
  children.push(p([text("Manaus, _______ de _________________ de ________")]));
  children.push(p([]));

  const sigNames = [
    ["Coordenador(a) da Instituição", "Coordenador(a) da Empresa"],
    ["Responsável Técnico", "Responsável Legal da Instituição"],
  ];
  for (const row of sigNames) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: row.map((name) =>
            new TableCell({
              borders: NO_BORDERS, width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                p([]), p([]),
                p([text("________________________________________")], { align: AlignmentType.CENTER }),
                p([text(name)], { align: AlignmentType.CENTER }),
              ],
            })
          ),
        }),
      ],
    }));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertMillimetersToTwip(20),
            right: convertMillimetersToTwip(20),
            bottom: convertMillimetersToTwip(20),
            left: convertMillimetersToTwip(25),
          },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "..", "public", "template.docx");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log(`Template gerado em: ${outPath}`);
  console.log("\nTags usadas no template:");
  console.log("  Campos simples: {projectName}, {projectNickname}, {coordinatorInstitution}, etc.");
  console.log("  Texto rico (OOXML): {@motivacao}, {@objetivosGerais}, {@escopo}, etc.");
  console.log("  Loops: {#activities}...{/activities}, {#professionals}...{/professionals}");
  console.log("  Checkboxes: {sw_dev_check}, {basic_research_check}, etc.");
  console.log("\nVocê pode abrir este arquivo no Word e ajustar a formatação,");
  console.log("mantendo as tags {entre chaves} nos lugares corretos.");
}

main().catch(console.error);
