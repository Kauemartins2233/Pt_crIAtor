import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as fs from "fs";
import * as path from "path";
import type { PlanFormData, FinanceiroData, EquipamentoItem, RhFinanceiroItem, OutrosSubItem, CronogramaFinanceiroMes } from "@/types/plan";
import { defaultFinanceiroData } from "@/types/plan";
import {
  INDICATORS,
  TRL_LEVELS,
  HIRING_TYPES,
  DIRECT_INDIRECT,
} from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import { numberToWordsBRL } from "@/lib/numberToWords";

// ---------------------------------------------------------------------------
// JSONContent type (matches TipTap structure)
// ---------------------------------------------------------------------------
interface JSONContent {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR");
}

function lookupLabel(
  list: ReadonlyArray<{ value: string; label: string }>,
  value: string
): string {
  return list.find((i) => i.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Default font: Verdana 10pt for all generated OOXML runs
// ---------------------------------------------------------------------------
const DEFAULT_FONT = '<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="20"/><w:szCs w:val="20"/>';

// Paragraph properties: justified text with spacing after for visual paragraph separation
const PARA_PROPS = '<w:pPr><w:spacing w:after="200" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>';

// Empty paragraph used as a blank line separator between content paragraphs
const EMPTY_PARA = `<w:p><w:pPr><w:jc w:val="both"/></w:pPr><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>`;

// ---------------------------------------------------------------------------
// TipTap JSON → OOXML conversion
// ---------------------------------------------------------------------------

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRunProps(marks?: JSONContent["marks"]): string {
  const props: string[] = [DEFAULT_FONT];
  if (marks) {
    for (const mark of marks) {
      if (mark.type === "bold") props.push("<w:b/>");
      if (mark.type === "italic") props.push("<w:i/>");
      if (mark.type === "underline") props.push('<w:u w:val="single"/>');
      if (mark.type === "strike") props.push("<w:strike/>");
    }
  }
  return `<w:rPr>${props.join("")}</w:rPr>`;
}

function extractPlainText(node: JSONContent): string {
  if (node.text) return node.text;
  if (node.content) return node.content.map(extractPlainText).join("");
  return "";
}

function nodeToRuns(node: JSONContent): string {
  if (node.text) {
    const rPr = buildRunProps(node.marks);
    return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(node.text)}</w:t></w:r>`;
  }
  if (node.type === "hardBreak") {
    // Marker — handled by splitParagraphAtBreaks; fallback to line break
    return `<w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:br/></w:r>`;
  }
  if (node.content) {
    return node.content.map((child) => nodeToRuns(child)).join("");
  }
  return "";
}

/**
 * Split a paragraph node's children at hardBreak boundaries into separate
 * OOXML paragraphs. This ensures proper w:spacing between lines that were
 * separated by <br> in the editor (single newlines in AI output).
 */
function splitParagraphAtBreaks(node: JSONContent, paraProps: string): string[] {
  const children = node.content ?? [];
  if (children.length === 0) {
    return [`<w:p>${paraProps}</w:p>`];
  }

  // Check if there are any hardBreaks
  const hasBreaks = children.some((c) => c.type === "hardBreak");
  if (!hasBreaks) {
    const runs = children.map((c) => nodeToRuns(c)).join("");
    return [`<w:p>${paraProps}${runs}</w:p>`];
  }

  // Split children into groups separated by hardBreak
  const groups: JSONContent[][] = [];
  let current: JSONContent[] = [];
  for (const child of children) {
    if (child.type === "hardBreak") {
      groups.push(current);
      current = [];
    } else {
      current.push(child);
    }
  }
  groups.push(current);

  // Each group becomes its own <w:p>
  return groups
    .filter((g) => g.length > 0 || groups.length === 1)
    .map((g) => {
      const runs = g.map((c) => nodeToRuns(c)).join("");
      return `<w:p>${paraProps}${runs}</w:p>`;
    });
}

// Collected images from rich text fields, injected into the zip in post-processing
interface CollectedImage {
  src: string;       // /uploads/filename.png
  rId: string;       // unique relationship ID
  mediaPath: string; // word/media/contentImgN.ext
}

// Global collector — reset before each generateDocx call
let collectedImages: CollectedImage[] = [];
let contentImgCounter = 0;

function tiptapToOoxml(content: JSONContent | null): string {
  if (!content || !content.content) {
    return `<w:p><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
  }

  const paragraphs: string[] = [];

  for (const node of content.content) {
    switch (node.type) {
      case "paragraph": {
        // Split at hardBreak nodes so each line becomes its own <w:p> with spacing
        const paraParts = splitParagraphAtBreaks(node, PARA_PROPS);
        paragraphs.push(...paraParts);
        break;
      }

      case "heading": {
        const runs = node.content
          ? node.content
              .map((child) => {
                if (child.text) {
                  return `<w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(child.text)}</w:t></w:r>`;
                }
                return nodeToRuns(child);
              })
              .join("")
          : "";
        paragraphs.push(`<w:p><w:pPr><w:spacing w:before="300" w:after="120" w:line="276" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr>${runs}</w:p>`);
        break;
      }

      case "bulletList": {
        if (node.content) {
          let isFirstModule = true;
          for (const listItem of node.content) {
            if (listItem.type === "listItem" && listItem.content) {
              for (const child of listItem.content) {
                // Extract plain text to detect module headers (lines ending with ":")
                const plainText = extractPlainText(child).trim();
                const isModuleHeader = plainText.endsWith(":");

                if (isModuleHeader) {
                  // Blank line between modules (not before first) — use same EMPTY_PARA as motivation
                  const FONT_BOLD = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/>`;
                  if (!isFirstModule) {
                    paragraphs.push(EMPTY_PARA);
                  }
                  paragraphs.push(
                    `<w:p><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">${escapeXml(plainText)}</w:t></w:r></w:p>`
                  );
                  isFirstModule = false;
                } else {
                  // Regular item: bullet, indented under module
                  const runs = nodeToRuns(child);
                  paragraphs.push(
                    `<w:p><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/><w:ind w:left="720" w:hanging="360"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve">\u2022 </w:t></w:r>${runs}</w:p>`
                  );
                }
              }
            }
          }
        }
        break;
      }

      case "orderedList": {
        if (node.content) {
          let counter = 1;
          for (const listItem of node.content) {
            if (listItem.type === "listItem" && listItem.content) {
              for (const child of listItem.content) {
                const runs = nodeToRuns(child);
                paragraphs.push(
                  `<w:p><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/><w:ind w:left="360" w:hanging="360"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve">${counter}. </w:t></w:r>${runs}</w:p>`
                );
                counter++;
              }
            }
          }
        }
        break;
      }

      case "blockquote": {
        if (node.content) {
          for (const child of node.content) {
            const runs = nodeToRuns(child);
            paragraphs.push(
              `<w:p><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/><w:ind w:left="720"/><w:jc w:val="both"/></w:pPr>${runs}</w:p>`
            );
          }
        }
        break;
      }

      case "image": {
        const src = (node.attrs?.src as string) || "";
        if (src.startsWith("/uploads/")) {
          // Local uploaded image — collect for DOCX embedding
          contentImgCounter++;
          const ext = src.split(".").pop()?.toLowerCase() || "png";
          const rId = `rIdContentImg${contentImgCounter}`;
          const mediaPath = `word/media/contentImg${contentImgCounter}.${ext}`;
          collectedImages.push({ src, rId, mediaPath });

          // Default size: ~14cm wide (reasonable for A4), auto height proportional
          // Real dimensions will be read from file in post-processing
          const widthEmu = 5040000;  // ~14cm
          const heightEmu = 3780000; // ~10.5cm (3:4 default, adjusted later)
          const drawingXml = buildImageDrawingXml(rId, widthEmu, heightEmu, `contentImg${contentImgCounter}`);
          paragraphs.push(`<w:p><w:r>${drawingXml}</w:r></w:p>`);
        } else {
          // External URL — placeholder
          paragraphs.push(
            `<w:p><w:r><w:rPr>${DEFAULT_FONT}<w:i/><w:color w:val="888888"/></w:rPr><w:t>[Imagem: ${escapeXml(src)}]</w:t></w:r></w:p>`
          );
        }
        break;
      }

      default: {
        const runs = nodeToRuns(node);
        if (runs) {
          paragraphs.push(`<w:p>${PARA_PROPS}${runs}</w:p>`);
        }
        break;
      }
    }
  }

  // Insert blank line between text paragraphs for visual separation in Word
  if (paragraphs.length === 0) {
    return `<w:p><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
  }

  const output: string[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    output.push(paragraphs[i]);
    // Add blank line after regular paragraphs (not after last, not after/before lists or images)
    const isTextPara = paragraphs[i].includes(PARA_PROPS) && !paragraphs[i].includes("<w:drawing");
    const nextIsTextPara = i + 1 < paragraphs.length && paragraphs[i + 1].includes(PARA_PROPS) && !paragraphs[i + 1].includes("<w:drawing");
    if (isTextPara && nextIsTextPara) {
      output.push(EMPTY_PARA);
    }
  }
  return output.join("");
}

// ---------------------------------------------------------------------------
// Cronograma table as raw OOXML
// ---------------------------------------------------------------------------

import type { ActivityFormData } from "@/types/plan";

// ---------------------------------------------------------------------------
// Activities section as raw OOXML (replaces template loop for full formatting control)
// ---------------------------------------------------------------------------

function buildActivitiesOoxml(activities: ActivityFormData[]): string {
  if (activities.length === 0) {
    return `<w:p><w:r><w:rPr>${DEFAULT_FONT}<w:i/></w:rPr><w:t>Nenhuma atividade cadastrada.</w:t></w:r></w:p>`;
  }

  const FONT_NORMAL = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="20"/><w:szCs w:val="20"/>`;
  const FONT_BOLD = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/>`;
  const FONT_SMALL = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="18"/><w:szCs w:val="18"/>`;
  const FONT_LABEL = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/>`;
  const LINE_SPACING = `<w:pPr><w:spacing w:line="276" w:lineRule="auto"/></w:pPr>`;

  const paragraphs: string[] = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const idx = i + 1;

    // Activity title (bold)
    paragraphs.push(
      `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">${idx}. ${escapeXml(act.name || "(sem nome)")}</w:t></w:r></w:p>`
    );

    // Description (normal)
    if (act.description) {
      paragraphs.push(
        `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_LABEL}</w:rPr><w:t xml:space="preserve">Descrição: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(act.description)}</w:t></w:r></w:p>`
      );
    }

    // Sub-activities (if any non-empty ones)
    const rawSubs = act.subActivities || [];
    const subs = rawSubs.filter((s) => {
      const name = typeof s === "object" ? s.name : s;
      return name && name.trim() !== "";
    });
    if (subs.length > 0) {
      paragraphs.push(
        `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_LABEL}</w:rPr><w:t>Subatividades:</w:t></w:r></w:p>`
      );
      for (let j = 0; j < subs.length; j++) {
        const sub = subs[j];
        const subName = typeof sub === "object" ? sub.name : sub;
        const subDesc = typeof sub === "object" && sub.description ? sub.description : "";
        paragraphs.push(
          `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto"/><w:ind w:left="360"/></w:pPr><w:r><w:rPr>${FONT_SMALL}</w:rPr><w:t xml:space="preserve">${idx}.${j + 1} </w:t></w:r><w:r><w:rPr>${FONT_SMALL}<w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(subName)}:</w:t></w:r>${subDesc ? `<w:r><w:rPr>${FONT_SMALL}</w:rPr><w:t xml:space="preserve"> ${escapeXml(subDesc)}</w:t></w:r>` : ""}</w:p>`
        );
      }
    }

    // Justification (normal)
    if (act.justification) {
      paragraphs.push(
        `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_LABEL}</w:rPr><w:t xml:space="preserve">Justificativa: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(act.justification)}</w:t></w:r></w:p>`
      );
    }

    // Dates
    const startDate = act.startDate ? formatDateBR(act.startDate) : "\u2014";
    const endDate = act.endDate ? formatDateBR(act.endDate) : "\u2014";
    paragraphs.push(
      `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_LABEL}</w:rPr><w:t xml:space="preserve">Início: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${startDate}</w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">    </w:t></w:r><w:r><w:rPr>${FONT_LABEL}</w:rPr><w:t xml:space="preserve">Fim: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${endDate}</w:t></w:r></w:p>`
    );

    // Spacing between activities
    if (i < activities.length - 1) {
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`);
    }
  }

  return paragraphs.join("");
}

// ---------------------------------------------------------------------------
// Build raw OOXML for professionals (Section 9)
// ---------------------------------------------------------------------------

function buildProfessionalsSummaryTable(professionals: PlanFormData["professionals"]): string {
  const border = '<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders>';
  const fontH = '<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="14"/><w:szCs w:val="14"/>';
  const fontR = '<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="14"/><w:szCs w:val="14"/>';
  const center = '<w:pPr><w:jc w:val="center"/></w:pPr>';

  function cell(text: string, width: string, extra = "", ppr = "", rpr = fontR): string {
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="pct"/>${border}${extra}</w:tcPr><w:p>${ppr}<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
  }

  // Header row
  const headerRow = `<w:tr>${[
    cell("", "250", "", center, fontH),
    cell("Nome do Profissional", "1500", "", center, fontH),
    cell("Formação Profissional", "800", "", center, fontH),
    cell("Função no Projeto", "1700", "", center, fontH),
    cell("Horas Mensais", "750", "", center, fontH),
  ].join("")}</w:tr>`;

  // Data rows
  const dataRows = professionals.map((p, i) => {
    const categoryLabel = p.category === "professor" ? "Professor Pesquisador" : p.category === "aluno" ? "Aluno Pesquisador" : "";
    const funcao = [categoryLabel, p.roleInProject].filter(Boolean).join(" \u2013 ");

    return `<w:tr>${[
      cell(String(i + 1), "250", "", center),
      cell(p.name || "", "1500"),
      cell(p.degree || "", "800", "", center),
      cell(funcao, "1700"),
      cell("", "750", "", center),
    ].join("")}</w:tr>`;
  }).join("");

  // Total row — merge first 4 columns, keep last separate
  const mergeStart = '<w:gridSpan w:val="4"/>';
  const mergeContinue = '<w:gridSpan w:val="0"/><w:vMerge/>';
  const totalRow = `<w:tr><w:tc><w:tcPr><w:tcW w:w="4250" w:type="pct"/>${border}${mergeStart}</w:tcPr><w:p>${center}<w:r><w:rPr>${fontR}<w:b/></w:rPr><w:t xml:space="preserve">TOTAL HORAS MES</w:t></w:r></w:p></w:tc>${cell("", "750", "", center, `${fontR}<w:b/>`)}</w:tr>`;

  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>${headerRow}${dataRows}${totalRow}</w:tbl>`;
}

function buildProfessionalsOoxml(professionals: PlanFormData["professionals"]): string {
  if (professionals.length === 0) {
    return `<w:p><w:r><w:rPr>${DEFAULT_FONT}<w:i/></w:rPr><w:t>Nenhum profissional cadastrado.</w:t></w:r></w:p>`;
  }

  const FONT_NORMAL = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="20"/><w:szCs w:val="20"/>`;
  const FONT_BOLD = `<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/>`;
  const LINE_SPACING = `<w:pPr><w:spacing w:line="276" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>`;

  // --- Summary table ---
  const summaryTable = buildProfessionalsSummaryTable(professionals);

  const paragraphs: string[] = [
    summaryTable,
    // Spacing between table and curricula
    `<w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>`,
  ];

  for (let i = 0; i < professionals.length; i++) {
    const p = professionals[i];
    const idx = i + 1;

    // Title line: "Profissional 01:" bold + "Aluno Pesquisador – Função" normal
    const categoryLabel = p.category === "professor" ? "Professor Pesquisador" : p.category === "aluno" ? "Aluno Pesquisador" : "";
    const titleParts = [categoryLabel, p.roleInProject].filter(Boolean).join(" \u2013 ");
    const titleRun = titleParts
      ? `<w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve"> ${escapeXml(titleParts)}</w:t></w:r>`
      : "";
    paragraphs.push(
      `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Profissional ${String(idx).padStart(2, "0")}:</w:t></w:r>${titleRun}</w:p>`
    );

    // Nome (bold label + normal value)
    paragraphs.push(
      `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Nome: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(p.name || " ")}</w:t></w:r></w:p>`
    );

    // Formação + Grau on same line
    const educationText = [p.education, p.degree ? `Grau: ${p.degree}` : ""].filter(Boolean).join(" \u2014 ");
    if (educationText) {
      paragraphs.push(
        `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Formação: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(educationText)}</w:t></w:r></w:p>`
      );
    }

    // Mini CV
    if (p.miniCv) {
      paragraphs.push(
        `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Mini currículo: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(p.miniCv)}</w:t></w:r></w:p>`
      );
    }

    // Atividades a realizar
    if (p.activityAssignment) {
      paragraphs.push(
        `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Atividades a realizar: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(p.activityAssignment)}</w:t></w:r></w:p>`
      );
    }

    // Tipo contratação + Direto/Indireto
    const hiringLabel = lookupLabel(HIRING_TYPES as unknown as { value: string; label: string }[], p.hiringType);
    const directLabel = lookupLabel(DIRECT_INDIRECT as unknown as { value: string; label: string }[], p.directIndirect);

    paragraphs.push(
      `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Tipo contratação: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(hiringLabel)}</w:t></w:r></w:p>`
    );

    paragraphs.push(
      `<w:p>${LINE_SPACING}<w:r><w:rPr>${FONT_BOLD}</w:rPr><w:t xml:space="preserve">Direto/Indireto: </w:t></w:r><w:r><w:rPr>${FONT_NORMAL}</w:rPr><w:t xml:space="preserve">${escapeXml(directLabel)}</w:t></w:r></w:p>`
    );

    // Spacing between professionals
    if (i < professionals.length - 1) {
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`);
    }
  }

  return paragraphs.join("");
}

// ---------------------------------------------------------------------------
// Pre-process template: replace {#activities}...{/activities} with {@activitiesContent}
// ---------------------------------------------------------------------------

function replaceActivitiesLoopInTemplate(zip: PizZip): void {
  const docXml = zip.file("word/document.xml")?.asText();
  if (!docXml) return;

  const startTag = "{#activities}";
  const startIdx = docXml.indexOf(startTag);
  if (startIdx === -1) return; // No loop to replace, maybe already processed

  // Find the <w:p containing the start tag
  const pStart = Math.max(
    docXml.lastIndexOf("<w:p ", startIdx),
    docXml.lastIndexOf("<w:p>", startIdx)
  );
  if (pStart === -1) return;

  // Find the close tag {/activities} — may be split across runs
  let closeIdx = docXml.indexOf("{/activities}", startIdx);
  if (closeIdx === -1) {
    // Tag split by proofErr — search for '{/' near 'activities' near '}'
    let searchPos = startIdx;
    while (searchPos < docXml.length) {
      const braceSlash = docXml.indexOf("{/", searchPos);
      if (braceSlash === -1) break;
      const nearby = docXml.substring(braceSlash, braceSlash + 500);
      if (nearby.includes("activities")) {
        const actIdx = docXml.indexOf("activities", braceSlash);
        closeIdx = docXml.indexOf("}", actIdx);
        break;
      }
      searchPos = braceSlash + 2;
    }
  }
  if (closeIdx === -1) return;

  const pEnd = docXml.indexOf("</w:p>", closeIdx);
  if (pEnd === -1) return;
  const endIdx = pEnd + "</w:p>".length;

  // Replace entire loop with a single raw XML tag
  const replacement = `<w:p><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t>{@activitiesContent}</w:t></w:r></w:p>`;
  const newXml = docXml.substring(0, pStart) + replacement + docXml.substring(endIdx);
  zip.file("word/document.xml", newXml);
}

// ---------------------------------------------------------------------------
// Pre-process template: replace {#professionals}...{/professionals} with {@professionalsContent}
// ---------------------------------------------------------------------------

function replaceProfessionalsLoopInTemplate(zip: PizZip): void {
  const docXml = zip.file("word/document.xml")?.asText();
  if (!docXml) return;

  // Strip all XML tags to get raw text — helps find split tags
  const textOnly = docXml.replace(/<[^>]+>/g, "");

  // Check if the template even has a professionals loop
  if (!textOnly.includes("{#professionals}")) return;

  // Find opening tag — may be split across runs
  let openBraceIdx = -1;
  {
    let searchPos = 0;
    while (searchPos < docXml.length) {
      const braceHash = docXml.indexOf("{#", searchPos);
      if (braceHash === -1) break;
      // Look ahead in the raw XML (up to 500 chars) for "professionals" then "}"
      const nearby = docXml.substring(braceHash, braceHash + 500);
      const stripped = nearby.replace(/<[^>]+>/g, "");
      if (stripped.startsWith("{#professionals}")) {
        openBraceIdx = braceHash;
        break;
      }
      searchPos = braceHash + 2;
    }
  }
  if (openBraceIdx === -1) return;

  const pStart = Math.max(
    docXml.lastIndexOf("<w:p ", openBraceIdx),
    docXml.lastIndexOf("<w:p>", openBraceIdx)
  );
  if (pStart === -1) return;

  // Find closing tag — may also be split across runs
  let closeIdx = -1;
  {
    let searchPos = openBraceIdx + 2;
    while (searchPos < docXml.length) {
      const braceSlash = docXml.indexOf("{/", searchPos);
      if (braceSlash === -1) break;
      const nearby = docXml.substring(braceSlash, braceSlash + 500);
      const stripped = nearby.replace(/<[^>]+>/g, "");
      if (stripped.startsWith("{/professionals}")) {
        // Find the actual closing "}" in the XML
        const profWord = docXml.indexOf("professionals", braceSlash);
        closeIdx = docXml.indexOf("}", profWord);
        break;
      }
      searchPos = braceSlash + 2;
    }
  }
  if (closeIdx === -1) return;

  const pEnd = docXml.indexOf("</w:p>", closeIdx);
  if (pEnd === -1) return;
  const endIdx = pEnd + "</w:p>".length;

  const replacement = `<w:p><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t>{@professionalsContent}</w:t></w:r></w:p>`;
  const newXml = docXml.substring(0, pStart) + replacement + docXml.substring(endIdx);
  zip.file("word/document.xml", newXml);
}

function buildCronogramaOoxml(activities: ActivityFormData[], overrides: import("@/types/plan").CronogramaCell[]): string {
  if (activities.length === 0) {
    return `<w:p><w:r><w:rPr>${DEFAULT_FONT}<w:i/></w:rPr><w:t>Nenhuma atividade cadastrada.</w:t></w:r></w:p>`;
  }

  function isMonthActive(actIdx: number, subIdx: number, month: number): boolean {
    const override = overrides.find(
      (c) => c.activityIndex === actIdx && c.subActivityIndex === subIdx && c.month === month
    );
    return override?.active ?? false;
  }

  const borderXml = '<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders>';
  const headerShading = '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>';
  const activityShading = '<w:shd w:val="clear" w:color="auto" w:fill="E8E8E8"/>';
  const activeShading = '<w:shd w:val="clear" w:color="auto" w:fill="B4C6E7"/>';

  const months = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

  // Header row
  const headerCells = [
    `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/>${borderXml}${headerShading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>Atividade</w:t></w:r></w:p></w:tc>`,
    ...months.map(
      (m) =>
        `<w:tc><w:tcPr>${borderXml}${headerShading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${m}</w:t></w:r></w:p></w:tc>`
    ),
  ].join("");

  const headerRow = `<w:tr>${headerCells}</w:tr>`;

  // Data rows — activity header + subactivity rows
  const dataRows: string[] = [];
  for (let actIdx = 0; actIdx < activities.length; actIdx++) {
    const act = activities[actIdx];

    // Activity header row (bold, shaded, no checkboxes)
    const actNameCell = `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/>${borderXml}${activityShading}</w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">${actIdx + 1}. ${escapeXml(act.name)}</w:t></w:r></w:p></w:tc>`;
    const emptyMonthCells = Array.from({ length: 12 }, () =>
      `<w:tc><w:tcPr>${borderXml}${activityShading}</w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t> </w:t></w:r></w:p></w:tc>`
    ).join("");
    dataRows.push(`<w:tr>${actNameCell}${emptyMonthCells}</w:tr>`);

    // Subactivity rows
    const cronSubs = act.subActivities || [];
    for (let subIdx = 0; subIdx < cronSubs.length; subIdx++) {
      const cronSub = cronSubs[subIdx];
      const subText = (typeof cronSub === "object" ? cronSub.name : cronSub) || `Subatividade ${actIdx + 1}.${subIdx + 1}`;
      const subNameCell = `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/>${borderXml}</w:tcPr><w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">${actIdx + 1}.${subIdx + 1} ${escapeXml(subText)}</w:t></w:r></w:p></w:tc>`;

      const monthCells = Array.from({ length: 12 }, (_, m) => {
        const active = isMonthActive(actIdx, subIdx, m + 1);
        const shading = active ? activeShading : "";
        return `<w:tc><w:tcPr>${borderXml}${shading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t> </w:t></w:r></w:p></w:tc>`;
      }).join("");

      dataRows.push(`<w:tr>${subNameCell}${monthCells}</w:tr>`);
    }
  }

  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>${headerRow}${dataRows.join("")}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Financial table helpers
// ---------------------------------------------------------------------------

const FIN_BORDER = '<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders>';
const FIN_HEADER_SHADING = '<w:shd w:val="clear" w:color="auto" w:fill="808080"/>';
const FIN_TOTAL_SHADING = '<w:shd w:val="clear" w:color="auto" w:fill="D9D9D9"/>';
const FIN_SUBTOTAL_SHADING = '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>';
const FIN_FONT_SM = '<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="18"/><w:szCs w:val="18"/>';
const FIN_FONT_SM_BOLD = `${FIN_FONT_SM}<w:b/>`;
const FIN_FONT_SM_BOLD_WHITE = `${FIN_FONT_SM}<w:b/><w:color w:val="FFFFFF"/>`;
// Extra-small font for wide tables (cronograma) – 7pt
const FIN_FONT_XS = '<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="14"/><w:szCs w:val="14"/>';
const FIN_FONT_XS_BOLD = `${FIN_FONT_XS}<w:b/>`;
const FIN_FONT_XS_BOLD_WHITE = `${FIN_FONT_XS}<w:b/><w:color w:val="FFFFFF"/>`;

const NAO_SE_APLICA = `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr><w:r><w:rPr>${DEFAULT_FONT}<w:i/></w:rPr><w:t>N\u00E3o se aplica.</w:t></w:r></w:p>`;

const TBL_PROPS = '<w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>';

function fmtBrl(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number): string {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function finCell(text: string, shading = "", align = "left", bold = false): string {
  const isHeader = shading === FIN_HEADER_SHADING;
  const font = isHeader ? FIN_FONT_SM_BOLD_WHITE : (bold ? FIN_FONT_SM_BOLD : FIN_FONT_SM);
  return `<w:tc><w:tcPr>${FIN_BORDER}${shading}</w:tcPr><w:p><w:pPr><w:jc w:val="${align}"/></w:pPr><w:r><w:rPr>${font}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
}

/** Extra-small cell for wide tables (cronograma) – smaller font + tight margins */
function finCellXs(text: string, shading = "", align = "left", bold = false): string {
  const isHeader = shading === FIN_HEADER_SHADING;
  const font = isHeader ? FIN_FONT_XS_BOLD_WHITE : (bold ? FIN_FONT_XS_BOLD : FIN_FONT_XS);
  const tcMargin = '<w:tcMar><w:left w:w="28" w:type="dxa"/><w:right w:w="28" w:type="dxa"/></w:tcMar>';
  return `<w:tc><w:tcPr>${FIN_BORDER}${shading}${tcMargin}</w:tcPr><w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="0" w:line="220" w:lineRule="exact"/></w:pPr><w:r><w:rPr>${font}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
}

function finRow(cells: string): string {
  return `<w:tr>${cells}</w:tr>`;
}

function calcProjectMonths(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(months, 0);
}

function sumEquipItems(items: EquipamentoItem[]): number {
  return items.reduce((s, i) => s + (i.quantidade || 0) * (i.custoUnitario || 0), 0);
}

function sumRhItems(items: RhFinanceiroItem[], projectMonths: number): number {
  return items.reduce((s, i) => s + ((i.salarioBase || 0) + (i.encargosMes || 0)) * projectMonths, 0);
}

function sumOutrosItems(items: OutrosSubItem[]): number {
  return items.reduce((s, i) => s + (i.quantidade || 0) * (i.custoUnitario || 0), 0);
}

// ---------------------------------------------------------------------------
// Budget summary table (Orcamento Resumo)
// ---------------------------------------------------------------------------

function buildOrcamentoResumoOoxml(fin: FinanceiroData, projectMonths: number): string {
  const equipTotal = sumEquipItems(fin.equipamentos);
  const labTotal = sumEquipItems(fin.laboratorios);
  const rhDiretoTotal = sumRhItems(fin.rhDireto, projectMonths);
  const rhIndiretoTotal = sumRhItems(fin.rhIndireto, projectMonths);
  const stTotal = sumEquipItems(fin.servicosTerceiros);
  const mcTotal = sumEquipItems(fin.materialConsumo);
  const livrosTotal = sumOutrosItems(fin.outros.livros);
  const treinTotal = sumOutrosItems(fin.outros.treinamentos);
  const viagensTotal = sumOutrosItems(fin.outros.viagens);
  const outrosTotal = sumOutrosItems(fin.outros.outrosDispendios);

  const subtotalDireto = equipTotal + labTotal + rhDiretoTotal + rhIndiretoTotal + stTotal + mcTotal + livrosTotal + treinTotal + viagensTotal + outrosTotal;

  const issP = (fin.config.issPercent || 0) / 100;
  const doaP = (fin.config.doaPercent || 0) / 100;
  const reservaP = (fin.config.reservaPercent || 0) / 100;
  const divisor = 1 - issP - doaP - reservaP;
  const total = divisor > 0 ? subtotalDireto / divisor : subtotalDireto;
  const issVal = total * issP;
  const doaVal = total * doaP;
  const reservaVal = total * reservaP;

  const pctOf = (v: number) => total > 0 ? fmtPct((v / total) * 100) : "0,00%";

  // Header row
  const headerRow = finRow(
    finCell("DESPESAS DO PROJETO", FIN_HEADER_SHADING, "left", true) +
    finCell("VALOR (R$)", FIN_HEADER_SHADING, "right", true) +
    finCell("%", FIN_HEADER_SHADING, "center", true)
  );

  const rows: string[] = [headerRow];
  const addRow = (label: string, value: number, shading = "") => {
    rows.push(finRow(
      finCell(label, shading) +
      finCell(fmtBrl(value), shading, "right") +
      finCell(pctOf(value), shading, "center")
    ));
  };
  const addBoldRow = (label: string, value: number, shading: string) => {
    rows.push(finRow(
      finCell(label, shading, "left", true) +
      finCell(fmtBrl(value), shading, "right", true) +
      finCell(pctOf(value), shading, "center", true)
    ));
  };

  addRow("I - programas de computador, maquinas, equipamentos, aparelhos e instrumentos, seus acessorios, sobressalentes e ferramentas, e servicos de instalacao dessas maquinas e equipamentos utilizados na execucao do projeto;", equipTotal);
  addRow("II - aquisicao, implantacao, ampliacao ou modernizacao de infraestrutura fisica e de laboratorios de pesquisa, desenvolvimento e inovacao e de ICTs;", labTotal);
  addRow("III - RH diretos envolvidos na execucao do projeto", rhDiretoTotal);
  addRow("III - RH indiretos envolvidos na execucao do projeto", rhIndiretoTotal);
  addRow("IV - Servicos Tecnicos de Terceiros;", stTotal);
  addRow("V - Mat. Consumo", mcTotal);
  addBoldRow("Total Dispendios (I a V)", equipTotal + labTotal + rhDiretoTotal + rhIndiretoTotal + stTotal + mcTotal, FIN_SUBTOTAL_SHADING);

  const viSubtotal = livrosTotal + treinTotal + viagensTotal + issVal + outrosTotal;
  addRow("VI - Outros dispendios correlatos as atividades de pesquisa, desenvolvimento e inovacao.", viSubtotal);
  addRow("Livros e Periodicos", livrosTotal);
  addRow("Treinamentos", treinTotal);
  addRow("Viagens", viagensTotal);
  addRow("ISS", issVal);
  addRow("Outros(Aluguel, Internet, Telefonia, Impostos Etc.)", outrosTotal);
  addBoldRow("Total Dispendios (I a VI)", subtotalDireto + issVal, FIN_SUBTOTAL_SHADING);

  addRow("DOA (Despesas operacionais e Administrativas)", doaVal);
  addRow("Constituicao de Reserva", reservaVal);
  addBoldRow("Total", total, FIN_TOTAL_SHADING);

  return `<w:tbl>${TBL_PROPS}${rows.join("")}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Equipment-type table (Equipamentos, Laboratorios, Servicos, Material)
// ---------------------------------------------------------------------------

function buildEquipTableOoxml(items: EquipamentoItem[]): string {
  const filtered = items.filter(i => i.nome || i.quantidade > 0 || i.custoUnitario > 0);
  if (filtered.length === 0) return NAO_SE_APLICA;

  const headerRow = finRow(
    finCell("Nome", FIN_HEADER_SHADING, "left", true) +
    finCell("Atividade", FIN_HEADER_SHADING, "left", true) +
    finCell("Tipo", FIN_HEADER_SHADING, "center", true) +
    finCell("Qtd", FIN_HEADER_SHADING, "center", true) +
    finCell("Custo Unit.", FIN_HEADER_SHADING, "right", true) +
    finCell("Total", FIN_HEADER_SHADING, "right", true)
  );

  let grandTotal = 0;
  const dataRows = filtered.map(item => {
    const total = (item.quantidade || 0) * (item.custoUnitario || 0);
    grandTotal += total;
    return finRow(
      finCell(item.nome || "") +
      finCell(item.atividade || "") +
      finCell(item.tipo || "", "", "center") +
      finCell(String(item.quantidade || 0), "", "center") +
      finCell(fmtBrl(item.custoUnitario || 0), "", "right") +
      finCell(fmtBrl(total), "", "right")
    );
  });

  const totalRow = finRow(
    finCell("Total", FIN_TOTAL_SHADING, "left", true) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell(fmtBrl(grandTotal), FIN_TOTAL_SHADING, "right", true)
  );

  return `<w:tbl>${TBL_PROPS}${headerRow}${dataRows.join("")}${totalRow}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// RH table (RH Direto, RH Indireto)
// ---------------------------------------------------------------------------

function buildRhTableOoxml(items: RhFinanceiroItem[], projectMonths: number): string {
  const filtered = items.filter(i => i.nome || i.salarioBase > 0);
  if (filtered.length === 0) return NAO_SE_APLICA;

  const headerRow = finRow(
    finCell("Funcao", FIN_HEADER_SHADING, "left", true) +
    finCell("Salario Base", FIN_HEADER_SHADING, "right", true) +
    finCell("Encargos/Mes", FIN_HEADER_SHADING, "right", true) +
    finCell("Total/Mes", FIN_HEADER_SHADING, "right", true) +
    finCell("Custo/Hora", FIN_HEADER_SHADING, "right", true) +
    finCell("Total Horas", FIN_HEADER_SHADING, "right", true) +
    finCell("Custo Total", FIN_HEADER_SHADING, "right", true)
  );

  let grandTotal = 0;
  const dataRows = filtered.map(item => {
    const totalMes = (item.salarioBase || 0) + (item.encargosMes || 0);
    const custoTotal = totalMes * projectMonths;
    grandTotal += custoTotal;
    return finRow(
      finCell(item.profissionalNome || "") +
      finCell(fmtBrl(item.salarioBase || 0), "", "right") +
      finCell(fmtBrl(item.encargosMes || 0), "", "right") +
      finCell(fmtBrl(totalMes), "", "right") +
      finCell(fmtBrl(item.custoHora || 0), "", "right") +
      finCell((item.totalHsProjeto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), "", "right") +
      finCell(fmtBrl(custoTotal), "", "right")
    );
  });

  const totalRow = finRow(
    finCell("Total", FIN_TOTAL_SHADING, "left", true) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell(fmtBrl(grandTotal), FIN_TOTAL_SHADING, "right", true)
  );

  return `<w:tbl>${TBL_PROPS}${headerRow}${dataRows.join("")}${totalRow}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Outros table (Livros, Treinamentos, Viagens, Outros Dispendios)
// ---------------------------------------------------------------------------

function buildOutrosTableOoxml(items: OutrosSubItem[]): string {
  const filtered = items.filter(i => i.descricao || i.quantidade > 0 || i.custoUnitario > 0);
  if (filtered.length === 0) return NAO_SE_APLICA;

  const headerRow = finRow(
    finCell("Descricao", FIN_HEADER_SHADING, "left", true) +
    finCell("Tipo", FIN_HEADER_SHADING, "center", true) +
    finCell("Qtd", FIN_HEADER_SHADING, "center", true) +
    finCell("Custo Unit.", FIN_HEADER_SHADING, "right", true) +
    finCell("Total", FIN_HEADER_SHADING, "right", true)
  );

  let grandTotal = 0;
  const dataRows = filtered.map(item => {
    const total = (item.quantidade || 0) * (item.custoUnitario || 0);
    grandTotal += total;
    return finRow(
      finCell(item.descricao || "") +
      finCell(item.tipo || "", "", "center") +
      finCell(String(item.quantidade || 0), "", "center") +
      finCell(fmtBrl(item.custoUnitario || 0), "", "right") +
      finCell(fmtBrl(total), "", "right")
    );
  });

  const totalRow = finRow(
    finCell("Total", FIN_TOTAL_SHADING, "left", true) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell(fmtBrl(grandTotal), FIN_TOTAL_SHADING, "right", true)
  );

  return `<w:tbl>${TBL_PROPS}${headerRow}${dataRows.join("")}${totalRow}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Cronograma Financeiro (monthly distribution table)
// ---------------------------------------------------------------------------

function buildCronogramaFinanceiroOoxml(fin: FinanceiroData, projectMonths: number): string {
  if (projectMonths <= 0) return NAO_SE_APLICA;
  const config = fin.config;
  const cronograma = fin.cronogramaFinanceiro || [];
  const issP = (config.issPercent || 0) / 100;
  const doaP = (config.doaPercent || 0) / 100;
  const reservaP = (config.reservaPercent || 0) / 100;

  const getMes = (m: number): CronogramaFinanceiroMes => {
    return cronograma.find(c => c.mes === m) || {
      mes: m, equipamentos: 0, laboratorios: 0, rhDireto: 0, rhIndireto: 0,
      servicosTerceiros: 0, materialConsumo: 0, livros: 0, treinamentos: 0,
      viagens: 0, outrosDispendios: 0
    };
  };

  // Category labels
  const categories = [
    { key: "equipamentos", label: "I - Equipamentos" },
    { key: "laboratorios", label: "II - Laboratorios" },
    { key: "rhDireto", label: "III - RH Diretos" },
    { key: "rhIndireto", label: "III - RH Indiretos" },
    { key: "servicosTerceiros", label: "IV - Servicos de Terceiros" },
    { key: "materialConsumo", label: "V - Mat. Consumo" },
  ];
  const catVI = [
    { key: "livros", label: "Livros e Periodicos" },
    { key: "treinamentos", label: "Treinamentos" },
    { key: "viagens", label: "Viagens" },
    { key: "outrosDispendios", label: "Outros" },
  ];

  // Header: Category | Valor | % | Mes-1..Mes-N | Total Distrib.
  // Use finCellXs (extra-small) for the cronograma so it fits in landscape
  const c = finCellXs; // alias for brevity
  const monthHeaders = Array.from({ length: projectMonths }, (_, i) => c(`Mes-${i + 1}`, FIN_HEADER_SHADING, "center", true));

  const headerRow = finRow(
    c("DESPESAS DO PROJETO", FIN_HEADER_SHADING, "left", true) +
    c("VALOR (R$)", FIN_HEADER_SHADING, "right", true) +
    c("%", FIN_HEADER_SHADING, "center", true) +
    monthHeaders.join("") +
    c("Total Distrib.", FIN_HEADER_SHADING, "right", true)
  );

  // Calculate category totals
  const equipTotal = sumEquipItems(fin.equipamentos);
  const labTotal = sumEquipItems(fin.laboratorios);
  const rhDiretoTotal = sumRhItems(fin.rhDireto, projectMonths);
  const rhIndiretoTotal = sumRhItems(fin.rhIndireto, projectMonths);
  const stTotal = sumEquipItems(fin.servicosTerceiros);
  const mcTotal = sumEquipItems(fin.materialConsumo);
  const livrosTotal = sumOutrosItems(fin.outros.livros);
  const treinTotal = sumOutrosItems(fin.outros.treinamentos);
  const viagensTotal = sumOutrosItems(fin.outros.viagens);
  const outrosTotal = sumOutrosItems(fin.outros.outrosDispendios);

  const subtotalIV = equipTotal + labTotal + rhDiretoTotal + rhIndiretoTotal + stTotal + mcTotal;
  const divisor = 1 - issP - doaP - reservaP;
  const grandTotal = divisor > 0 ? (subtotalIV + livrosTotal + treinTotal + viagensTotal + outrosTotal) / divisor : 0;
  const issVal = grandTotal * issP;
  const doaVal = grandTotal * doaP;
  const reservaVal = grandTotal * reservaP;
  const pctOf = (v: number) => grandTotal > 0 ? fmtPct((v / grandTotal) * 100) : "0,00%";

  const catTotals: Record<string, number> = {
    equipamentos: equipTotal, laboratorios: labTotal,
    rhDireto: rhDiretoTotal, rhIndireto: rhIndiretoTotal,
    servicosTerceiros: stTotal, materialConsumo: mcTotal,
    livros: livrosTotal, treinamentos: treinTotal,
    viagens: viagensTotal, outrosDispendios: outrosTotal,
  };

  // Build category row
  const buildCatRow = (label: string, key: string, value: number) => {
    let distribTotal = 0;
    const monthCells = Array.from({ length: projectMonths }, (_, i) => {
      const mesData = getMes(i + 1);
      const v = (mesData as unknown as Record<string, number>)[key] || 0;
      distribTotal += v;
      return c(v > 0 ? fmtBrl(v) : "", "", "right");
    });
    return finRow(
      c(label) +
      c(fmtBrl(value), "", "right") +
      c(pctOf(value), "", "center") +
      monthCells.join("") +
      c(fmtBrl(distribTotal), "", "right")
    );
  };

  const rows: string[] = [headerRow];

  // Categories I-V
  for (const cat of categories) {
    rows.push(buildCatRow(cat.label, cat.key, catTotals[cat.key]));
  }

  // Total I-V subtotal row
  const subtotalIVRow = (() => {
    let distribTotal = 0;
    const monthCells = Array.from({ length: projectMonths }, (_, i) => {
      const m = getMes(i + 1);
      const v = (m.equipamentos || 0) + (m.laboratorios || 0) + (m.rhDireto || 0) + (m.rhIndireto || 0) + (m.servicosTerceiros || 0) + (m.materialConsumo || 0);
      distribTotal += v;
      return c(v > 0 ? fmtBrl(v) : "", FIN_SUBTOTAL_SHADING, "right", true);
    });
    return finRow(
      c("Total Dispendios (I a V)", FIN_SUBTOTAL_SHADING, "left", true) +
      c(fmtBrl(subtotalIV), FIN_SUBTOTAL_SHADING, "right", true) +
      c(pctOf(subtotalIV), FIN_SUBTOTAL_SHADING, "center", true) +
      monthCells.join("") +
      c(fmtBrl(distribTotal), FIN_SUBTOTAL_SHADING, "right", true)
    );
  })();
  rows.push(subtotalIVRow);

  // VI categories
  const viTotal = livrosTotal + treinTotal + viagensTotal + issVal + outrosTotal;
  rows.push(finRow(
    c("VI - Outros dispendios", "", "left") +
    c(fmtBrl(viTotal), "", "right") +
    c(pctOf(viTotal), "", "center") +
    Array.from({ length: projectMonths }, () => c("", "")).join("") +
    c("", "")
  ));

  for (const cat of catVI) {
    rows.push(buildCatRow(cat.label, cat.key, catTotals[cat.key]));
  }
  // ISS row
  rows.push(finRow(
    c("ISS") +
    c(fmtBrl(issVal), "", "right") +
    c(fmtPct(fin.config.issPercent || 0), "", "center") +
    Array.from({ length: projectMonths }, () => c("", "")).join("") +
    c("", "")
  ));

  // Total I-VI
  const totalIVI = subtotalIV + viTotal;
  rows.push(finRow(
    c("Total Dispendios (I a VI)", FIN_SUBTOTAL_SHADING, "left", true) +
    c(fmtBrl(totalIVI), FIN_SUBTOTAL_SHADING, "right", true) +
    c(pctOf(totalIVI), FIN_SUBTOTAL_SHADING, "center", true) +
    Array.from({ length: projectMonths }, () => c("", FIN_SUBTOTAL_SHADING)).join("") +
    c("", FIN_SUBTOTAL_SHADING)
  ));

  // DOA
  rows.push(finRow(
    c("DOA (Despesas operacionais e Administrativas)") +
    c(fmtBrl(doaVal), "", "right") +
    c(fmtPct(fin.config.doaPercent || 0), "", "center") +
    Array.from({ length: projectMonths }, () => c("", "")).join("") +
    c("", "")
  ));

  // Reserva
  rows.push(finRow(
    c("Constituicao de Reserva") +
    c(fmtBrl(reservaVal), "", "right") +
    c(fmtPct(fin.config.reservaPercent || 0), "", "center") +
    Array.from({ length: projectMonths }, () => c("", "")).join("") +
    c("", "")
  ));

  // Total
  rows.push(finRow(
    c("Total", FIN_TOTAL_SHADING, "left", true) +
    c(fmtBrl(grandTotal), FIN_TOTAL_SHADING, "right", true) +
    c("100%", FIN_TOTAL_SHADING, "center", true) +
    Array.from({ length: projectMonths }, () => c("", FIN_TOTAL_SHADING)).join("") +
    c("", FIN_TOTAL_SHADING)
  ));

  // Title paragraph on the landscape page using Ttulo1 style (same as template headings).
  // replaceFinanceiroTagsInTemplate removes the original title from the template
  // and injects section breaks around the tag.
  const cronTitle: string = [
    `<w:p><w:pPr>`,
    `<w:pStyle w:val="Ttulo1"/>`,
    `<w:spacing w:before="0" w:line="360" w:lineRule="auto"/>`,
    `<w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
    `</w:pPr>`,
    `<w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
    `<w:t>CRONOGRAMA DE EXECU\u00C7\u00C3O</w:t>`,
    `</w:r></w:p>`,
  ].join("");

  return `${cronTitle}<w:tbl>${TBL_PROPS}${rows.join("")}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Desembolso Fisico Financeiro (payment schedule)
// ---------------------------------------------------------------------------

function buildDesembolsoOoxml(fin: FinanceiroData, projectMonths: number, executionStartDate: string): string {
  if (projectMonths <= 0) return NAO_SE_APLICA;
  const config = fin.config;
  const issP = (config.issPercent || 0) / 100;
  const doaP = (config.doaPercent || 0) / 100;
  const reservaP = (config.reservaPercent || 0) / 100;

  const cronograma = fin.cronogramaFinanceiro || [];

  const startDate = executionStartDate ? new Date(executionStartDate) : new Date();
  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  // Header
  const headerRow = finRow(
    finCell("Referencia", FIN_HEADER_SHADING, "center", true) +
    finCell("Mes", FIN_HEADER_SHADING, "center", true) +
    finCell("Valor Bruto da Nota", FIN_HEADER_SHADING, "right", true) +
    finCell(`Valor do Imposto ${fmtPct(fin.config.issPercent || 0)}`, FIN_HEADER_SHADING, "right", true) +
    finCell("Valor Liquido da Nota", FIN_HEADER_SHADING, "right", true) +
    finCell(`Valor DOA ${fmtPct(fin.config.doaPercent || 0)}`, FIN_HEADER_SHADING, "right", true) +
    finCell(`Valor FCR ${fmtPct(fin.config.reservaPercent || 0)}`, FIN_HEADER_SHADING, "right", true) +
    finCell("Valor Liquido A Executar no Projeto", FIN_HEADER_SHADING, "right", true)
  );

  let totalBruto = 0, totalIss = 0, totalLiquido = 0, totalDoa = 0, totalFcr = 0, totalExecutar = 0;
  const dataRows: string[] = [];

  for (let i = 0; i < projectMonths; i++) {
    const mesData = cronograma.find(c => c.mes === i + 1);
    const mesDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const mesLabel = `${monthNames[mesDate.getMonth()]}${String(mesDate.getFullYear()).slice(2)}`;

    // Sum all categories for this month
    let monthSum = 0;
    if (mesData) {
      monthSum = (mesData.equipamentos || 0) + (mesData.laboratorios || 0) +
        (mesData.rhDireto || 0) + (mesData.rhIndireto || 0) +
        (mesData.servicosTerceiros || 0) + (mesData.materialConsumo || 0) +
        (mesData.livros || 0) + (mesData.treinamentos || 0) +
        (mesData.viagens || 0) + (mesData.outrosDispendios || 0);
    }

    // Calculate values like the Excel sheet
    const divisorM = 1 - issP - doaP - reservaP;
    const bruto = divisorM > 0 ? monthSum / divisorM : monthSum;
    const iss = bruto * issP;
    const liquido = bruto - iss;
    const doa = bruto * doaP;
    const fcr = bruto * reservaP;
    const executar = liquido - doa - fcr;

    totalBruto += bruto;
    totalIss += iss;
    totalLiquido += liquido;
    totalDoa += doa;
    totalFcr += fcr;
    totalExecutar += executar;

    dataRows.push(finRow(
      finCell(`Parcela ${i + 1}`, "", "center") +
      finCell(mesLabel, "", "center") +
      finCell(fmtBrl(bruto), "", "right") +
      finCell(fmtBrl(iss), "", "right") +
      finCell(fmtBrl(liquido), "", "right") +
      finCell(fmtBrl(doa), "", "right") +
      finCell(fmtBrl(fcr), "", "right") +
      finCell(fmtBrl(executar), "", "right")
    ));
  }

  // Total row
  const totalRowStr = finRow(
    finCell("TOTAL", FIN_TOTAL_SHADING, "center", true) +
    finCell("", FIN_TOTAL_SHADING) +
    finCell(fmtBrl(totalBruto), FIN_TOTAL_SHADING, "right", true) +
    finCell(fmtBrl(totalIss), FIN_TOTAL_SHADING, "right", true) +
    finCell(fmtBrl(totalLiquido), FIN_TOTAL_SHADING, "right", true) +
    finCell(fmtBrl(totalDoa), FIN_TOTAL_SHADING, "right", true) +
    finCell(fmtBrl(totalFcr), FIN_TOTAL_SHADING, "right", true) +
    finCell(fmtBrl(totalExecutar), FIN_TOTAL_SHADING, "right", true)
  );

  // Title
  const title = `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="100"/></w:pPr><w:r><w:rPr>${FIN_FONT_SM_BOLD}</w:rPr><w:t>DESEMBOLSO FISICO FINANCEIRO</w:t></w:r></w:p>`;

  return `${title}<w:tbl>${TBL_PROPS}${headerRow}${dataRows.join("")}${totalRowStr}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Pre-process: replace {TABELA_*} tags with raw OOXML placeholders
// ---------------------------------------------------------------------------

const FINANCEIRO_TAGS = [
  "TABELA_ORCAMENTO_RESUMO", "TABELA_EQUIPAMENTOS", "TABELA_LABORATORIOS",
  "TABELA_RH_DIRETO", "TABELA_RH_INDIRETO", "TABELA_SERVICOS_TERCEIROS",
  "TABELA_MATERIAL_CONSUMO", "TABELA_LIVROS", "TABELA_TREINAMENTOS",
  "TABELA_VIAGENS", "TABELA_OUTROS", "TABELA_CRONOGRAMA", "TABELA_DESEMBOLSO",
];

function replaceFinanceiroTagsInTemplate(zip: PizZip): void {
  let docXml = zip.file("word/document.xml")?.asText();
  if (!docXml) return;

  for (const tag of FINANCEIRO_TAGS) {
    // The tag may be split across multiple runs by Word
    const textOnly = docXml.replace(/<[^>]+>/g, "");
    if (!textOnly.includes(`{${tag}}`)) continue;

    // Find the opening brace for this tag
    let searchPos = 0;
    while (searchPos < docXml.length) {
      const braceIdx = docXml.indexOf("{", searchPos);
      if (braceIdx === -1) break;

      // Check if this brace starts our tag (strip XML between brace and tag name)
      const nearby = docXml.substring(braceIdx, braceIdx + 1000);
      const stripped = nearby.replace(/<[^>]+>/g, "");
      if (stripped.startsWith(`{${tag}}`)) {
        // Find the closing brace in the raw XML
        let closeIdx = braceIdx;
        let strippedCount = 0;
        const target = `{${tag}}`;
        for (let ci = braceIdx; ci < docXml.length && strippedCount < target.length; ci++) {
          if (docXml[ci] === "<") {
            // Skip XML tag
            const endTag = docXml.indexOf(">", ci);
            if (endTag !== -1) ci = endTag;
            continue;
          }
          strippedCount++;
          closeIdx = ci;
        }

        // Find the paragraph containing this tag
        const pStart = Math.max(
          docXml.lastIndexOf("<w:p ", braceIdx),
          docXml.lastIndexOf("<w:p>", braceIdx)
        );
        const pEnd: number = docXml.indexOf("</w:p>", closeIdx);
        if (pStart !== -1 && pEnd !== -1) {
          const endIdx: number = pEnd + "</w:p>".length;
          const replacement: string = `<w:p><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t>{@${tag}}</w:t></w:r></w:p>`;
          docXml = docXml.substring(0, pStart) + replacement + docXml.substring(endIdx);
        }
        break;
      }
      searchPos = braceIdx + 1;
    }
  }

  // --- Landscape section for the cronograma ---
  // Strategy:
  // 1. Remove the title paragraph ("CRONOGRAMA DE EXECU...") from before the tag
  //    (we re-inject it inside the landscape output in buildCronogramaFinanceiroOoxml)
  // 2. Insert a portrait section-break paragraph BEFORE the tag paragraph
  //    → ends the previous portrait section; tag content starts a new landscape page
  // 3. Insert a landscape sectPr into the first paragraph AFTER the tag
  //    → ends the landscape section; content after returns to portrait

  const portraitBreak: string = [
    `<w:p><w:pPr><w:sectPr>`,
    `<w:headerReference w:type="default" r:id="rId11"/>`,
    `<w:footerReference w:type="default" r:id="rId12"/>`,
    `<w:pgSz w:w="11906" w:h="16838"/>`,
    `<w:pgMar w:top="1843" w:right="1440" w:bottom="1440" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>`,
    `</w:sectPr></w:pPr></w:p>`,
  ].join("");

  const landscapeSectPr: string = [
    `<w:sectPr>`,
    `<w:headerReference w:type="default" r:id="rId11"/>`,
    `<w:footerReference w:type="default" r:id="rId12"/>`,
    `<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>`,
    `<w:pgMar w:top="567" w:right="567" w:bottom="567" w:left="567" w:header="284" w:footer="284" w:gutter="0"/>`,
    `</w:sectPr>`,
  ].join("");

  const cronTagPos = docXml.indexOf("{@TABELA_CRONOGRAMA}");
  if (cronTagPos !== -1) {
    // Step 1: Remove the title paragraph before the tag
    const cronPStart = Math.max(
      docXml.lastIndexOf("<w:p ", cronTagPos),
      docXml.lastIndexOf("<w:p>", cronTagPos)
    );
    if (cronPStart > 0) {
      let searchFrom = cronPStart;
      for (let attempt = 0; attempt < 3; attempt++) {
        const prevPEnd = docXml.lastIndexOf("</w:p>", searchFrom - 1);
        if (prevPEnd === -1) break;
        const prevPEndFull = prevPEnd + "</w:p>".length;
        const prevPS = Math.max(
          docXml.lastIndexOf("<w:p ", prevPEnd),
          docXml.lastIndexOf("<w:p>", prevPEnd)
        );
        if (prevPS === -1) break;
        const content = docXml.substring(prevPS, prevPEndFull).replace(/<[^>]+>/g, "");
        if (content.includes("CRONOGRAMA DE EXECU")) {
          docXml = docXml.substring(0, prevPS) + docXml.substring(prevPEndFull);
          break;
        }
        searchFrom = prevPS;
      }
    }

    // Step 2: Insert portrait break BEFORE the tag paragraph
    const cronTagPos2 = docXml.indexOf("{@TABELA_CRONOGRAMA}");
    if (cronTagPos2 !== -1) {
      const cronPStart2 = Math.max(
        docXml.lastIndexOf("<w:p ", cronTagPos2),
        docXml.lastIndexOf("<w:p>", cronTagPos2)
      );
      if (cronPStart2 !== -1) {
        docXml = docXml.substring(0, cronPStart2) + portraitBreak + docXml.substring(cronPStart2);
      }
    }

    // Step 3: Inject landscape sectPr into the first paragraph AFTER the tag
    const cronTagPos3 = docXml.indexOf("{@TABELA_CRONOGRAMA}");
    if (cronTagPos3 !== -1) {
      const cronPEnd3 = docXml.indexOf("</w:p>", cronTagPos3);
      if (cronPEnd3 !== -1) {
        const afterCronP = cronPEnd3 + "</w:p>".length;
        const nextPPos = docXml.indexOf("<w:p", afterCronP);
        if (nextPPos !== -1) {
          const nextPClose = docXml.indexOf(">", nextPPos);
          const afterNextPOpen = nextPClose + 1;
          const hasPPr = docXml.substring(afterNextPOpen, afterNextPOpen + 20).trimStart().startsWith("<w:pPr");

          if (hasPPr) {
            const pPrClose = docXml.indexOf("</w:pPr>", afterNextPOpen);
            if (pPrClose !== -1) {
              docXml = docXml.substring(0, pPrClose) + landscapeSectPr + docXml.substring(pPrClose);
            }
          } else {
            docXml = docXml.substring(0, afterNextPOpen) + `<w:pPr>${landscapeSectPr}</w:pPr>` + docXml.substring(afterNextPOpen);
          }
        }
      }
    }
  }

  // Fix static text "R$ xxxxx (VALOR por EXTENSO)" in the desembolso section
  // Replace "xxxxx" with {totalValue} tag and "VALOR por EXTENSO" with {totalValueWritten} tag
  const replaceInWt = (xml: string, search: string, replace: string): string => {
    let result = xml;
    let pos = 0;
    while (pos < result.length) {
      const idx = result.indexOf(search, pos);
      if (idx === -1) break;
      const prevTag = result.lastIndexOf("<w:t", idx);
      const prevClose = result.lastIndexOf("</w:t>", idx);
      if (prevTag > prevClose) {
        result = result.substring(0, idx) + replace + result.substring(idx + search.length);
        pos = idx + replace.length;
      } else {
        pos = idx + search.length;
      }
    }
    return result;
  };

  docXml = replaceInWt(docXml, "xxxxx", "{totalValue}");
  docXml = replaceInWt(docXml, "VALOR por EXTENSO", "{totalValueWritten}");

  // Fix template bug: second "coordinatorInstitution" should be "Empresa"
  // The tag is split across runs: {  coordinatorInstitution  } — so search for raw text
  const ciText = "coordinatorInstitution";
  const firstCI = docXml.indexOf(ciText);
  if (firstCI !== -1) {
    const secondCI = docXml.indexOf(ciText, firstCI + ciText.length);
    if (secondCI !== -1) {
      // Replace the whole tag structure: find the "{" run before and "}" run after
      // Look backward for the "{" in a <w:t> tag
      const braceOpenSearch = docXml.lastIndexOf("{", secondCI);
      // Look forward for the "}" after the tag text
      const braceCloseSearch = docXml.indexOf("}", secondCI + ciText.length);
      if (braceOpenSearch !== -1 && braceCloseSearch !== -1) {
        // Replace from "{" through "}" with just "Empresa"
        docXml = docXml.substring(0, braceOpenSearch) + "Empresa" + docXml.substring(braceCloseSearch + 1);
      }
    }
  }

  // Consolidate split tags: Word often splits {tagName} across multiple <w:r> runs.
  // Direct replacement approach: map each character position in stripped text back
  // to the raw XML, then remove the tag characters one by one and insert the
  // consolidated tag at the first character position.
  const ALL_TEMPLATE_TAGS = [
    // Section 1: Identification
    "projectName", "projectNickname", "coordinatorInstitution", "coordinatorFoxconn",
    "totalValue", "totalValueWritten", "executionPeriod", "validityPeriod",
    "partnerName", "foundationName", "partnerLogo", "foundationLogo",
    // Section 2: Project Type checkboxes
    "sw_dev_check", "product_dev_check", "process_dev_check",
    "automation_check", "training_pt_check", "not_defined_pt_check",
    // Section 3: Activity Type checkboxes
    "basic_research_check", "applied_research_check", "experimental_dev_check",
    "tech_innovation_check", "training_at_check", "consulting_check",
    "not_defined_at_check",
    // TRL checkboxes
    ...Array.from({ length: 9 }, (_, i) => `trl${i + 1}_check`),
    // Indicator checkboxes and quantities
    ...INDICATORS.map(ind => `${ind.key}_check`),
    ...INDICATORS.map(ind => `${ind.key}_qty`),
  ];
  for (const stag of ALL_TEMPLATE_TAGS) {
    const fullTag = `{${stag}}`;
    // Count occurrences in stripped text vs raw XML to find split tags
    const stripped = docXml.replace(/<[^>]+>/g, "");
    const escapedTag = fullTag.replace(/[{}]/g, "\\$&");
    const strippedCount = (stripped.match(new RegExp(escapedTag, "g")) || []).length;
    if (strippedCount === 0) continue; // tag not in document
    const rawCount = (docXml.match(new RegExp(escapedTag, "g")) || []).length;
    if (strippedCount <= rawCount) continue; // all occurrences already consolidated

    // There are split occurrences. Find each one in the stripped text and consolidate.
    let searchFrom = 0;
    for (let occ = 0; occ < strippedCount; occ++) {
      // Re-strip after each modification
      const currentStripped = docXml.replace(/<[^>]+>/g, "");
      const tagPos = currentStripped.indexOf(fullTag, searchFrom);
      if (tagPos === -1) break;

      // Check if this occurrence is already consolidated in raw XML
      // by verifying the chars are contiguous (no XML tags between them)
      const charPositions: number[] = [];
      let sIdx = 0;
      let xIdx = 0;
      while (xIdx < docXml.length && charPositions.length < fullTag.length) {
        if (docXml[xIdx] === "<") {
          const close = docXml.indexOf(">", xIdx);
          xIdx = (close !== -1) ? close + 1 : xIdx + 1;
          continue;
        }
        if (sIdx >= tagPos && sIdx < tagPos + fullTag.length) {
          charPositions.push(xIdx);
        }
        if (sIdx >= tagPos + fullTag.length) break;
        sIdx++;
        xIdx++;
      }
      if (charPositions.length !== fullTag.length) { searchFrom = tagPos + fullTag.length; continue; }

      // Check if already contiguous (no gaps = already in single node)
      const isContiguous = charPositions.every((p, i) => i === 0 || p === charPositions[i - 1] + 1);
      if (isContiguous) { searchFrom = tagPos + fullTag.length; continue; }

      // Remove characters backwards to preserve earlier indices, then insert full tag
      for (let i = charPositions.length - 1; i >= 1; i--) {
        docXml = docXml.substring(0, charPositions[i]) + docXml.substring(charPositions[i] + 1);
      }
      docXml = docXml.substring(0, charPositions[0]) + fullTag + docXml.substring(charPositions[0] + 1);
      searchFrom = tagPos + fullTag.length;
    }
  }

  // Sanitize ALL curly braces in <w:t> nodes that are NOT part of our
  // known docxtemplater tags. The template may contain user-typed braces
  // (e.g. in TRL descriptions like "( } )") that confuse docxtemplater.
  // Replace every { and } in <w:t> with fullwidth braces, THEN restore
  // only the ones that are valid docxtemplater tags.
  docXml = docXml.replace(
    /(<w:t[^>]*>)([^<]*?)(<\/w:t>)/g,
    (_match, open: string, content: string, close: string) => {
      if (!content.includes("{") && !content.includes("}")) return `${open}${content}${close}`;
      const escaped = content
        .replace(/\{/g, "\uFF5B")
        .replace(/\}/g, "\uFF5D");
      return `${open}${escaped}${close}`;
    }
  );
  // Restore valid docxtemplater tags: {@tagName} and {tagName}
  // These were created by our own code above so they're in a single <w:t> node
  docXml = docXml.replace(/\uFF5B(@?[a-zA-Z_][a-zA-Z0-9_]*)\uFF5D/g, "{$1}");

  zip.file("word/document.xml", docXml);
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateDocx(plan: PlanFormData): Promise<Buffer> {
  // Reset image collector
  collectedImages = [];
  contentImgCounter = 0;

  // 1. Read template
  const templatePath = path.join(process.cwd(), "public", "template.docx");
  const templateContent = fs.readFileSync(templatePath, "binary");
  const originalZip = new PizZip(templateContent); // keep pristine copy
  const zip = new PizZip(templateContent);          // this one gets modified by docxtemplater

  // 1b. Pre-process: replace loops and financeiro tags with raw OOXML tags
  replaceActivitiesLoopInTemplate(zip);
  replaceProfessionalsLoopInTemplate(zip);
  replaceFinanceiroTagsInTemplate(zip);

  // 2. Create docxtemplater instance
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // 3. Pre-calculate financial totals
  const fin: FinanceiroData = (plan as unknown as Record<string, unknown>).financeiro as FinanceiroData || defaultFinanceiroData;
  const projMonths = calcProjectMonths(plan.executionStartDate, plan.executionEndDate);

  // Calculate total value from financeiro (same formula as FinResumoTab)
  const subtotalDireto = sumEquipItems(fin.equipamentos) + sumEquipItems(fin.laboratorios) +
    sumRhItems(fin.rhDireto, projMonths) + sumRhItems(fin.rhIndireto, projMonths) +
    sumEquipItems(fin.servicosTerceiros) + sumEquipItems(fin.materialConsumo) +
    sumOutrosItems(fin.outros.livros) + sumOutrosItems(fin.outros.treinamentos) +
    sumOutrosItems(fin.outros.viagens) + sumOutrosItems(fin.outros.outrosDispendios);
  const issP = (fin.config.issPercent || 0) / 100;
  const doaP = (fin.config.doaPercent || 0) / 100;
  const reservaP = (fin.config.reservaPercent || 0) / 100;
  const divisorGeral = 1 - issP - doaP - reservaP;
  const calculatedTotal = divisorGeral > 0 ? subtotalDireto / divisorGeral : subtotalDireto;

  // 3b. Build data object
  const data: Record<string, unknown> = {
    // Header
    partnerName: plan.partnerName || "Empresa Parceira",
    foundationName: plan.foundationName || "Fundação de Apoio",
    // Logo placeholders — replaced with actual images in post-processing
    partnerLogo: plan.partnerLogo ? "##PARTNER_LOGO##" : (plan.partnerName || ""),
    foundationLogo: plan.foundationLogo ? "##FOUNDATION_LOGO##" : (plan.foundationName || ""),

    // Section 1: Identification (simple fields)
    projectName: plan.projectName || " ",
    projectNickname: plan.projectNickname || " ",
    coordinatorInstitution: plan.coordinatorInstitution || " ",
    coordinatorFoxconn: plan.coordinatorFoxconn || " ",
    totalValue: calculatedTotal > 0 ? calculatedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014",
    totalValueWritten: calculatedTotal > 0 ? numberToWordsBRL(calculatedTotal) : " ",
    executionPeriod: `${formatDateBR(plan.executionStartDate)} a ${formatDateBR(plan.executionEndDate)}`,
    validityPeriod: `${formatDateBR(plan.validityStartDate)} a ${formatDateBR(plan.validityEndDate)}`,

    // Section 2: Project Type checkboxes
    sw_dev_check: plan.projectTypes.includes("SW_DEV") ? "X" : "  ",
    product_dev_check: plan.projectTypes.includes("PRODUCT_DEV") ? "X" : "  ",
    process_dev_check: plan.projectTypes.includes("PROCESS_DEV") ? "X" : "  ",
    automation_check: plan.projectTypes.includes("AUTOMATION") ? "X" : "  ",
    training_pt_check: plan.projectTypes.includes("TRAINING") ? "X" : "  ",
    not_defined_pt_check: plan.projectTypes.includes("NOT_DEFINED") ? "X" : "  ",

    // Section 3: Activity Type checkboxes
    basic_research_check: plan.activityTypes.includes("BASIC_RESEARCH") ? "X" : "  ",
    applied_research_check: plan.activityTypes.includes("APPLIED_RESEARCH") ? "X" : "  ",
    experimental_dev_check: plan.activityTypes.includes("EXPERIMENTAL_DEV") ? "X" : "  ",
    tech_innovation_check: plan.activityTypes.includes("TECH_INNOVATION") ? "X" : "  ",
    training_at_check: plan.activityTypes.includes("TRAINING") ? "X" : "  ",
    consulting_check: plan.activityTypes.includes("CONSULTING") ? "X" : "  ",
    not_defined_at_check: plan.activityTypes.includes("NOT_DEFINED") ? "X" : "  ",

    // Sections 4-7: Rich text (raw OOXML)
    motivacao: tiptapToOoxml(plan.motivacao as JSONContent | null),
    objetivosGerais: tiptapToOoxml(plan.objetivosGerais as JSONContent | null),
    objetivosEspecificos: tiptapToOoxml(plan.objetivosEspecificos as JSONContent | null),
    escopo: tiptapToOoxml(plan.escopo as JSONContent | null),
    estrategias: tiptapToOoxml(plan.estrategias as JSONContent | null),

    // Section 8: Activities (raw OOXML — full formatting control)
    activitiesContent: buildActivitiesOoxml(plan.activities),

    // Section 9: Professionals (raw OOXML — full formatting control)
    professionalsContent: buildProfessionalsOoxml(plan.professionals),

    // Section 10: Indicators
    ...Object.fromEntries(
      INDICATORS.flatMap((ind) => {
        const d = plan.indicators?.[ind.key];
        return [
          [`${ind.key}_check`, d?.enabled ? "X" : "  "],
          [`${ind.key}_qty`, d?.enabled ? String(d.quantity ?? 0) : ""],
        ];
      })
    ),

    // Sections 11-12: Rich text
    inovadoras: tiptapToOoxml(plan.inovadoras as JSONContent | null),
    resultados: tiptapToOoxml(plan.resultados as JSONContent | null),
    // TRL checkboxes: trl1_check through trl9_check
    ...Object.fromEntries(
      TRL_LEVELS.map((trl) => [
        `trl${trl.level}_check`,
        plan.trlMrlLevel === trl.level ? "X" : "  ",
      ])
    ),

    // Section 13: Cronograma (raw OOXML table)
    cronogramaTable: buildCronogramaOoxml(plan.activities, plan.cronogramaOverrides || []),

    // Sections 14-15, 17: Rich text
    desafios: tiptapToOoxml(plan.desafios as JSONContent | null),
    solucao: tiptapToOoxml(plan.solucao as JSONContent | null),
    complementares: tiptapToOoxml(plan.complementares as JSONContent | null),
  };

  // 3c. Add financial tables
  // Map tag names to data keys (must match replaceFinanceiroTagsInTemplate — uses exact tag name)
  data["TABELA_ORCAMENTO_RESUMO"] = buildOrcamentoResumoOoxml(fin, projMonths);
  data["TABELA_EQUIPAMENTOS"] = buildEquipTableOoxml(fin.equipamentos);
  data["TABELA_LABORATORIOS"] = buildEquipTableOoxml(fin.laboratorios);
  data["TABELA_RH_DIRETO"] = buildRhTableOoxml(fin.rhDireto, projMonths);
  data["TABELA_RH_INDIRETO"] = buildRhTableOoxml(fin.rhIndireto, projMonths);
  data["TABELA_SERVICOS_TERCEIROS"] = buildEquipTableOoxml(fin.servicosTerceiros);
  data["TABELA_MATERIAL_CONSUMO"] = buildEquipTableOoxml(fin.materialConsumo);
  data["TABELA_LIVROS"] = buildOutrosTableOoxml(fin.outros.livros);
  data["TABELA_TREINAMENTOS"] = buildOutrosTableOoxml(fin.outros.treinamentos);
  data["TABELA_VIAGENS"] = buildOutrosTableOoxml(fin.outros.viagens);
  data["TABELA_OUTROS"] = buildOutrosTableOoxml(fin.outros.outrosDispendios);
  data["TABELA_CRONOGRAMA"] = buildCronogramaFinanceiroOoxml(fin, projMonths);
  data["TABELA_DESEMBOLSO"] = buildDesembolsoOoxml(fin, projMonths, plan.executionStartDate);

  // 4. Render
  doc.render(data);

  // 5. Post-process: restore section breaks that raw OOXML tags may have removed
  restoreSectionBreaks(originalZip, doc.getZip());

  // 6. Post-process: inject dynamic logos into header
  injectHeaderImages(doc.getZip(), plan);

  // 7. Post-process: inject content images from rich text fields
  injectContentImages(doc.getZip());

  // 8. Generate output
  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
}

// ---------------------------------------------------------------------------
// Post-processing: restore section breaks lost during raw OOXML substitution
// ---------------------------------------------------------------------------

function restoreSectionBreaks(originalZip: PizZip, outputZip: PizZip): void {
  const origXml = originalZip.file("word/document.xml")?.asText();
  const outXml = outputZip.file("word/document.xml")?.asText();
  if (!origXml || !outXml) return;

  // Extract all inline sectPr from original (those inside <w:pPr>, not the final body sectPr)
  const origSectPrs = origXml.match(
    /<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g
  );
  const outSectPrs = outXml.match(
    /<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g
  );

  if (!origSectPrs || !outSectPrs) return;

  // If the output has fewer sectPr than the original, some were lost
  if (outSectPrs.length >= origSectPrs.length) return;

  // Find which sectPrs are missing (compare by pgSz to identify them)
  const origPortraitSectPr = origSectPrs.find(
    (s) => s.includes('w:h="16840"') && s.includes('w:w="11900"') && s.includes("rId")
  );

  if (!origPortraitSectPr) return;

  // The missing sectPr needs to be re-inserted before the landscape section.
  // Find the landscape sectPr in the output and insert the portrait one before its paragraph.
  const landscapeSectPrIdx = outXml.indexOf('w:orient="landscape"');
  if (landscapeSectPrIdx === -1) return;

  // Find the <w:p that contains the landscape sectPr
  const landscapeParaStart = outXml.lastIndexOf("<w:p ", landscapeSectPrIdx);
  if (landscapeParaStart === -1) return;

  // Insert a new paragraph with the missing sectPr right before the landscape paragraph
  const restoredPara = `<w:p><w:pPr>${origPortraitSectPr}</w:pPr></w:p>`;
  const fixedXml =
    outXml.substring(0, landscapeParaStart) +
    restoredPara +
    outXml.substring(landscapeParaStart);

  outputZip.file("word/document.xml", fixedXml);
}

// ---------------------------------------------------------------------------
// Post-processing: inject dynamic logos into the document header
// ---------------------------------------------------------------------------

function base64ToBuffer(dataUri: string): { buffer: Buffer; ext: string } {
  const match = dataUri.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/);
  if (match) {
    return { buffer: Buffer.from(match[2], "base64"), ext: match[1] === "jpg" ? "jpeg" : match[1] };
  }
  return { buffer: Buffer.from(dataUri, "base64"), ext: "png" };
}

function buildImageDrawingXml(rId: string, widthEmu: number, heightEmu: number, name: string): string {
  return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:docPr id="${Math.floor(Math.random() * 100000)}" name="${escapeXml(name)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="${escapeXml(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
}

/**
 * Finds ##PARTNER_LOGO## and ##FOUNDATION_LOGO## markers in header1.xml
 * (placed by docxtemplater) and replaces the <w:r> containing them with
 * inline image drawing XML. Preserves the rest of the header layout from
 * the user's template (including the static UEA logo).
 */
function injectHeaderImages(outputZip: PizZip, plan: PlanFormData): void {
  const hasPartnerLogo = !!plan.partnerLogo;
  const hasFoundationLogo = !!plan.foundationLogo;
  if (!hasPartnerLogo && !hasFoundationLogo) return;

  let headerXml = outputZip.file("word/header1.xml")?.asText();
  if (!headerXml) return;

  // Existing header rels (template may already have image rels for UEA logo)
  const existingRels = outputZip.file("word/_rels/header1.xml.rels")?.asText() || "";
  const newRels: string[] = [];
  const imgContentTypes: string[] = [];

  // Logo size: ~1.8cm height (EMU: 1cm = 360000)
  const logoH = 648000;
  const logoW = 648000;

  // Simple approach: just replace the marker text with an image run.
  // The template already has the correct table layout — we only swap the text content.
  const processLogo = (
    marker: string,
    rId: string,
    logoData: string,
    imgName: string
  ) => {
    if (!headerXml!.includes(marker)) return;
    const { buffer, ext } = base64ToBuffer(logoData);
    const filename = `${imgName}.${ext}`;
    outputZip.file(`word/media/${filename}`, buffer);
    newRels.push(
      `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${filename}"/>`
    );
    imgContentTypes.push(ext);
    const imgDrawing = buildImageDrawingXml(rId, logoW, logoH, imgName);
    // Simply replace the marker text with the image drawing XML
    headerXml = headerXml!.replace(marker, `</w:t></w:r><w:r>${imgDrawing}</w:r><w:r><w:t>`);
  };

  if (hasPartnerLogo) {
    processLogo("##PARTNER_LOGO##", "rIdPartnerLogo", plan.partnerLogo, "partnerLogo");
  }
  if (hasFoundationLogo) {
    processLogo("##FOUNDATION_LOGO##", "rIdFoundationLogo", plan.foundationLogo, "foundationLogo");
  }

  outputZip.file("word/header1.xml", headerXml);

  // Update or create header1.xml.rels (merge with existing if template already has rels)
  if (newRels.length > 0) {
    let relsXml: string;
    if (existingRels && existingRels.includes("<Relationships")) {
      // Append new rels to existing
      relsXml = existingRels.replace("</Relationships>", newRels.join("") + "</Relationships>");
    } else {
      relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${newRels.join("")}</Relationships>`;
    }
    outputZip.file("word/_rels/header1.xml.rels", relsXml);
  }

  // Ensure [Content_Types].xml includes image types
  const contentTypesFile = outputZip.file("[Content_Types].xml");
  if (contentTypesFile) {
    let ct = contentTypesFile.asText();
    for (const ext of imgContentTypes) {
      const mime = ext === "png" ? "image/png" : ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
      if (!ct.includes(`Extension="${ext}"`)) {
        ct = ct.replace("</Types>", `<Default Extension="${ext}" ContentType="${mime}"/></Types>`);
      }
    }
    outputZip.file("[Content_Types].xml", ct);
  }
}

// ---------------------------------------------------------------------------
// Post-processing: inject content images from rich text into document.xml
// ---------------------------------------------------------------------------

function injectContentImages(outputZip: PizZip): void {
  if (collectedImages.length === 0) return;

  const newRels: string[] = [];
  const imgExtensions: Set<string> = new Set();

  for (const img of collectedImages) {
    // Read file from public/uploads/
    const filePath = path.join(process.cwd(), "public", img.src);
    if (!fs.existsSync(filePath)) continue;

    const buffer = fs.readFileSync(filePath);
    const ext = img.mediaPath.split(".").pop() || "png";

    // Add to zip
    outputZip.file(img.mediaPath, buffer);
    imgExtensions.add(ext);

    // Add relationship
    newRels.push(
      `<Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${img.mediaPath.replace("word/", "")}"/>`
    );
  }

  if (newRels.length === 0) return;

  // Update document.xml.rels
  const docRelsPath = "word/_rels/document.xml.rels";
  const existingDocRels = outputZip.file(docRelsPath)?.asText() || "";
  if (existingDocRels.includes("<Relationships")) {
    const updatedRels = existingDocRels.replace("</Relationships>", newRels.join("") + "</Relationships>");
    outputZip.file(docRelsPath, updatedRels);
  }

  // Ensure [Content_Types].xml includes image types
  const contentTypesFile = outputZip.file("[Content_Types].xml");
  if (contentTypesFile) {
    let ct = contentTypesFile.asText();
    for (const ext of imgExtensions) {
      const mime = ext === "png" ? "image/png" : ext === "jpeg" ? "image/jpeg" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : `image/${ext}`;
      if (!ct.includes(`Extension="${ext}"`)) {
        ct = ct.replace("</Types>", `<Default Extension="${ext}" ContentType="${mime}"/></Types>`);
      }
    }
    outputZip.file("[Content_Types].xml", ct);
  }
}
