"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { WizardShell } from "@/components/wizard/WizardShell";
import { usePlanStore } from "@/lib/store";
import { defaultPlanFormData, type PlanFormData } from "@/types/plan";

/* eslint-disable @typescript-eslint/no-explicit-any */
function apiResponseToFormData(plan: any): PlanFormData {
  const toDateStr = (val: any): string => {
    if (!val) return "";
    const d = new Date(val);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  };

  return {
    partnerName: plan.partnerName ?? "",
    partnerLogo: plan.partnerLogo ?? "",
    foundationName: plan.foundationName ?? "",
    foundationLogo: plan.foundationLogo ?? "",
    projectName: plan.projectName ?? "",
    projectNickname: plan.projectNickname ?? "",
    coordinatorInstitution: plan.coordinatorInstitution ?? "",
    coordinatorFoxconn: plan.coordinatorFoxconn ?? "",
    totalValue: plan.totalValue != null ? Number(plan.totalValue) : null,
    totalValueWritten: plan.totalValueWritten ?? "",
    executionStartDate: toDateStr(plan.executionStartDate),
    executionEndDate: toDateStr(plan.executionEndDate),
    validityStartDate: toDateStr(plan.validityStartDate),
    validityEndDate: toDateStr(plan.validityEndDate),
    projectTypes: plan.projectTypes ?? [],
    activityTypes: plan.activityTypes ?? [],
    motivacao: plan.motivacao ?? null,
    objetivosGerais: plan.objetivosGerais ?? null,
    objetivosEspecificos: plan.objetivosEspecificos ?? null,
    useModulosApproach: plan.useModulosApproach ?? false,
    escopo: plan.escopo ?? null,
    estrategias: plan.estrategias ?? null,
    activities: (plan.activities && plan.activities.length > 0)
      ? plan.activities.map((a: any) => ({
          id: a.id,
          orderIndex: a.orderIndex,
          name: a.name ?? "",
          description: a.description ?? "",
          justification: a.justification ?? "",
          startDate: a.startDate ?? "",
          endDate: a.endDate ?? "",
          activeMonths: a.activeMonths ?? [],
          subActivities: (() => {
            const raw = a.subActivities ?? [];
            if (!Array.isArray(raw) || raw.length === 0) return [{ name: "", description: "" }];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return raw.map((s: any) =>
              typeof s === "string" ? { name: s, description: "" } : { name: s?.name ?? "", description: s?.description ?? "" }
            );
          })(),
        }))
      : defaultPlanFormData.activities,
    professionals: (plan.professionals ?? []).map((p: any) => ({
      id: p.id,
      staffMemberId: p.staffMemberId ?? undefined,
      orderIndex: p.orderIndex,
      name: p.name ?? "",
      category: p.category ?? "",
      education: p.education ?? "",
      degree: p.degree ?? "",
      miniCv: p.miniCv ?? "",
      roleInProject: p.roleInProject ?? "",
      activityAssignment: p.activityAssignment ?? "",
      hiringType: p.hiringType ?? "",
      directIndirect: p.directIndirect ?? "",
    })),
    indicators: plan.indicators ?? {},
    inovadoras: plan.inovadoras ?? null,
    resultados: plan.resultados ?? null,
    trlMrlLevel: plan.trlMrlLevel ?? null,
    desafios: plan.desafios ?? null,
    solucao: plan.solucao ?? null,
    complementares: plan.complementares ?? null,
    cronogramaOverrides: plan.cronogramaOverrides ?? [],
  };
}

function formDataToApiPayload(data: PlanFormData): Record<string, any> {
  const toIsoOrNull = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  return {
    partnerName: data.partnerName || null,
    partnerLogo: data.partnerLogo || null,
    foundationName: data.foundationName || null,
    foundationLogo: data.foundationLogo || null,
    projectName: data.projectName || null,
    projectNickname: data.projectNickname || null,
    coordinatorInstitution: data.coordinatorInstitution || null,
    coordinatorFoxconn: data.coordinatorFoxconn || null,
    totalValue: data.totalValue,
    totalValueWritten: data.totalValueWritten || null,
    executionStartDate: toIsoOrNull(data.executionStartDate),
    executionEndDate: toIsoOrNull(data.executionEndDate),
    validityStartDate: toIsoOrNull(data.validityStartDate),
    validityEndDate: toIsoOrNull(data.validityEndDate),
    projectTypes: data.projectTypes,
    activityTypes: data.activityTypes,
    motivacao: data.motivacao,
    objetivosGerais: data.objetivosGerais,
    objetivosEspecificos: data.objetivosEspecificos,
    useModulosApproach: data.useModulosApproach,
    escopo: data.escopo,
    estrategias: data.estrategias,
    activities: data.activities.map((a) => ({
      name: a.name,
      description: a.description || undefined,
      justification: a.justification || undefined,
      startDate: a.startDate || undefined,
      endDate: a.endDate || undefined,
      activeMonths: a.activeMonths.length > 0 ? a.activeMonths : undefined,
      subActivities: a.subActivities ?? [{ name: "", description: "" }],
    })),
    professionals: data.professionals.map((p) => ({
      staffMemberId: p.staffMemberId || undefined,
      name: p.name,
      category: p.category || undefined,
      education: p.education || undefined,
      degree: p.degree || undefined,
      miniCv: p.miniCv || undefined,
      roleInProject: p.roleInProject || undefined,
      activityAssignment: p.activityAssignment || undefined,
      hiringType: p.hiringType || undefined,
      directIndirect: p.directIndirect || undefined,
    })),
    indicators: Object.keys(data.indicators).length > 0 ? data.indicators : null,
    inovadoras: data.inovadoras,
    resultados: data.resultados,
    trlMrlLevel: data.trlMrlLevel,
    desafios: data.desafios,
    solucao: data.solucao,
    complementares: data.complementares,
    cronogramaOverrides:
      data.cronogramaOverrides.length > 0 ? data.cronogramaOverrides : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function PlanEditorPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = usePlanStore((s) => s.loadPlan);
  const markSaved = usePlanStore((s) => s.markSaved);
  const formData = usePlanStore((s) => s.formData);
  const isDirty = usePlanStore((s) => s.isDirty);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Fetch plan on mount
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans/${planId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Plano não encontrado.");
            return;
          }
          throw new Error("Failed to fetch plan");
        }
        const plan = await res.json();
        const data = apiResponseToFormData(plan);
        const completedSections = plan.completedSections ?? [];
        loadPlan(planId, data, completedSections);
        // If plan has no activities in DB but we loaded defaults, mark dirty to trigger auto-save
        if (!plan.activities || plan.activities.length === 0) {
          usePlanStore.getState().updateField("activities", data.activities);
        }
      } catch (err) {
        console.error("Error loading plan:", err);
        setError("Erro ao carregar o plano.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, loadPlan]);

  // Auto-save with 3-second debounce
  useEffect(() => {
    // Skip auto-save on first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isDirty) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const payload = formDataToApiPayload(formData);
        const completedSections = usePlanStore.getState().completedSections;
        const res = await fetch(`/api/plans/${planId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, completedSections }),
        });
        if (res.ok) {
          markSaved();
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      }
    }, 3000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formData, isDirty, planId, markSaved]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Carregando plano...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/plans")}
            className="text-sm text-primary-600 underline"
          >
            Voltar para lista de planos
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <WizardShell />
    </>
  );
}
