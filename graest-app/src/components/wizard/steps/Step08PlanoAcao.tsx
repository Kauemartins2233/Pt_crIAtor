"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, Info, Trash2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ActivityFormData } from "@/types/plan";
import type { JSONContent } from "@tiptap/react";

// ---------------------------------------------------------------------------
// Helper: extract plain text from TipTap JSONContent
// ---------------------------------------------------------------------------
function jsonContentToText(content: JSONContent | null): string {
  if (!content || !content.content) return "";
  const texts: string[] = [];
  for (const node of content.content) {
    if (node.content) {
      for (const child of node.content) {
        if (child.text) texts.push(child.text);
      }
    }
  }
  return texts.join(" ");
}

// ---------------------------------------------------------------------------
// AiFieldButton — small inline button that calls the AI API and returns text
// ---------------------------------------------------------------------------
function AiFieldButton({
  fieldName,
  currentContent,
  onResult,
  disabled,
  label,
}: {
  fieldName: string;
  currentContent: string;
  onResult: (text: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const planId = usePlanStore((s) => s.planId);
  const formData = usePlanStore((s) => s.formData);

  const motivacao = jsonContentToText(formData.motivacao);
  const objetivosGerais = jsonContentToText(formData.objetivosGerais);
  const objetivosEspecificos = jsonContentToText(formData.objetivosEspecificos);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 8,
          fieldName,
          currentContent,
          projectContext: {
            projectName: formData.projectName,
            projectNickname: formData.projectNickname,
            partnerName: formData.partnerName,
            motivacao: motivacao?.slice(0, 1000),
            objetivosGerais: objetivosGerais?.slice(0, 1000),
            objetivosEspecificos: objetivosEspecificos?.slice(0, 1000),
          },
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();
      if (data.suggestion) onResult(data.suggestion);
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      title="Gerar com IA"
      className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Sparkles size={12} />
      )}
      {label || "IA"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function Step08PlanoAcao() {
  const { formData, updateField } = usePlanStore();
  const activities = formData.activities;
  const [generatingAll, setGeneratingAll] = useState(false);

  // Track which activities are expanded (all expanded by default)
  const [expanded, setExpanded] = useState<Record<number, boolean>>(
    Object.fromEntries(activities.map((_, i) => [i, true]))
  );

  function toggleExpanded(index: number) {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function handleUpdateActivity(
    index: number,
    field: keyof ActivityFormData,
    value: string | string[]
  ) {
    const updated = activities.map((act, i) =>
      i === index ? { ...act, [field]: value } : act
    );
    updateField("activities", updated);
  }

  function handleUpdateSubActivity(
    actIndex: number,
    subIndex: number,
    field: "name" | "description",
    value: string
  ) {
    const updated = activities.map((act, i) => {
      if (i !== actIndex) return act;
      const subs = [...(act.subActivities || [{ name: "", description: "" }])];
      subs[subIndex] = { ...subs[subIndex], [field]: value };
      return { ...act, subActivities: subs };
    });
    updateField("activities", updated);
  }

  function handleAddSubActivity(actIndex: number) {
    const updated = activities.map((act, i) => {
      if (i !== actIndex) return act;
      return {
        ...act,
        subActivities: [
          ...(act.subActivities || []),
          { name: "", description: "" },
        ],
      };
    });
    updateField("activities", updated);
  }

  function handleRemoveSubActivity(actIndex: number, subIndex: number) {
    const updated = activities.map((act, i) => {
      if (i !== actIndex) return act;
      const subs = act.subActivities || [{ name: "", description: "" }];
      if (subs.length <= 1) return act;
      const newSubs = subs.filter((_, j) => j !== subIndex);
      return { ...act, subActivities: newSubs };
    });
    updateField("activities", updated);
  }

  // Build context string for activity description AI
  function buildActivityContext(activity: ActivityFormData): string {
    const parts = [`Atividade macro: ${activity.name}`];
    const subNames = (activity.subActivities || [])
      .map((s) => s.name)
      .filter(Boolean);
    if (subNames.length > 0) {
      parts.push(`Subatividades: ${subNames.join(", ")}`);
    }
    return parts.join("\n");
  }

  // Build context for justification AI
  function buildJustificationContext(activity: ActivityFormData): string {
    const parts = [`Atividade macro: ${activity.name}`];
    if (activity.description) parts.push(`Descrição: ${activity.description}`);
    const subNames = (activity.subActivities || [])
      .map((s) => s.name)
      .filter(Boolean);
    if (subNames.length > 0) {
      parts.push(`Subatividades: ${subNames.join(", ")}`);
    }
    return parts.join("\n");
  }

  // Helper: call AI for a single field and return the suggestion
  async function callAi(fieldName: string, currentContent: string): Promise<string> {
    const fd = usePlanStore.getState().formData;
    const planId = usePlanStore.getState().planId;
    const motivacao = jsonContentToText(fd.motivacao);
    const objetivosGerais = jsonContentToText(fd.objetivosGerais);
    const objetivosEspecificos = jsonContentToText(fd.objetivosEspecificos);

    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        section: 8,
        fieldName,
        currentContent,
        projectContext: {
          projectName: fd.projectName,
          projectNickname: fd.projectNickname,
          partnerName: fd.partnerName,
          motivacao: motivacao?.slice(0, 1000),
          objetivosGerais: objetivosGerais?.slice(0, 1000),
          objetivosEspecificos: objetivosEspecificos?.slice(0, 1000),
        },
      }),
    });
    if (!res.ok) throw new Error("Erro ao gerar");
    const data = await res.json();
    return data.suggestion || "";
  }

  // ---------- GENERATE ALL: descriptions + justifications + sub descriptions + dates ----------
  const handleGenerateAll = useCallback(async () => {
    if (generatingAll) return;
    setGeneratingAll(true);

    try {
      const fd = usePlanStore.getState().formData;
      let updated = [...fd.activities.map((a) => ({ ...a, subActivities: [...(a.subActivities || []).map((s) => ({ ...s }))] }))];

      // 1) Generate sub-activity descriptions (parallel per activity)
      for (let i = 0; i < updated.length; i++) {
        const act = updated[i];
        if (!act.name.trim()) continue;

        const subPromises = act.subActivities.map(async (sub, si) => {
          if (!sub.name.trim() || sub.description.trim()) return; // skip if no name or already filled
          const text = await callAi(
            "subActivityDescription",
            `Atividade macro: ${act.name}\nSubatividade: ${sub.name}`
          );
          if (text) updated[i].subActivities[si].description = text;
        });
        await Promise.all(subPromises);
      }

      // 2) Generate activity descriptions (parallel)
      const descPromises = updated.map(async (act, i) => {
        if (!act.name.trim() || act.description.trim()) return;
        const subNames = act.subActivities.map((s) => s.name).filter(Boolean);
        const ctx = [`Atividade macro: ${act.name}`];
        if (subNames.length > 0) ctx.push(`Subatividades: ${subNames.join(", ")}`);
        const text = await callAi("activityDescription", ctx.join("\n"));
        if (text) updated[i].description = text;
      });
      await Promise.all(descPromises);

      // 3) Generate justifications (parallel)
      const justPromises = updated.map(async (act, i) => {
        if (!act.name.trim() || act.justification.trim()) return;
        const ctx = [`Atividade macro: ${act.name}`];
        if (updated[i].description) ctx.push(`Descrição: ${updated[i].description}`);
        const subNames = act.subActivities.map((s) => s.name).filter(Boolean);
        if (subNames.length > 0) ctx.push(`Subatividades: ${subNames.join(", ")}`);
        const text = await callAi("activityJustification", ctx.join("\n"));
        if (text) updated[i].justification = text;
      });
      await Promise.all(justPromises);

      // 4) Generate macro activity dates
      if (fd.executionStartDate && fd.executionEndDate) {
        const activityList = updated.map((a, i) => `${i + 1}. ${a.name}`).join("\n");
        const dateCtx = [
          `Período de execução do projeto: ${fd.executionStartDate} a ${fd.executionEndDate}`,
          `\nAtividades do projeto:\n${activityList}`,
        ].join("\n");
        const dateSuggestion = await callAi("activityDates", dateCtx);

        const dateRegex = /(\d+)\s*:\s*(\d{4}-\d{2}-\d{2})\s*,\s*(\d{4}-\d{2}-\d{2})/g;
        let match;
        while ((match = dateRegex.exec(dateSuggestion)) !== null) {
          const idx = parseInt(match[1]) - 1;
          if (idx >= 0 && idx < updated.length) {
            if (!updated[idx].startDate) updated[idx].startDate = match[2];
            if (!updated[idx].endDate) updated[idx].endDate = match[3];
          }
        }

        // 5) Generate sub-activity dates within each macro activity period
        const subListLines: string[] = [];
        for (let i = 0; i < updated.length; i++) {
          const act = updated[i];
          if (!act.startDate || !act.endDate) continue;
          for (let si = 0; si < act.subActivities.length; si++) {
            const sub = act.subActivities[si];
            if (sub.name.trim()) {
              subListLines.push(`${i + 1}.${si + 1}: ${sub.name}`);
            }
          }
        }

        if (subListLines.length > 0) {
          const actDatesCtx = updated
            .filter((a) => a.startDate && a.endDate)
            .map((a, i) => `Atividade ${i + 1} (${a.name}): ${a.startDate} a ${a.endDate}`)
            .join("\n");

          const subDateCtx = [
            `Período de execução do projeto: ${fd.executionStartDate} a ${fd.executionEndDate}`,
            `\nDatas das atividades macro:\n${actDatesCtx}`,
            `\nSubatividades:\n${subListLines.join("\n")}`,
          ].join("\n");

          const subDateSuggestion = await callAi("subActivityDates", subDateCtx);

          const subDateRegex = /(\d+)\.(\d+)\s*:\s*(\d{4}-\d{2}-\d{2})\s*,\s*(\d{4}-\d{2}-\d{2})/g;
          let subMatch;
          while ((subMatch = subDateRegex.exec(subDateSuggestion)) !== null) {
            const actIdx = parseInt(subMatch[1]) - 1;
            const subIdx = parseInt(subMatch[2]) - 1;
            if (
              actIdx >= 0 && actIdx < updated.length &&
              subIdx >= 0 && subIdx < updated[actIdx].subActivities.length
            ) {
              updated[actIdx].subActivities[subIdx].startDate = subMatch[3];
              updated[actIdx].subActivities[subIdx].endDate = subMatch[4];
            }
          }
        }
      }

      updateField("activities", updated);
    } catch (error) {
      console.error("AI bulk generation error:", error);
    } finally {
      setGeneratingAll(false);
    }
  }, [generatingAll, updateField]);

  function handleClearAll() {
    const cleared = activities.map((act) => ({
      ...act,
      description: "",
      justification: "",
      startDate: "",
      endDate: "",
      subActivities: (act.subActivities || []).map((sub) => ({
        ...sub,
        description: "",
        startDate: undefined,
        endDate: undefined,
      })),
    }));
    updateField("activities", cleared);
  }

  const hasAnyActivityName = activities.some((a) => a.name.trim());
  const hasAnyFilledData = activities.some(
    (a) => a.description || a.justification || a.startDate || a.endDate ||
      (a.subActivities || []).some((s) => s.description)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        8. Plano de Ação
      </h2>
      <p className="text-sm text-gray-600">
        Preencha as 5 atividades macro do projeto com suas subatividades,
        descrições e datas.
      </p>

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          <strong>Dica:</strong> Certifique-se de ter criado as subatividades na
          EAP (Seção 6 — Escopo) antes de preencher esta seção. Os nomes das
          atividades e subatividades da EAP são usados aqui.
        </p>
      </div>

      {/* Generate ALL + Clear buttons */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={handleGenerateAll}
          disabled={generatingAll || !hasAnyActivityName}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-5 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors shadow-sm"
        >
          {generatingAll ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {generatingAll
            ? "Gerando descrições, justificativas e datas..."
            : "Preencher tudo com IA"}
        </button>
        {hasAnyFilledData && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={generatingAll}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={14} />
            Limpar dados
          </button>
        )}
      </div>
      {!hasAnyActivityName && (
        <p className="text-center text-xs text-gray-400">
          Adicione pelo menos uma atividade com nome para usar a IA.
        </p>
      )}

      {activities.map((activity, index) => {
        const isOpen = expanded[index] !== false;

        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
          >
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggleExpanded(index)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-800">
                Atividade {index + 1}: {activity.name || "(sem nome)"}
              </h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
                <div className="pt-4">
                  <Input
                    id={`activity-name-${index}`}
                    label="Nome da Atividade"
                    value={activity.name}
                    onChange={(e) =>
                      handleUpdateActivity(index, "name", e.target.value)
                    }
                    placeholder="Nome da atividade"
                  />
                </div>

                {/* Description with AI button */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label
                      htmlFor={`activity-description-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Descrição
                    </label>
                    <AiFieldButton
                      fieldName="activityDescription"
                      currentContent={buildActivityContext(activity)}
                      onResult={(text) =>
                        handleUpdateActivity(index, "description", text)
                      }
                      disabled={!activity.name.trim()}
                    />
                  </div>
                  <textarea
                    id={`activity-description-${index}`}
                    value={activity.description}
                    onChange={(e) =>
                      handleUpdateActivity(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Descreva a atividade"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Subatividades */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Subatividades
                  </label>
                  {(
                    activity.subActivities || [{ name: "", description: "" }]
                  ).map((sub, subIndex) => (
                    <div
                      key={subIndex}
                      className="rounded-md border border-gray-200 bg-white p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-mono min-w-[40px] font-semibold">
                          {index + 1}.{subIndex + 1}
                        </span>
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) =>
                            handleUpdateSubActivity(
                              index,
                              subIndex,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder={`Nome da subatividade ${index + 1}.${subIndex + 1}`}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        {(activity.subActivities || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSubActivity(index, subIndex)
                            }
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                            title="Remover subatividade"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* Sub-activity description with AI button */}
                      <div className="flex items-start gap-2">
                        <textarea
                          value={sub.description}
                          onChange={(e) =>
                            handleUpdateSubActivity(
                              index,
                              subIndex,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Descrição da subatividade..."
                          rows={2}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <AiFieldButton
                          fieldName="subActivityDescription"
                          currentContent={`Atividade macro: ${activity.name}\nSubatividade: ${sub.name}`}
                          onResult={(text) =>
                            handleUpdateSubActivity(
                              index,
                              subIndex,
                              "description",
                              text
                            )
                          }
                          disabled={!sub.name.trim()}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSubActivity(index)}
                  >
                    + Adicionar Subatividade
                  </Button>
                </div>

                {/* Justification with AI button */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label
                      htmlFor={`activity-justification-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Justificativa
                    </label>
                    <AiFieldButton
                      fieldName="activityJustification"
                      currentContent={buildJustificationContext(activity)}
                      onResult={(text) =>
                        handleUpdateActivity(index, "justification", text)
                      }
                      disabled={!activity.name.trim()}
                    />
                  </div>
                  <textarea
                    id={`activity-justification-${index}`}
                    value={activity.justification}
                    onChange={(e) =>
                      handleUpdateActivity(
                        index,
                        "justification",
                        e.target.value
                      )
                    }
                    placeholder="Justifique a atividade"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id={`activity-start-${index}`}
                    label="Data de Início"
                    type="date"
                    value={activity.startDate}
                    onChange={(e) =>
                      handleUpdateActivity(index, "startDate", e.target.value)
                    }
                  />
                  <Input
                    id={`activity-end-${index}`}
                    label="Data de Fim"
                    type="date"
                    value={activity.endDate}
                    onChange={(e) =>
                      handleUpdateActivity(index, "endDate", e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
