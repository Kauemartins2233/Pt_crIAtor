"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { ActivityFormData } from "@/types/plan";

export function Step08PlanoAcao() {
  const { formData, updateField } = usePlanStore();
  const activities = formData.activities;

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
    value: string
  ) {
    const updated = activities.map((act, i) => {
      if (i !== actIndex) return act;
      const subs = act.subActivities || [""];
      const newSubs = [...subs];
      newSubs[subIndex] = value;
      return { ...act, subActivities: newSubs };
    });
    updateField("activities", updated);
  }

  function handleAddSubActivity(actIndex: number) {
    const updated = activities.map((act, i) => {
      if (i !== actIndex) return act;
      return { ...act, subActivities: [...(act.subActivities || [""]), ""] };
    });
    updateField("activities", updated);
  }

  function handleRemoveSubActivity(actIndex: number, subIndex: number) {
    const updated = activities.map((act, i) => {
      if (i !== actIndex) return act;
      const subs = act.subActivities || [""];
      if (subs.length <= 1) return act; // Keep at least one
      const newSubs = subs.filter((_, j) => j !== subIndex);
      return { ...act, subActivities: newSubs };
    });
    updateField("activities", updated);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        8. Plano de Ação
      </h2>
      <p className="text-sm text-gray-600">
        Preencha as 5 atividades macro do projeto com suas subatividades,
        descrições e datas.
      </p>

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

                <Textarea
                  id={`activity-description-${index}`}
                  label="Descrição"
                  value={activity.description}
                  onChange={(e) =>
                    handleUpdateActivity(index, "description", e.target.value)
                  }
                  placeholder="Descreva a atividade"
                  rows={3}
                />

                {/* Subatividades */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Subatividades
                  </label>
                  {(activity.subActivities || [""]).map((sub, subIndex) => (
                    <div key={subIndex} className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 font-mono min-w-[40px]">
                        {index + 1}.{subIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) =>
                          handleUpdateSubActivity(
                            index,
                            subIndex,
                            e.target.value
                          )
                        }
                        placeholder={`Subatividade ${index + 1}.${
                          subIndex + 1
                        }`}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                <Textarea
                  id={`activity-justification-${index}`}
                  label="Justificativa"
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
                />

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
