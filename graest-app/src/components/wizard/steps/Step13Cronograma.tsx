"use client";

import { usePlanStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CronogramaCell } from "@/types/plan";

const MONTHS = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

export function Step13Cronograma() {
  const { formData, updateField } = usePlanStore();
  const activities = formData.activities;
  const overrides = formData.cronogramaOverrides;

  function isMonthActive(activityIndex: number, month: number): boolean {
    // Check overrides first
    const override = overrides.find(
      (c) => c.activityIndex === activityIndex && c.month === month
    );
    if (override) return override.active;

    // Check if the activity has this month in its activeMonths
    const activity = activities[activityIndex];
    if (activity?.activeMonths?.includes(month)) return true;

    return false;
  }

  function handleToggle(activityIndex: number, month: number, active: boolean) {
    // Remove existing override for this cell
    const filtered = overrides.filter(
      (c) => !(c.activityIndex === activityIndex && c.month === month)
    );

    const newCell: CronogramaCell = { activityIndex, month, active };
    updateField("cronogramaOverrides", [...filtered, newCell]);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">13. Cronograma</h2>
      <p className="text-sm text-gray-600">
        Marque os meses em que cada atividade será executada.
      </p>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Nenhuma atividade cadastrada. Adicione atividades na seção 8 (Plano de
          Ação) primeiro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[200px]">
                  Atividade
                </th>
                {MONTHS.map((month) => (
                  <th
                    key={month}
                    className="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, actIndex) => (
                <tr key={actIndex} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-2 text-gray-700">
                    <span className="font-medium">{actIndex + 1}.</span>{" "}
                    {activity.name || "(sem nome)"}
                  </td>
                  {MONTHS.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const active = isMonthActive(actIndex, month);

                    return (
                      <td
                        key={month}
                        className="border border-gray-200 px-2 py-2 text-center"
                      >
                        <Checkbox
                          label=""
                          checked={active}
                          onChange={(checked) =>
                            handleToggle(actIndex, month, checked)
                          }
                          className="justify-center"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
