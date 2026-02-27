"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WIZARD_SECTIONS } from "@/lib/constants";
import { usePlanStore } from "@/lib/store";
import { Check, Paperclip, FileSpreadsheet, PanelLeftClose, PanelLeftOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface WizardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function WizardSidebar({ collapsed = false, onToggle }: WizardSidebarProps) {
  const { currentStep, setStep, completedSections } = usePlanStore();
  const [hasMaterials, setHasMaterials] = useState(true); // default true to avoid flash

  const planId = usePlanStore.getState().planId;

  useEffect(() => {
    if (!planId) return;
    fetch(`/api/materials/${planId}`)
      .then((res) => res.json())
      .then((data: unknown[]) => setHasMaterials(Array.isArray(data) && data.length > 0))
      .catch(() => setHasMaterials(true));
  }, [planId]);

  return (
    <aside className={cn(
      "shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-850 flex flex-col transition-all duration-200",
      collapsed ? "w-12" : "w-72"
    )}>
      <div className={cn(
        "sticky top-14 flex-1 overflow-y-auto",
        collapsed ? "p-1.5" : "p-4"
      )}>
        {!collapsed && (
          <>
            {/* Materials link */}
            <Link
              href={`/plans/${planId}/materials`}
              className={cn(
                "mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                hasMaterials
                  ? "border-accent-200 dark:border-accent-800/50 bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-950/50"
                  : "border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50"
              )}
            >
              <Paperclip size={16} />
              Materiais de Contexto
              {!hasMaterials && (
                <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={14} />
                </span>
              )}
            </Link>

            {/* Financeiro link */}
            <Link
              href={`/plans/${planId}/financeiro`}
              className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/30 px-3 py-2.5 text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
            >
              <FileSpreadsheet size={16} />
              Financeiro
            </Link>

            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Seções do Plano
            </h2>
          </>
        )}

        {collapsed && (
          <div className="flex flex-col items-center gap-1 mb-2">
            <Link
              href={`/plans/${planId}/materials`}
              title="Materiais de Contexto"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/30 transition-colors"
            >
              <Paperclip size={16} />
              {!hasMaterials && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
              )}
            </Link>
            <Link
              href={`/plans/${planId}/financeiro`}
              title="Financeiro"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
            >
              <FileSpreadsheet size={16} />
            </Link>
            <div className="my-1 w-6 border-t border-gray-200 dark:border-gray-700" />
          </div>
        )}

        <nav className={collapsed ? "flex flex-col items-center gap-1" : "space-y-1"}>
          {WIZARD_SECTIONS.map((section, index) => {
            const isActive = currentStep === index;
            const isCompleted = completedSections.includes(section.number);

            return (
              <button
                key={section.number}
                onClick={() => setStep(index)}
                title={collapsed ? section.title : undefined}
                className={cn(
                  "flex items-center text-left text-sm transition-colors",
                  collapsed
                    ? "h-8 w-8 justify-center rounded-lg"
                    : "w-full gap-3 rounded-lg px-3 py-2.5",
                  isActive
                    ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isActive
                      ? "bg-primary-600 text-white"
                      : isCompleted
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  )}
                >
                  {isCompleted ? <Check size={14} /> : section.number}
                </span>
                {!collapsed && <span className="truncate">{section.title}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toggle button at bottom */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
          title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
    </aside>
  );
}
