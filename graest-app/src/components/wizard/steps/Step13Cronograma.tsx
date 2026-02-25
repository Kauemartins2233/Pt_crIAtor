"use client";

import { usePlanStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CronogramaCell } from "@/types/plan";

const MONTHS = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

export function Step13Cronograma() {
  const { formData, updateField } = usePlanStore();
  const activities = formData.activities;
  const overrides = formData.cronogramaOverrides;

  function isMonthActive(
    activityIndex: number,
    subActivityIndex: number | undefined,
    month: number
  ): boolean {
    const override = overrides.find(
      (c) =>
        c.activityIndex === activityIndex &&
        c.subActivityIndex === subActivityIndex &&
        c.month === month
    );
    if (override) return override.active;
    return false;
  }

  function handleToggle(
    activityIndex: number,
    subActivityIndex: number | undefined,
    month: number,
    active: boolean
  ) {
    const filtered = overrides.filter(
      (c) =>
        !(
          c.activityIndex === activityIndex &&
          c.subActivityIndex === subActivityIndex &&
          c.month === month
        )
    );

    const newCell: CronogramaCell = {
      activityIndex,
      subActivityIndex,
      month,
      active,
    };
    updateField("cronogramaOverrides", [...filtered, newCell]);
  }

  // Build flat rows: activity headers + subactivity rows
  type RowData =
    | { type: "activity"; actIndex: number; name: string }
    | {
        type: "sub";
        actIndex: number;
        subIndex: number;
        label: string;
      };

  const rows: RowData[] = [];
  for (let actIdx = 0; actIdx < activities.length; actIdx++) {
    const act = activities[actIdx];
    rows.push({
      type: "activity",
      actIndex: actIdx,
      name: act.name || "(sem nome)",
    });
    const subs = act.subActivities || [];
    for (let subIdx = 0; subIdx < subs.length; subIdx++) {
      const subText = subs[subIdx] || `Subatividade ${actIdx + 1}.${subIdx + 1}`;
      rows.push({
        type: "sub",
        actIndex: actIdx,
        subIndex: subIdx,
        label: `${actIdx + 1}.${subIdx + 1} ${subText}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">13. Cronograma</h2>
      <p className="text-sm text-gray-600">
        Marque os meses em que cada atividade/subatividade será executada.
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
                <th className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[250px]">
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
              {rows.map((row, rowIdx) => {
                if (row.type === "activity") {
                  return (
                    <tr key={`act-${row.actIndex}`} className="bg-gray-100">
                      <td className="sticky left-0 z-10 bg-gray-100 border border-gray-200 px-3 py-2 text-gray-800 font-semibold">
                        {row.actIndex + 1}. {row.name}
                      </td>
                      {MONTHS.map((_, monthIndex) => (
                        <td
                          key={monthIndex}
                          className="border border-gray-200 px-2 py-2 bg-gray-100"
                        />
                      ))}
                    </tr>
                  );
                }

                return (
                  <tr key={`sub-${row.actIndex}-${row.subIndex}`} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-2 text-gray-600 pl-6 text-xs">
                      {row.label}
                    </td>
                    {MONTHS.map((_, monthIndex) => {
                      const month = monthIndex + 1;
                      const active = isMonthActive(
                        row.actIndex,
                        row.subIndex,
                        month
                      );

                      return (
                        <td
                          key={month}
                          className="border border-gray-200 px-2 py-2 text-center"
                        >
                          <Checkbox
                            label=""
                            checked={active}
                            onChange={(checked) =>
                              handleToggle(
                                row.actIndex,
                                row.subIndex,
                                month,
                                checked
                              )
                            }
                            className="justify-center"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
