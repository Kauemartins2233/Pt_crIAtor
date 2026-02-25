import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Converts AI plain-text response into HTML that TipTap can parse into
 * proper document nodes (paragraphs, bullet lists, bold, italic, etc.).
 *
 * - Lines starting with "- " → bullet list items
 * - Double newlines → paragraph breaks
 * - Single newlines → <br>
 * - **text** or *text* → <strong>/<em> (fallback in case AI still uses markdown)
 */
export function aiTextToHtml(text: string): string {
  // Strip markdown bold/italic markers → convert to HTML tags
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Split all lines
  const lines = html.split("\n");

  const result: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(`<ul>${listItems.map((li) => `<li><p>${li}</p></li>`).join("")}</ul>`);
      listItems = [];
    }
  };

  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const content = paragraphLines.join("<br>");
      if (content.trim()) {
        result.push(`<p>${content}</p>`);
      }
      paragraphLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet list item
    if (trimmed.startsWith("- ")) {
      flushParagraph();
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Empty line = paragraph break
    if (trimmed === "") {
      flushList();
      flushParagraph();
      continue;
    }

    // Regular text line
    flushList();
    paragraphLines.push(trimmed);
  }

  // Flush remaining
  flushList();
  flushParagraph();

  return result.join("");
}
