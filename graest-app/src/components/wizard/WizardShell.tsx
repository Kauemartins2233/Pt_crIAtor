"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/store";
import { WIZARD_SECTIONS } from "@/lib/constants";
import { WizardSidebar } from "./WizardSidebar";
import { StepRenderer } from "./StepRenderer";
import { Button } from "@/components/ui/Button";
import { Check, ChevronLeft, ChevronRight, Circle, Download } from "lucide-react";

export function WizardShell() {
  const { planId, currentStep, setStep, isDirty, lastSaved, completedSections, markSectionComplete, markSectionIncomplete } = usePlanStore();
  const totalSteps = WIZARD_SECTIONS.length;
  const [exporting, setExporting] = useState(false);

  const currentSection = WIZARD_SECTIONS[currentStep];
  const isCompleted = currentSection ? completedSections.includes(currentSection.number) : false;
  const toggleComplete = () => {
    if (!currentSection) return;
    if (isCompleted) markSectionIncomplete(currentSection.number);
    else markSectionComplete(currentSection.number);
  };

  const handlePrev = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setStep(currentStep + 1);
  };

  const handleExportDocx = async () => {
    if (!planId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${planId}/docx`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plano-de-trabalho.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Erro ao exportar documento.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <WizardSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="mx-auto max-w-4xl">
            <StepRenderer />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-850 px-8 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentStep === totalSteps - 1}
              >
                Próximo
                <ChevronRight size={16} />
              </Button>
            </div>

            <button
              onClick={toggleComplete}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isCompleted
                  ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-950/60"
                  : "bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400"
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : "border border-gray-300 dark:border-gray-500"
              }`}>
                {isCompleted ? <Check size={10} /> : <Circle size={6} className="text-transparent" />}
              </span>
              {isCompleted ? "Concluída" : "Marcar concluída"}
            </button>

            <div className="flex items-center gap-4">
              {lastSaved && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Salvo {lastSaved.toLocaleTimeString("pt-BR")}
                </span>
              )}
              {isDirty && (
                <span className="text-xs text-amber-500">Alterações não salvas</span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} / {totalSteps}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportDocx}
                disabled={exporting || !planId}
              >
                <Download size={14} />
                {exporting ? "Exportando..." : "Exportar DOCX"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
