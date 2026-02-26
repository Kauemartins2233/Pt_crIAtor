import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { staffId } = await context.params;

    const staffMember = await prisma.staffMember.findUnique({
      where: { id: staffId },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(staffMember);
  } catch (error) {
    console.error("GET /api/staff/[staffId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { staffId } = await context.params;
    const body = await request.json();
    const { name, category, education, degree, miniCv } = body;

    const staffMember = await prisma.staffMember.update({
      where: { id: staffId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(education !== undefined && { education: education?.trim() || null }),
        ...(degree !== undefined && { degree: degree?.trim() || null }),
        ...(miniCv !== undefined && { miniCv: miniCv?.trim() || null }),
      },
    });

    return NextResponse.json(staffMember);
  } catch (error) {
    console.error("PUT /api/staff/[staffId] error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { staffId } = await context.params;

    await prisma.staffMember.delete({ where: { id: staffId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/staff/[staffId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
