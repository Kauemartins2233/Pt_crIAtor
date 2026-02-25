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
  if (!marks || marks.length === 0) return "";
  const props: string[] = [];
  for (const mark of marks) {
    if (mark.type === "bold") props.push("<w:b/>");
    if (mark.type === "italic") props.push("<w:i/>");
    if (mark.type === "underline") props.push('<w:u w:val="single"/>');
    if (mark.type === "strike") props.push("<w:strike/>");
  }
  if (props.length === 0) return "";
  return `<w:rPr>${props.join("")}</w:rPr>`;
}

function nodeToRuns(node: JSONContent): string {
  if (node.text) {
    const rPr = buildRunProps(node.marks);
    return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(node.text)}</w:t></w:r>`;
  }
  if (node.content) {
    return node.content.map((child) => nodeToRuns(child)).join("");
  }
  return "";
}

function tiptapToOoxml(content: JSONContent | null): string {
  if (!content || !content.content) {
    return '<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>';
  }

  const paragraphs: string[] = [];

  for (const node of content.content) {
    switch (node.type) {
      case "paragraph": {
        const runs = nodeToRuns(node);
        paragraphs.push(`<w:p>${runs}</w:p>`);
        break;
      }

      case "heading": {
        const runs = node.content
          ? node.content
              .map((child) => {
                if (child.text) {
                  return `<w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(child.text)}</w:t></w:r>`;
                }
                return nodeToRuns(child);
              })
              .join("")
          : "";
        paragraphs.push(`<w:p>${runs}</w:p>`);
        break;
      }

      case "bulletList": {
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === "listItem" && listItem.content) {
              for (const child of listItem.content) {
                const runs = nodeToRuns(child);
                paragraphs.push(
                  `<w:p><w:r><w:t xml:space="preserve">\u2022 </w:t></w:r>${runs}</w:p>`
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
                  `<w:p><w:r><w:t xml:space="preserve">${counter}. </w:t></w:r>${runs}</w:p>`
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
              `<w:p><w:pPr><w:ind w:left="720"/></w:pPr>${runs}</w:p>`
            );
          }
        }
        break;
      }

      case "image": {
        paragraphs.push(
          `<w:p><w:r><w:rPr><w:i/><w:color w:val="888888"/></w:rPr><w:t>[Imagem]</w:t></w:r></w:p>`
        );
        break;
      }

      default: {
        const runs = nodeToRuns(node);
        if (runs) {
          paragraphs.push(`<w:p>${runs}</w:p>`);
        }
        break;
      }
    }
  }

  return paragraphs.length > 0
    ? paragraphs.join("")
    : '<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>';
}

// ---------------------------------------------------------------------------
// Cronograma table as raw OOXML
// ---------------------------------------------------------------------------

import type { ActivityFormData } from "@/types/plan";

function buildCronogramaOoxml(activities: ActivityFormData[]): string {
  if (activities.length === 0) {
    return '<w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Nenhuma atividade cadastrada.</w:t></w:r></w:p>';
  }

  const borderXml = '<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders>';
  const headerShading = '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>';
  const activeShading = '<w:shd w:val="clear" w:color="auto" w:fill="B4C6E7"/>';

  const months = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

  // Header row
  const headerCells = [
    `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/>${borderXml}${headerShading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>Atividade</w:t></w:r></w:p></w:tc>`,
    ...months.map(
      (m) =>
        `<w:tc><w:tcPr>${borderXml}${headerShading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>${m}</w:t></w:r></w:p></w:tc>`
    ),
  ].join("");

  const headerRow = `<w:tr>${headerCells}</w:tr>`;

  // Data rows
  const dataRows = activities
    .map((act, idx) => {
      const nameCell = `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/>${borderXml}</w:tcPr><w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${idx + 1}. ${escapeXml(act.name)}</w:t></w:r></w:p></w:tc>`;

      const monthCells = Array.from({ length: 12 }, (_, m) => {
        const active = act.activeMonths?.includes(m + 1) ?? false;
        const shading = active ? activeShading : "";
        return `<w:tc><w:tcPr>${borderXml}${shading}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${active ? "X" : " "}</w:t></w:r></w:p></w:tc>`;
      }).join("");

      return `<w:tr>${nameCell}${monthCells}</w:tr>`;
    })
    .join("");

  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>${headerRow}${dataRows}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateDocx(plan: PlanFormData): Promise<Buffer> {
  // 1. Read template
  const templatePath = path.join(process.cwd(), "public", "template.docx");
  const templateContent = fs.readFileSync(templatePath, "binary");
  const originalZip = new PizZip(templateContent); // keep pristine copy
  const zip = new PizZip(templateContent);          // this one gets modified by docxtemplater

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

    // Section 8: Activities (loop)
    activities: plan.activities.map((a, i) => ({
      index: i + 1,
      name: a.name || " ",
      description: a.description || " ",
      justification: a.justification || " ",
      startDate: a.startDate || "\u2014",
      endDate: a.endDate || "\u2014",
    })),

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
    cronogramaTable: buildCronogramaOoxml(plan.activities),

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

  // 7. Generate output
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
