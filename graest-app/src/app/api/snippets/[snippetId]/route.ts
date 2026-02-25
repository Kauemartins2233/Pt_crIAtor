import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ snippetId: string }> };

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringifySnippetJsonFields(data: any) {
  const result = { ...data };
  for (const field of SNIPPET_JSON_FIELDS) {
    if (result[field] !== undefined && result[field] !== null && typeof result[field] !== 'string') {
      result[field] = JSON.stringify(result[field]);
    }
  }
  return result;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { snippetId } = await context.params;

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(parseSnippetJsonFields(snippet));
  } catch (error) {
    console.error("GET /api/snippets/[snippetId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { snippetId } = await context.params;
    const body = await request.json();

    const snippet = await prisma.snippet.update({
      where: { id: snippetId },
      data: stringifySnippetJsonFields(body),
    });

    return NextResponse.json(parseSnippetJsonFields(snippet));
  } catch (error) {
    console.error("PUT /api/snippets/[snippetId] error:", error);
    return NextResponse.json(
      { error: "Failed to update snippet" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { snippetId } = await context.params;

    await prisma.snippet.delete({ where: { id: snippetId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/snippets/[snippetId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 }
    );
  }
}
