"use client";

import { cn } from "@/lib/utils";
import { WIZARD_SECTIONS } from "@/lib/constants";
import { usePlanStore } from "@/lib/store";
import { Check, Paperclip } from "lucide-react";
import Link from "next/link";

export function WizardSidebar() {
  const { currentStep, setStep, completedSections } = usePlanStore();

  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 bg-white">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        {/* Materials link */}
        <Link
          href={`/plans/${usePlanStore.getState().planId}/materials`}
          className="mb-4 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
        >
          <Paperclip size={16} />
          Materiais de Contexto
        </Link>

        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
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
