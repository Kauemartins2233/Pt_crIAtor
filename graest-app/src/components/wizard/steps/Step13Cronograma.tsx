"use client";

import { useEffect, useRef } from "react";
import { usePlanStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/Checkbox";
import type { CronogramaCell } from "@/types/plan";

const MONTHS = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

/**
 * Given the project execution start date and an activity's start/end dates,
 * return an array of month numbers (1-12) that the activity spans.
 * Month 1 = first month of execution, Month 12 = last month.
 */
function datesToMonths(
  executionStart: string,
  actStart: string,
  actEnd: string
): number[] {
  if (!executionStart || !actStart || !actEnd) return [];

  const execDate = new Date(executionStart + "T00:00:00");
  const startDate = new Date(actStart + "T00:00:00");
  const endDate = new Date(actEnd + "T00:00:00");

  if (isNaN(execDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return [];
  }

  // Calculate month offset from execution start
  const startMonth =
    (startDate.getFullYear() - execDate.getFullYear()) * 12 +
    (startDate.getMonth() - execDate.getMonth()) +
    1; // 1-based

  const endMonth =
    (endDate.getFullYear() - execDate.getFullYear()) * 12 +
    (endDate.getMonth() - execDate.getMonth()) +
    1;

  const months: number[] = [];
  for (let m = Math.max(1, startMonth); m <= Math.min(12, endMonth); m++) {
    months.push(m);
  }
  return months;
}

export function Step13Cronograma() {
  const { formData, updateField } = usePlanStore();
  const activities = formData.activities;
  const overrides = formData.cronogramaOverrides;
  const autoPopulated = useRef(false);

  // Auto-populate cronograma from activity dates when entering this step
  useEffect(() => {
    if (autoPopulated.current) return;
    if (!formData.executionStartDate) return;

    // Only auto-populate if the cronograma is empty or has very few entries
    if (overrides.length > 0) {
      autoPopulated.current = true;
      return;
    }

    const cells: CronogramaCell[] = [];

    for (let actIdx = 0; actIdx < activities.length; actIdx++) {
      const act = activities[actIdx];
      if (!act.startDate || !act.endDate) continue;

      const subs = act.subActivities || [];
      for (let subIdx = 0; subIdx < subs.length; subIdx++) {
        const sub = subs[subIdx];
        // Use sub-activity specific dates if available, otherwise fall back to macro dates
        const subStart = sub.startDate || act.startDate;
        const subEnd = sub.endDate || act.endDate;
        const months = datesToMonths(formData.executionStartDate, subStart, subEnd);

        for (const month of months) {
          cells.push({
            activityIndex: actIdx,
            subActivityIndex: subIdx,
            month,
            active: true,
          });
        }
      }
    }

    if (cells.length > 0) {
      updateField("cronogramaOverrides", cells);
    }
    autoPopulated.current = true;
  }, [formData.executionStartDate, activities, overrides.length, updateField]);

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

  /**
   * Convert a relative month number (1-12) to a YYYY-MM-DD date string
   * based on the project execution start date.
   * If `end` is true, returns the last day of that month.
   */
  function monthToDate(month: number, end: boolean): string {
    if (!formData.executionStartDate) return "";
    const exec = new Date(formData.executionStartDate + "T00:00:00");
    const target = new Date(exec.getFullYear(), exec.getMonth() + (month - 1), 1);
    if (end) {
      // Last day of the month
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0);
      return last.toISOString().slice(0, 10);
    }
    return target.toISOString().slice(0, 10);
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
    const newOverrides = [...filtered, newCell];
    updateField("cronogramaOverrides", newOverrides);

    // Sync back: update sub-activity dates + macro activity dates
    if (formData.executionStartDate) {
      const updatedActivities = activities.map((act, i) => {
        if (i !== activityIndex) return act;

        const newAct = { ...act, subActivities: [...(act.subActivities || []).map((s) => ({ ...s }))] };

        // Update the specific sub-activity's dates
        if (subActivityIndex !== undefined) {
          const subMonths = new Set<number>();
          for (const c of newOverrides) {
            if (c.activityIndex === activityIndex && c.subActivityIndex === subActivityIndex && c.active) {
              subMonths.add(c.month);
            }
          }
          const subSorted = [...subMonths].sort((a, b) => a - b);
          if (subSorted.length === 0) {
            newAct.subActivities[subActivityIndex].startDate = "";
            newAct.subActivities[subActivityIndex].endDate = "";
          } else {
            newAct.subActivities[subActivityIndex].startDate = monthToDate(subSorted[0], false);
            newAct.subActivities[subActivityIndex].endDate = monthToDate(subSorted[subSorted.length - 1], true);
          }
        }

        // Recalculate macro activity dates from all sub-activity months
        const allMonths = new Set<number>();
        for (const c of newOverrides) {
          if (c.activityIndex === activityIndex && c.active) {
            allMonths.add(c.month);
          }
        }
        const sorted = [...allMonths].sort((a, b) => a - b);
        if (sorted.length === 0) {
          newAct.startDate = "";
          newAct.endDate = "";
        } else {
          newAct.startDate = monthToDate(sorted[0], false);
          newAct.endDate = monthToDate(sorted[sorted.length - 1], true);
        }

        return newAct;
      });
      updateField("activities", updatedActivities);
    }
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
      const sub = subs[subIdx];
      const subText = (typeof sub === "object" ? sub.name : sub) || `Subatividade ${actIdx + 1}.${subIdx + 1}`;
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
        As datas do Plano de Ação são sincronizadas automaticamente.
      </p>

      {overrides.length > 0 && (
        <button
          type="button"
          onClick={() => updateField("cronogramaOverrides", [])}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
        >
          Desmarcar todos
        </button>
      )}

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
              {rows.map((row) => {
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
