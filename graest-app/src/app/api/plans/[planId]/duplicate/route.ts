import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ planId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { planId } = await context.params;

    const source = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        activities: { orderBy: { orderIndex: "asc" } },
        professionals: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      activities,
      professionals,
      ...scalarFields
    } = source;

    const newPlan = await prisma.plan.create({
      data: {
        ...scalarFields,
        projectName: source.projectName
          ? `${source.projectName} (cópia)`
          : "Plano (cópia)",
        status: "draft",
        activities: {
          createMany: {
            data: activities.map((a) => ({
              orderIndex: a.orderIndex,
              name: a.name,
              description: a.description,
              justification: a.justification,
              startDate: a.startDate,
              endDate: a.endDate,
              activeMonths: a.activeMonths ?? undefined,
            })),
          },
        },
        professionals: {
          createMany: {
            data: professionals.map((p) => ({
              orderIndex: p.orderIndex,
              name: p.name,
              education: p.education,
              degree: p.degree,
              miniCv: p.miniCv,
              activityAssignment: p.activityAssignment,
              hiringType: p.hiringType,
              directIndirect: p.directIndirect,
            })),
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("POST /api/plans/[planId]/duplicate error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate plan" },
      { status: 500 }
    );
  }
}
