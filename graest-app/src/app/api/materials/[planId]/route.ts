import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const MATERIALS_DIR = path.join(process.cwd(), "public", "materials");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

type RouteContext = { params: Promise<{ planId: string }> };

// GET /api/materials/[planId] — list all materials for a plan
export async function GET(_req: NextRequest, context: RouteContext) {
  const { planId } = await context.params;
  try {
    const materials = await prisma.material.findMany({
      where: { planId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch {
    return NextResponse.json({ error: "Erro ao listar materiais." }, { status: 500 });
  }
}

// POST /api/materials/[planId] — upload file or add text
export async function POST(req: NextRequest, context: RouteContext) {
  const { planId } = await context.params;

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Text material
      const body = await req.json();
      if (!body.textContent?.trim()) {
        return NextResponse.json({ error: "Texto vazio." }, { status: 400 });
      }
      const material = await prisma.material.create({
        data: {
          planId,
          type: "text",
          textContent: body.textContent.trim(),
          filename: body.filename || "Texto",
        },
      });
      return NextResponse.json(material);
    }

    // File upload
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo não permitido. Use PDF, DOCX, PPTX, TXT ou imagens." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB." }, { status: 400 });
    }

    // Ensure directory exists
    const planDir = path.join(MATERIALS_DIR, planId);
    if (!fs.existsSync(planDir)) {
      fs.mkdirSync(planDir, { recursive: true });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const filePath = path.join(planDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const material = await prisma.material.create({
      data: {
        planId,
        type: "file",
        filename: file.name,
        filePath: `/materials/${planId}/${safeName}`,
        mimeType: file.type,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Material upload error:", error);
    return NextResponse.json({ error: "Erro ao salvar material." }, { status: 500 });
  }
}

// DELETE /api/materials/[planId]?id=xxx — delete a material
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { planId } = await context.params;
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID do material não informado." }, { status: 400 });
  }

  try {
    const material = await prisma.material.findFirst({
      where: { id, planId },
    });

    if (!material) {
      return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
    }

    // Delete file from disk
    if (material.filePath) {
      const fullPath = path.join(process.cwd(), "public", material.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao deletar material." }, { status: 500 });
  }
}
