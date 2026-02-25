"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/store";
import { WIZARD_SECTIONS } from "@/lib/constants";
import { WizardSidebar } from "./WizardSidebar";
import { StepRenderer } from "./StepRenderer";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

export function WizardShell() {
  const { planId, currentStep, setStep, isDirty, lastSaved } = usePlanStore();
  const totalSteps = WIZARD_SECTIONS.length;
  const [exporting, setExporting] = useState(false);

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
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <WizardSidebar />
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl">
            <StepRenderer />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-3">
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

            <div className="flex items-center gap-4">
              {lastSaved && (
                <span className="text-xs text-gray-400">
                  Salvo {lastSaved.toLocaleTimeString("pt-BR")}
                </span>
              )}
              {isDirty && (
                <span className="text-xs text-amber-500">Alterações não salvas</span>
              )}
              <span className="text-sm text-gray-500">
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
