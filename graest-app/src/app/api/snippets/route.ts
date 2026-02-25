import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SNIPPET_JSON_FIELDS = ['content', 'images'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSnippetJsonFields(snippet: any) {
  const parsed = { ...snippet };
  for (const field of SNIPPET_JSON_FIELDS) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try { parsed[field] = JSON.parse(parsed[field]); } catch { /* keep as-is */ }
    }
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");

    const snippets = await prisma.snippet.findMany({
      where: section ? { targetSection: parseInt(section, 10) } : undefined,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(snippets.map(parseSnippetJsonFields));
  } catch (error) {
    console.error("GET /api/snippets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, targetSection, content, images } = body;

    if (!name || targetSection === undefined || !content) {
      return NextResponse.json(
        { error: "Missing required fields: name, targetSection, content" },
        { status: 400 }
      );
    }

    const snippet = await prisma.snippet.create({
      data: {
        name,
        targetSection,
        content: typeof content !== 'string' ? JSON.stringify(content) : content,
        images: images != null && typeof images !== 'string'
          ? JSON.stringify(images)
          : (images ?? null),
      },
    });

    return NextResponse.json(parseSnippetJsonFields(snippet), { status: 201 });
  } catch (error) {
    console.error("POST /api/snippets error:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 }
    );
  }
}
