import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { JSONContent } from "@tiptap/react";

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

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet list item
    if (trimmed.startsWith("- ")) {
      flushList(); // don't flush — accumulate
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Empty line = just flush any pending list
    if (trimmed === "") {
      flushList();
      continue;
    }

    // Regular text line — each line becomes its own paragraph
    flushList();
    result.push(`<p>${trimmed}</p>`);
  }

  // Flush remaining
  flushList();

  return result.join("");
}

/** Extract plain text from Tiptap JSONContent for AI context */
export function jsonContentToText(content: JSONContent | null): string {
  if (!content || !content.content) return "";
  const texts: string[] = [];
  for (const node of content.content) {
    if (node.content) {
      for (const child of node.content) {
        if (child.text) texts.push(child.text);
      }
    }
  }
  return texts.join(" ");
}
