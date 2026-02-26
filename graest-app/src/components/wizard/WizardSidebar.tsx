"use client";

import { cn } from "@/lib/utils";
import { WIZARD_SECTIONS } from "@/lib/constants";
import { usePlanStore } from "@/lib/store";
import { Check, Paperclip } from "lucide-react";
import Link from "next/link";

export function WizardSidebar() {
  const { currentStep, setStep, completedSections } = usePlanStore();

  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-850">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        {/* Materials link */}
        <Link
          href={`/plans/${usePlanStore.getState().planId}/materials`}
          className="mb-4 flex items-center gap-2 rounded-lg border border-accent-200 dark:border-accent-800/50 bg-accent-50 dark:bg-accent-950/30 px-3 py-2.5 text-sm font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-950/50 transition-colors"
        >
          <Paperclip size={16} />
          Materiais de Contexto
        </Link>

        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Seções do Plano
        </h2>
        <nav className="space-y-1">
          {WIZARD_SECTIONS.map((section, index) => {
            const isActive = currentStep === index;
            const isCompleted = completedSections.includes(section.number);

            return (
              <button
                key={section.number}
                onClick={() => setStep(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
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
                <span className="truncate">{section.title}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
