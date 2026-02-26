"use client";

import { usePlanStore } from "@/lib/store";
import { WIZARD_SECTIONS } from "@/lib/constants";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step00Cabecalho } from "./steps/Step00Cabecalho";
import { Step01Identificacao } from "./steps/Step01Identificacao";
import { Step02TipoProjeto } from "./steps/Step02TipoProjeto";
import { Step03TipoAtividade } from "./steps/Step03TipoAtividade";
import { Step04Motivacao } from "./steps/Step04Motivacao";
import { Step05Objetivos } from "./steps/Step05Objetivos";
import { Step06Escopo } from "./steps/Step06Escopo";
import { Step07Estrategias } from "./steps/Step07Estrategias";
import { Step08PlanoAcao } from "./steps/Step08PlanoAcao";
import { Step09RecursosHumanos } from "./steps/Step09RecursosHumanos";
import { Step10Indicadores } from "./steps/Step10Indicadores";
import { Step11Inovadoras } from "./steps/Step11Inovadoras";
import { Step12Resultados } from "./steps/Step12Resultados";
import { Step13Cronograma } from "./steps/Step13Cronograma";
import { Step14Desafios } from "./steps/Step14Desafios";
import { Step15Solucao } from "./steps/Step15Solucao";
import { Step17Complementares } from "./steps/Step17Complementares";

const STEP_COMPONENTS = [
  Step00Cabecalho,
  Step01Identificacao,
  Step02TipoProjeto,
  Step03TipoAtividade,
  Step04Motivacao,
  Step05Objetivos,
  Step06Escopo,
  Step07Estrategias,
  Step08PlanoAcao,
  Step09RecursosHumanos,
  Step10Indicadores,
  Step11Inovadoras,
  Step12Resultados,
  Step13Cronograma,
  Step14Desafios,
  Step15Solucao,
  Step17Complementares,
];

export function StepRenderer() {
  const { currentStep, completedSections, markSectionComplete, markSectionIncomplete } = usePlanStore();
  const section = WIZARD_SECTIONS[currentStep];
  const StepComponent = STEP_COMPONENTS[currentStep];

  if (!StepComponent || !section) {
    return <div className="p-8 text-gray-500">Seção não encontrada</div>;
  }

  const isCompleted = completedSections.includes(section.number);

  const toggleComplete = () => {
    if (isCompleted) {
      markSectionIncomplete(section.number);
    } else {
      markSectionComplete(section.number);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <span className="text-sm font-medium text-primary-600">
          Seção {section.number}
        </span>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {section.title}
        </h1>
      </div>
      <StepComponent />

      {/* Mark section as complete */}
      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          onClick={toggleComplete}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-sm font-medium transition-all",
            isCompleted
              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50"
              : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface-800 text-gray-500 dark:text-gray-400 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-950/20"
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
              isCompleted
                ? "bg-green-500 text-white"
                : "border-2 border-gray-300 dark:border-gray-500"
            )}
          >
            {isCompleted ? <Check size={14} /> : <Circle size={8} className="text-transparent" />}
          </span>
          {isCompleted ? "Seção concluída" : "Marcar seção como concluída"}
        </button>
      </div>
    </div>
  );
}
