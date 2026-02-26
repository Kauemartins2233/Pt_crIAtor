import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.staffMember.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, education, degree, miniCv } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const staffMember = await prisma.staffMember.create({
      data: {
        name: name.trim(),
        category: category?.trim() || null,
        education: education?.trim() || null,
        degree: degree?.trim() || null,
        miniCv: miniCv?.trim() || null,
      },
    });

    return NextResponse.json(staffMember, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
