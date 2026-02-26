import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDocx } from "@/components/export/DocxGenerator";
import type {
  PlanFormData,
  ActivityFormData,
  ProfessionalFormData,
  IndicatorData,
  CronogramaCell,
} from "@/types/plan";

type RouteContext = { params: Promise<{ planId: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeParse(value: any) {
  if (value && typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
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

    // Transform Prisma result to PlanFormData shape
    const formData: PlanFormData = {
      partnerName: plan.partnerName ?? "",
      partnerLogo: plan.partnerLogo ?? "",
      foundationName: plan.foundationName ?? "",
      foundationLogo: plan.foundationLogo ?? "",
      projectName: plan.projectName ?? "",
      projectNickname: plan.projectNickname ?? "",
      coordinatorInstitution: plan.coordinatorInstitution ?? "",
      coordinatorFoxconn: plan.coordinatorFoxconn ?? "",
      totalValue: plan.totalValue ? Number(plan.totalValue) : null,
      totalValueWritten: plan.totalValueWritten ?? "",
      executionStartDate: plan.executionStartDate
        ? plan.executionStartDate.toISOString()
        : "",
      executionEndDate: plan.executionEndDate
        ? plan.executionEndDate.toISOString()
        : "",
      validityStartDate: plan.validityStartDate
        ? plan.validityStartDate.toISOString()
        : "",
      validityEndDate: plan.validityEndDate
        ? plan.validityEndDate.toISOString()
        : "",
      projectTypes: (safeParse(plan.projectTypes) as string[] | null) ?? [],
      activityTypes: (safeParse(plan.activityTypes) as string[] | null) ?? [],
      motivacao: safeParse(plan.motivacao) as PlanFormData["motivacao"],
      objetivosGerais: safeParse(plan.objetivosGerais) as PlanFormData["objetivosGerais"],
      objetivosEspecificos:
        safeParse(plan.objetivosEspecificos) as PlanFormData["objetivosEspecificos"],
      useModulosApproach: plan.useModulosApproach ?? false,
      escopo: safeParse(plan.escopo) as PlanFormData["escopo"],
      estrategias: safeParse(plan.estrategias) as PlanFormData["estrategias"],
      activities: plan.activities.map(
        (a): ActivityFormData => ({
          id: a.id,
          orderIndex: a.orderIndex,
          name: a.name,
          description: a.description ?? "",
          justification: a.justification ?? "",
          startDate: a.startDate ?? "",
          endDate: a.endDate ?? "",
          activeMonths: (safeParse(a.activeMonths) as number[] | null) ?? [],
          subActivities: (() => {
            const raw = safeParse((a as any).subActivities);
            if (!Array.isArray(raw) || raw.length === 0) return [{ name: "", description: "" }];
            return raw.map((s: unknown) =>
              typeof s === "string" ? { name: s, description: "" } : s
            );
          })() as { name: string; description: string }[],
        })
      ),
      professionals: plan.professionals.map(
        (p): ProfessionalFormData => ({
          id: p.id,
          orderIndex: p.orderIndex,
          name: p.name,
          category: p.category ?? "",
          education: p.education ?? "",
          degree: p.degree ?? "",
          miniCv: p.miniCv ?? "",
          roleInProject: p.roleInProject ?? "",
          activityAssignment: p.activityAssignment ?? "",
          hiringType: p.hiringType ?? "",
          directIndirect: p.directIndirect ?? "",
        })
      ),
      indicators: (safeParse(plan.indicators) as IndicatorData | null) ?? {},
      inovadoras: safeParse(plan.inovadoras) as PlanFormData["inovadoras"],
      resultados: safeParse(plan.resultados) as PlanFormData["resultados"],
      trlMrlLevel: plan.trlMrlLevel,
      desafios: safeParse(plan.desafios) as PlanFormData["desafios"],
      solucao: safeParse(plan.solucao) as PlanFormData["solucao"],
      complementares: safeParse(plan.complementares) as PlanFormData["complementares"],
      cronogramaOverrides:
        (safeParse(plan.cronogramaOverrides) as CronogramaCell[] | null) ?? [],
    };

    const buffer = await generateDocx(formData);

    const nickname = plan.projectNickname || plan.projectName || "plano";
    const safeFilename = nickname
      .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 60);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="plano-${safeFilename}.docx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/export/[planId]/docx error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
