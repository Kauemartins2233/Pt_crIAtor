import type { JSONContent } from "@tiptap/react";

export interface SubActivity {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
}

/** Normalize sub-activities from old string[] format or new object[] format */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSubActivities(subs: any): SubActivity[] {
  if (!subs || !Array.isArray(subs) || subs.length === 0) {
    return [{ name: "", description: "" }];
  }
  return subs.map((s: unknown) => {
    if (typeof s === "string") return { name: s, description: "" };
    if (s && typeof s === "object" && "name" in s) return s as SubActivity;
    return { name: "", description: "" };
  });
}

export interface ActivityFormData {
  id?: string;
  orderIndex: number;
  name: string;
  description: string;
  justification: string;
  startDate: string;
  endDate: string;
  activeMonths: number[];
  subActivities: SubActivity[];
}

export interface StaffMember {
  id: string;
  name: string;
  education: string;
  degree: string;
  miniCv: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfessionalFormData {
  id?: string;
  staffMemberId?: string;
  orderIndex: number;
  name: string;
  education: string;
  degree: string;
  miniCv: string;
  roleInProject: string;
  activityAssignment: string;
  hiringType: string;
  directIndirect: string;
}

export interface IndicatorData {
  [key: string]: { enabled: boolean; quantity: number };
}

export interface CronogramaCell {
  activityIndex: number;
  subActivityIndex?: number;
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
  useModulosApproach: boolean;
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
  useModulosApproach: false,
  escopo: null,
  estrategias: null,
  activities: [
    { orderIndex: 0, name: "Planejamento, Coordenação e Gestão do Projeto", description: "Esta atividade compreende a estruturação estratégica, administrativa e técnica do projeto, garantindo sua execução conforme escopo aprovado, prazos estabelecidos e orçamento previsto. Abrange as etapas de inicialização, organização da equipe, gestão de riscos, controle financeiro e monitoramento contínuo da evolução técnica.", justification: "", startDate: "", endDate: "", activeMonths: [], subActivities: [{ name: "", description: "" }] },
    { orderIndex: 1, name: "Levantamento de Requisitos", description: "", justification: "", startDate: "", endDate: "", activeMonths: [], subActivities: [{ name: "", description: "" }] },
    { orderIndex: 2, name: "Pesquisa Científica e Desenvolvimento", description: "", justification: "", startDate: "", endDate: "", activeMonths: [], subActivities: [{ name: "", description: "" }] },
    { orderIndex: 3, name: "Testes, Ajuste e Validação do Software", description: "", justification: "", startDate: "", endDate: "", activeMonths: [], subActivities: [{ name: "", description: "" }] },
    { orderIndex: 4, name: "Integração, Treinamento, Implementação e Homologação do projeto", description: "", justification: "", startDate: "", endDate: "", activeMonths: [], subActivities: [{ name: "", description: "" }] },
  ],
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
