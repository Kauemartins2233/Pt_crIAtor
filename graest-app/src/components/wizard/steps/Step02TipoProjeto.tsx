"use client";

import { usePlanStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/Checkbox";
import { PROJECT_TYPES } from "@/lib/constants";

export function Step02TipoProjeto() {
  const { formData, updateField } = usePlanStore();

  function handleToggle(value: string, checked: boolean) {
    const current = formData.projectTypes;
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    updateField("projectTypes", updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        2. Tipo de Projeto
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Selecione o(s) tipo(s) de projeto aplicáveis.
      </p>

      <div className="space-y-3">
        {PROJECT_TYPES.map((type) => (
          <Checkbox
            key={type.value}
            label={type.label}
            checked={formData.projectTypes.includes(type.value)}
            onChange={(checked) => handleToggle(type.value, checked)}
          />
        ))}
      </div>
    </div>
  );
}
