import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as fs from "fs";
import * as path from "path";
import type { PlanFormData } from "@/types/plan";
import {
  INDICATORS,
  TRL_LEVELS,
  HIRING_TYPES,
  DIRECT_INDIRECT,
} from "@/lib/constants";
import { formatBRL } from "@/lib/utils";

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

// Paragraph properties: justified text
const PARA_PROPS = '<w:pPr><w:jc w:val="both"/></w:pPr>';

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

function nodeToRuns(node: JSONContent): string {
  if (node.text) {
    const rPr = buildRunProps(node.marks);
    return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(node.text)}</w:t></w:r>`;
  }
  if (node.type === "hardBreak") {
    return `<w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:br/></w:r>`;
  }
  if (node.content) {
    return node.content.map((child) => nodeToRuns(child)).join("");
  }
  return "";
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
        const runs = nodeToRuns(node);
        paragraphs.push(`<w:p>${PARA_PROPS}${runs}</w:p>`);
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
        paragraphs.push(`<w:p>${PARA_PROPS}${runs}</w:p>`);
        break;
      }

      case "bulletList": {
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === "listItem" && listItem.content) {
              for (const child of listItem.content) {
                const runs = nodeToRuns(child);
                paragraphs.push(
                  `<w:p>${PARA_PROPS}<w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve">\u2022 </w:t></w:r>${runs}</w:p>`
                );
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
                  `<w:p>${PARA_PROPS}<w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve">${counter}. </w:t></w:r>${runs}</w:p>`
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
              `<w:p><w:pPr><w:ind w:left="720"/><w:jc w:val="both"/></w:pPr>${runs}</w:p>`
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

  // Join paragraphs with an empty line between each one
  return paragraphs.length > 0
    ? paragraphs.join(EMPTY_PARA)
    : `<w:p><w:r><w:rPr>${DEFAULT_FONT}</w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
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
        return `<w:tc><w:tcPr>${borderXml}${shading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Verdana" w:hAnsi="Verdana" w:cs="Verdana"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${active ? "X" : " "}</w:t></w:r></w:p></w:tc>`;
      }).join("");

      dataRows.push(`<w:tr>${subNameCell}${monthCells}</w:tr>`);
    }
  }

  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>${headerRow}${dataRows.join("")}</w:tbl>`;
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

  // 1b. Pre-process: replace {#activities}...{/activities} loop with raw OOXML tag
  replaceActivitiesLoopInTemplate(zip);

  // 2. Create docxtemplater instance
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // 3. Build data object
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
    totalValue: plan.totalValue != null ? formatBRL(plan.totalValue) : "\u2014",
    totalValueWritten: plan.totalValueWritten || " ",
    executionPeriod: `${formatDateBR(plan.executionStartDate)} a ${formatDateBR(plan.executionEndDate)}`,
    validityPeriod: `${formatDateBR(plan.validityStartDate)} a ${formatDateBR(plan.validityEndDate)}`,

    // Section 2: Project Type checkboxes
    sw_dev_check: plan.projectTypes.includes("SW_DEV") ? "\u2612" : "\u2610",
    product_dev_check: plan.projectTypes.includes("PRODUCT_DEV") ? "\u2612" : "\u2610",
    process_dev_check: plan.projectTypes.includes("PROCESS_DEV") ? "\u2612" : "\u2610",
    automation_check: plan.projectTypes.includes("AUTOMATION") ? "\u2612" : "\u2610",
    training_pt_check: plan.projectTypes.includes("TRAINING") ? "\u2612" : "\u2610",
    not_defined_pt_check: plan.projectTypes.includes("NOT_DEFINED") ? "\u2612" : "\u2610",

    // Section 3: Activity Type checkboxes
    basic_research_check: plan.activityTypes.includes("BASIC_RESEARCH") ? "\u2612" : "\u2610",
    applied_research_check: plan.activityTypes.includes("APPLIED_RESEARCH") ? "\u2612" : "\u2610",
    experimental_dev_check: plan.activityTypes.includes("EXPERIMENTAL_DEV") ? "\u2612" : "\u2610",
    tech_innovation_check: plan.activityTypes.includes("TECH_INNOVATION") ? "\u2612" : "\u2610",
    training_at_check: plan.activityTypes.includes("TRAINING") ? "\u2612" : "\u2610",
    consulting_check: plan.activityTypes.includes("CONSULTING") ? "\u2612" : "\u2610",
    not_defined_at_check: plan.activityTypes.includes("NOT_DEFINED") ? "\u2612" : "\u2610",

    // Sections 4-7: Rich text (raw OOXML)
    motivacao: tiptapToOoxml(plan.motivacao as JSONContent | null),
    objetivosGerais: tiptapToOoxml(plan.objetivosGerais as JSONContent | null),
    objetivosEspecificos: tiptapToOoxml(plan.objetivosEspecificos as JSONContent | null),
    escopo: tiptapToOoxml(plan.escopo as JSONContent | null),
    estrategias: tiptapToOoxml(plan.estrategias as JSONContent | null),

    // Section 8: Activities (raw OOXML — full formatting control)
    activitiesContent: buildActivitiesOoxml(plan.activities),

    // Section 9: Professionals (loop)
    professionals: plan.professionals.map((p, i) => ({
      index: i + 1,
      name: p.name || " ",
      education: p.education || " ",
      degree: p.degree || " ",
      miniCv: p.miniCv || " ",
      activityAssignment: p.activityAssignment || " ",
      hiringType: lookupLabel(
        HIRING_TYPES as unknown as { value: string; label: string }[],
        p.hiringType
      ),
      directIndirect: lookupLabel(
        DIRECT_INDIRECT as unknown as { value: string; label: string }[],
        p.directIndirect
      ),
    })),

    // Section 10: Indicators
    ...Object.fromEntries(
      INDICATORS.flatMap((ind) => {
        const d = plan.indicators?.[ind.key];
        return [
          [`${ind.key}_check`, d?.enabled ? "\u2612" : "\u2610"],
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
        plan.trlMrlLevel === trl.level ? "(X)" : "( )",
      ])
    ),

    // Section 13: Cronograma (raw OOXML table)
    cronogramaTable: buildCronogramaOoxml(plan.activities, plan.cronogramaOverrides || []),

    // Sections 14-15, 17: Rich text
    desafios: tiptapToOoxml(plan.desafios as JSONContent | null),
    solucao: tiptapToOoxml(plan.solucao as JSONContent | null),
    complementares: tiptapToOoxml(plan.complementares as JSONContent | null),
  };

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
