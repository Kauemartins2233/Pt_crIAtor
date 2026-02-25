import type { JSONContent } from "@tiptap/react";

export interface ActivityFormData {
  id?: string;
  orderIndex: number;
  name: string;
  description: string;
  justification: string;
  startDate: string;
  endDate: string;
  activeMonths: number[];
}

export interface ProfessionalFormData {
  id?: string;
  orderIndex: number;
  name: string;
  education: string;
  degree: string;
  miniCv: string;
  activityAssignment: string;
  hiringType: string;
  directIndirect: string;
}

export interface IndicatorData {
  [key: string]: { enabled: boolean; quantity: number };
}

export interface CronogramaCell {
  activityIndex: number;
  month: number;
  active: boolean;
}

export interface PlanFormData {
  // Cabeçalho: Logos e nomes das instituições
  partnerName: string;
  partnerLogo: string;
  foundationName: string;
  foundationLogo: string;

  // Seção 1: Identificação
  projectName: string;
  projectNickname: string;
  coordinatorInstitution: string;
  coordinatorFoxconn: string;
  totalValue: number | null;
  totalValueWritten: string;
  executionStartDate: string;
  executionEndDate: string;
  validityStartDate: string;
  validityEndDate: string;

  // Seção 2: Tipo de Projeto
  projectTypes: string[];

  // Seção 3: Tipo de Atividade
  activityTypes: string[];

  // Seções 4-7: Texto rico
  motivacao: JSONContent | null;
  objetivosGerais: JSONContent | null;
  objetivosEspecificos: JSONContent | null;
  escopo: JSONContent | null;
  estrategias: JSONContent | null;

  // Seção 8: Plano de Ação
  activities: ActivityFormData[];

  // Seção 9: Recursos Humanos
  professionals: ProfessionalFormData[];

  // Seção 10: Indicadores
  indicators: IndicatorData;

  // Seções 11, 12, 14, 15, 17: Texto rico
  inovadoras: JSONContent | null;
  resultados: JSONContent | null;
  trlMrlLevel: number | null;
  desafios: JSONContent | null;
  solucao: JSONContent | null;
  complementares: JSONContent | null;

  // Seção 13: Cronograma
  cronogramaOverrides: CronogramaCell[];
}

export const defaultPlanFormData: PlanFormData = {
  partnerName: "",
  partnerLogo: "",
  foundationName: "",
  foundationLogo: "",
  projectName: "",
  projectNickname: "",
  coordinatorInstitution: "",
  coordinatorFoxconn: "",
  totalValue: null,
  totalValueWritten: "",
  executionStartDate: "",
  executionEndDate: "",
  validityStartDate: "",
  validityEndDate: "",
  projectTypes: [],
  activityTypes: [],
  motivacao: null,
  objetivosGerais: null,
  objetivosEspecificos: null,
  escopo: null,
  estrategias: null,
  activities: [],
  professionals: [],
  indicators: {},
  inovadoras: null,
  resultados: null,
  trlMrlLevel: null,
  desafios: null,
  solucao: null,
  complementares: null,
  cronogramaOverrides: [],
};
