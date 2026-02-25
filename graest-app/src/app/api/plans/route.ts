import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const plans = await prisma.plan.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        projectName: true,
        projectNickname: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const plan = await prisma.plan.create({
      data: {},
      select: { id: true },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/plans error:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
