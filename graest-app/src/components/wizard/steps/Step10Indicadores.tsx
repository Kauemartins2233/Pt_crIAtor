"use client";

import { usePlanStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { INDICATORS } from "@/lib/constants";
import type { IndicatorData } from "@/types/plan";

export function Step10Indicadores() {
  const { formData, updateField } = usePlanStore();
  const indicators = formData.indicators;

  function handleToggle(key: string, enabled: boolean) {
    const updated: IndicatorData = {
      ...indicators,
      [key]: {
        enabled,
        quantity: indicators[key]?.quantity ?? 0,
      },
    };
    updateField("indicators", updated);
  }

  function handleQuantity(key: string, quantity: number) {
    const updated: IndicatorData = {
      ...indicators,
      [key]: {
        enabled: indicators[key]?.enabled ?? true,
        quantity,
      },
    };
    updateField("indicators", updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        10. Indicadores de Resultados
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Selecione os indicadores aplicáveis e informe a quantidade esperada.
      </p>

      <div className="space-y-4">
        {INDICATORS.map((indicator) => {
          const data = indicators[indicator.key];
          const enabled = data?.enabled ?? false;

          return (
            <div
              key={indicator.key}
              className="flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800 p-3"
            >
              <Checkbox
                label={indicator.label}
                checked={enabled}
                onChange={(checked) => handleToggle(indicator.key, checked)}
                className="flex-1"
              />
              {enabled && (
                <div className="w-28 shrink-0">
                  <Input
                    id={`indicator-qty-${indicator.key}`}
                    type="number"
                    min={0}
                    value={data?.quantity ?? 0}
                    onChange={(e) =>
                      handleQuantity(
                        indicator.key,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    placeholder="Qtd."
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
