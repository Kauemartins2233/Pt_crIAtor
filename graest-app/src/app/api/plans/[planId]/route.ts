import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ planId: string }> };

// SQLite stores JSON fields as strings; these helpers handle serialization.
const JSON_FIELDS = [
  'projectTypes', 'activityTypes', 'motivacao', 'objetivosGerais',
  'objetivosEspecificos', 'escopo', 'estrategias', 'indicators',
  'inovadoras', 'resultados', 'desafios', 'solucao', 'complementares',
  'cronogramaOverrides', 'completedSections',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonFields(plan: any) {
  const parsed = { ...plan };
  for (const field of JSON_FIELDS) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try { parsed[field] = JSON.parse(parsed[field]); } catch { /* keep as-is */ }
    }
  }
  if (parsed.activities) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.activities = parsed.activities.map((a: any) => ({
      ...a,
      activeMonths: a.activeMonths && typeof a.activeMonths === 'string'
        ? JSON.parse(a.activeMonths)
        : (a.activeMonths ?? []),
      subActivities: (() => {
        const raw = a.subActivities && typeof a.subActivities === 'string'
          ? JSON.parse(a.subActivities)
          : (a.subActivities ?? []);
        // Normalize: old string[] → new { name, description }[]
        if (!Array.isArray(raw) || raw.length === 0) return [{ name: "", description: "" }];
        return raw.map((s: unknown) =>
          typeof s === "string" ? { name: s, description: "" } : s
        );
      })(),
    }));
  }
  return parsed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringifyJsonFields(data: any) {
  const result = { ...data };
  for (const field of JSON_FIELDS) {
    if (result[field] !== undefined && result[field] !== null && typeof result[field] !== 'string') {
      result[field] = JSON.stringify(result[field]);
    }
  }
  return result;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { planId } = await context.params;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        activities: { orderBy: { orderIndex: "asc" } },
        professionals: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(parseJsonFields(plan));
  } catch (error) {
    console.error("GET /api/plans/[planId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { planId } = await context.params;
    const body = await request.json();

    const { activities, professionals, ...rawScalarFields } = body;
    const scalarFields = stringifyJsonFields(rawScalarFields);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = await prisma.$transaction(async (tx: any) => {
      // Delete and recreate activities if provided
      if (activities !== undefined) {
        await tx.activity.deleteMany({ where: { planId } });

        if (activities.length > 0) {
          await tx.activity.createMany({
            data: activities.map(
              (
                a: {
                  name: string;
                  description?: string;
                  justification?: string;
                  startDate?: string;
                  endDate?: string;
                  activeMonths?: number[];
                  subActivities?: { name: string; description: string }[];
                },
                index: number
              ) => ({
                planId,
                orderIndex: index,
                name: a.name,
                description: a.description ?? null,
                justification: a.justification ?? null,
                startDate: a.startDate ?? null,
                endDate: a.endDate ?? null,
                activeMonths: a.activeMonths != null && typeof a.activeMonths !== 'string'
                  ? JSON.stringify(a.activeMonths)
                  : (a.activeMonths ?? null),
                subActivities: a.subActivities != null && typeof a.subActivities !== 'string'
                  ? JSON.stringify(a.subActivities)
                  : (a.subActivities ?? null),
              })
            ),
          });
        }
      }

      // Delete and recreate professionals if provided
      if (professionals !== undefined) {
        await tx.professional.deleteMany({ where: { planId } });

        if (professionals.length > 0) {
          await tx.professional.createMany({
            data: professionals.map(
              (
                p: {
                  name: string;
                  education?: string;
                  degree?: string;
                  miniCv?: string;
                  activityAssignment?: string;
                  hiringType?: string;
                  directIndirect?: string;
                },
                index: number
              ) => ({
                planId,
                orderIndex: index,
                name: p.name,
                education: p.education ?? null,
                degree: p.degree ?? null,
                miniCv: p.miniCv ?? null,
                activityAssignment: p.activityAssignment ?? null,
                hiringType: p.hiringType ?? null,
                directIndirect: p.directIndirect ?? null,
              })
            ),
          });
        }
      }

      // Update plan scalar fields
      return tx.plan.update({
        where: { id: planId },
        data: scalarFields,
        include: {
          activities: { orderBy: { orderIndex: "asc" } },
          professionals: { orderBy: { orderIndex: "asc" } },
        },
      });
    });

    return NextResponse.json(parseJsonFields(plan));
  } catch (error) {
    console.error("PUT /api/plans/[planId] error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { planId } = await context.params;

    await prisma.plan.delete({ where: { id: planId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/plans/[planId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
