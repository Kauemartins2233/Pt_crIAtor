"use client";

import { usePlanStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { ActivityFormData } from "@/types/plan";

function createEmptyActivity(orderIndex: number): ActivityFormData {
  return {
    orderIndex,
    name: "",
    description: "",
    justification: "",
    startDate: "",
    endDate: "",
    activeMonths: [],
  };
}

export function Step08PlanoAcao() {
  const { formData, updateField } = usePlanStore();
  const activities = formData.activities;

  function handleAddActivity() {
    const newActivity = createEmptyActivity(activities.length);
    updateField("activities", [...activities, newActivity]);
  }

  function handleRemoveActivity(index: number) {
    const updated = activities
      .filter((_, i) => i !== index)
      .map((act, i) => ({ ...act, orderIndex: i }));
    updateField("activities", updated);
  }

  function handleUpdateActivity(
    index: number,
    field: keyof ActivityFormData,
    value: string
  ) {
    const updated = activities.map((act, i) =>
      i === index ? { ...act, [field]: value } : act
    );
    updateField("activities", updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        8. Plano de Ação
      </h2>
      <p className="text-sm text-gray-600">
        Adicione as atividades do projeto com suas descrições e datas.
      </p>

      {activities.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          Nenhuma atividade adicionada.
        </p>
      )}

      {activities.map((activity, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Atividade {index + 1}
            </h3>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveActivity(index)}
            >
              Remover
            </Button>
          </div>

          <Input
            id={`activity-name-${index}`}
            label="Nome da Atividade"
            value={activity.name}
            onChange={(e) =>
              handleUpdateActivity(index, "name", e.target.value)
            }
            placeholder="Nome da atividade"
          />

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

          <Textarea
            id={`activity-justification-${index}`}
            label="Justificativa"
            value={activity.justification}
            onChange={(e) =>
              handleUpdateActivity(index, "justification", e.target.value)
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
      ))}

      <Button type="button" variant="outline" onClick={handleAddActivity}>
        + Adicionar Atividade
      </Button>
    </div>
  );
}
