"use client";

import { usePlanStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/Checkbox";
import { ACTIVITY_TYPES } from "@/lib/constants";

export function Step03TipoAtividade() {
  const { formData, updateField } = usePlanStore();

  function handleToggle(value: string, checked: boolean) {
    const current = formData.activityTypes;
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    updateField("activityTypes", updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        3. Tipo de Atividade de PD&I
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Selecione o(s) tipo(s) de atividade aplicáveis.
      </p>

      <div className="space-y-3">
        {ACTIVITY_TYPES.map((type) => (
          <Checkbox
            key={type.value}
            label={type.label}
            checked={formData.activityTypes.includes(type.value)}
            onChange={(checked) => handleToggle(type.value, checked)}
          />
        ))}
      </div>
    </div>
  );
}
