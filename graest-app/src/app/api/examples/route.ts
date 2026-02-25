import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Dynamically import pdf-parse (CommonJS module)
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text || "";
}

/**
 * Derive a friendly display name from a filename.
 * e.g. "escopo-lity.txt" → "Lity", "PA - MES.txt" → "MES"
 */
function deriveDisplayName(filename: string): string {
  const base = filename.replace(/\.(txt|pdf)$/i, "");
  // Check common project names (case-insensitive)
  const lower = base.toLowerCase();
  if (lower.includes("lity")) return "Lity";
  if (lower.includes("mes")) return "MES";
  // Fallback: clean up the filename
  return base.replace(/[-_]/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");

  if (!section) {
    return NextResponse.json({ error: "section é obrigatório" }, { status: 400 });
  }

  const examplesDir = path.join(process.cwd(), "public", "examples", `secao-${section}`);

  if (!fs.existsSync(examplesDir)) {
    return NextResponse.json([]);
  }

  const files = fs
    .readdirSync(examplesDir)
    .filter((f) => f.endsWith(".pdf") || f.endsWith(".txt"));

  const examples: { name: string; content: string }[] = [];

  for (const file of files) {
    const filePath = path.join(examplesDir, file);
    try {
      let content = "";
      if (file.endsWith(".pdf")) {
        const buffer = fs.readFileSync(filePath);
        content = await extractPdfText(buffer);
      } else {
        content = fs.readFileSync(filePath, "utf-8");
      }
      if (content.trim()) {
        examples.push({
          name: deriveDisplayName(file),
          content: content.trim(),
        });
      }
    } catch {
      // Skip unreadable files
    }
  }

  return NextResponse.json(examples);
}
