import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { AI_SECTION_PROMPTS, AI_FIELD_PROMPTS } from "@/lib/constants";
import * as fs from "fs";
import * as path from "path";

// Dynamically import pdf-parse (CommonJS module)
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function readFileAsText(filePath: string, mimeType: string): Promise<string> {
  const fullPath = path.join(process.cwd(), "public", filePath);
  if (!fs.existsSync(fullPath)) return "";

  if (mimeType === "application/pdf") {
    try {
      const buffer = fs.readFileSync(fullPath);
      return await extractPdfText(buffer);
    } catch {
      return "[PDF não pôde ser lido]";
    }
  }

  if (mimeType === "text/plain") {
    return fs.readFileSync(fullPath, "utf-8");
  }

  // For DOCX/PPTX, return placeholder (could add mammoth/pptx parser later)
  if (mimeType?.includes("wordprocessingml")) {
    return "[Documento DOCX — conteúdo não extraído automaticamente]";
  }
  if (mimeType?.includes("presentationml")) {
    return "[Apresentação PPTX — conteúdo não extraído automaticamente]";
  }

  return "";
}

async function loadExamples(section: number): Promise<string> {
  const examplesDir = path.join(process.cwd(), "public", "examples", `secao-${section}`);
  if (!fs.existsSync(examplesDir)) return "";

  const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".pdf") || f.endsWith(".txt"));
  const texts: string[] = [];

  for (const file of files.slice(0, 3)) {
    // Limit to 3 examples
    const filePath = path.join(examplesDir, file);
    if (file.endsWith(".pdf")) {
      try {
        const buffer = fs.readFileSync(filePath);
        const text = await extractPdfText(buffer);
        if (text.trim()) {
          texts.push(`--- Exemplo (${file}) ---\n${text.slice(0, 3000)}`);
        }
      } catch {
        // skip unreadable PDFs
      }
    } else {
      const text = fs.readFileSync(filePath, "utf-8");
      if (text.trim()) {
        texts.push(`--- Exemplo (${file}) ---\n${text.slice(0, 3000)}`);
      }
    }
  }

  return texts.join("\n\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chave de API do Gemini não configurada. Adicione GEMINI_API_KEY ao .env" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const {
      planId,
      section,
      fieldName,
      currentContent,
      selectedText,
      action = "generate", // "generate" | "expand" | "rewrite" | "custom"
      customInstruction,
      projectContext,
      useModulosApproach,
    } = body;

    if (!planId || section == null) {
      return NextResponse.json({ error: "planId e section são obrigatórios." }, { status: 400 });
    }

    // 1. Load plan materials
    const materials = await prisma.material.findMany({ where: { planId } });
    const materialTexts: string[] = [];

    for (const mat of materials) {
      if (mat.type === "text" && mat.textContent) {
        materialTexts.push(`[${mat.filename || "Texto"}]: ${mat.textContent.slice(0, 5000)}`);
      } else if (mat.type === "file" && mat.filePath && mat.mimeType) {
        const text = await readFileAsText(mat.filePath, mat.mimeType);
        if (text.trim()) {
          materialTexts.push(`[${mat.filename}]: ${text.slice(0, 5000)}`);
        }
      }
    }

    // 2. Load examples for this section
    const examplesText = await loadExamples(section);

    // 3. Build prompt — prefer field-specific prompt over generic section prompt
    // When useModulosApproach is enabled for objetivosEspecificos, use the módulos prompt
    const effectiveFieldName =
      fieldName === "objetivosEspecificos" && useModulosApproach
        ? "objetivosEspecificosModulos"
        : fieldName;

    const sectionPrompt = (effectiveFieldName && AI_FIELD_PROMPTS[effectiveFieldName])
      || AI_SECTION_PROMPTS[section]
      || `Seção ${section}: Gere conteúdo relevante para esta seção do plano de trabalho.`;

    const systemPrompt = `Você é um assistente especializado na elaboração de Planos de Trabalho de Pesquisa, Desenvolvimento e Inovação (PD&I) no contexto da Lei de Informática brasileira (Lei 8.248/91).

Sua tarefa é gerar sugestões de texto para um campo específico do plano de trabalho, baseando-se nos materiais de contexto fornecidos pelo usuário e em exemplos de planos anteriores.

REGRAS:
- Escreva em português brasileiro formal e técnico
- Use termos apropriados para P&D e inovação tecnológica
- Baseie-se fortemente nos materiais de contexto fornecidos
- Se houver exemplos, use como referência de estilo e profundidade
- Gere texto pronto para uso, sem marcadores como "[inserir aqui]"
- Não inclua títulos de seção ou subtítulos — apenas o conteúdo do campo solicitado
- Seja detalhado e completo, mas conciso
- IMPORTANTE: NÃO use formatação Markdown. Não use asteriscos (*) para negrito ou itálico, não use cerquilhas (#) para títulos, não use hífens (-) para listas, não use "o" como marcador de tópico. Escreva texto corrido puro em parágrafos, usando apenas quebras de linha para separar parágrafos.`;

    let userPrompt = `${sectionPrompt}\n\n`;

    if (projectContext) {
      userPrompt += `DADOS DO PROJETO:\n`;
      if (projectContext.projectName) userPrompt += `- Nome: ${projectContext.projectName}\n`;
      if (projectContext.partnerName) userPrompt += `- Empresa: ${projectContext.partnerName}\n`;
      if (projectContext.projectNickname) userPrompt += `- Apelido: ${projectContext.projectNickname}\n`;
      if (projectContext.motivacao) userPrompt += `- Motivação: ${projectContext.motivacao}\n`;
      if (projectContext.objetivosGerais) userPrompt += `- Objetivos Gerais: ${projectContext.objetivosGerais}\n`;
      if (projectContext.objetivosEspecificos) userPrompt += `- Objetivos Específicos: ${projectContext.objetivosEspecificos}\n`;
      userPrompt += `\n`;
    }

    if (materialTexts.length > 0) {
      userPrompt += `MATERIAIS DE CONTEXTO DO USUÁRIO:\n${materialTexts.join("\n\n")}\n\n`;
    }

    if (examplesText) {
      userPrompt += `EXEMPLOS DE PLANOS ANTERIORES (use como referência de estilo):\n${examplesText}\n\n`;
    }

    if (currentContent) {
      userPrompt += `CONTEÚDO ATUAL DO CAMPO:\n${currentContent}\n\n`;
    }

    // Action-specific instructions
    switch (action) {
      case "expand":
        userPrompt += `TEXTO SELECIONADO PARA EXPANDIR:\n"${selectedText}"\n\n`;
        userPrompt += `Expanda e aprofunde o texto selecionado acima, adicionando mais detalhes, argumentos e informações relevantes. Mantenha o estilo e tom do texto original. Retorne APENAS o texto expandido (que substituirá o selecionado).`;
        break;

      case "rewrite":
        userPrompt += `TEXTO SELECIONADO PARA REESCREVER:\n"${selectedText}"\n\n`;
        userPrompt += `Reescreva o texto selecionado acima de forma melhorada — mais claro, mais técnico e mais bem estruturado. Mantenha o mesmo significado. Retorne APENAS o texto reescrito (que substituirá o selecionado).`;
        break;

      case "custom":
        userPrompt += `TEXTO SELECIONADO:\n"${selectedText}"\n\n`;
        userPrompt += `INSTRUÇÃO DO USUÁRIO: ${customInstruction}\n\n`;
        userPrompt += `Aplique a instrução acima ao texto selecionado. Retorne APENAS o texto resultante (que substituirá o selecionado).`;
        break;

      case "generate":
      default:
        userPrompt += `Gere o texto para o campo "${fieldName}" da seção indicada acima.`;
        break;
    }

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: systemPrompt,
    });

    const suggestion = result.response.text();

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("AI suggestion error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro ao gerar sugestão: ${message}` }, { status: 500 });
  }
}
