"use client";

import { usePlanStore } from "@/lib/store";
import { WIZARD_SECTIONS } from "@/lib/constants";
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
  const { currentStep } = usePlanStore();
  const section = WIZARD_SECTIONS[currentStep];
  const StepComponent = STEP_COMPONENTS[currentStep];

  if (!StepComponent || !section) {
    return <div className="p-8 text-gray-500">Seção não encontrada</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <span className="text-sm font-medium text-blue-600">
          Seção {section.number}
        </span>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {section.title}
        </h1>
      </div>
      <StepComponent />
    </div>
  );
}
