import { create } from "zustand";
import type { PlanFormData } from "@/types/plan";
import { defaultPlanFormData } from "@/types/plan";

interface PlanStore {
  planId: string | null;
  currentStep: number;
  formData: PlanFormData;
  isDirty: boolean;
  lastSaved: Date | null;
  completedSections: number[];

  setPlanId: (id: string | null) => void;
  setStep: (step: number) => void;
  updateField: <K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => void;
  updateFields: (fields: Partial<PlanFormData>) => void;
  markSectionComplete: (section: number) => void;
  markSectionIncomplete: (section: number) => void;
  loadPlan: (id: string, data: PlanFormData, completedSections?: number[]) => void;
  resetPlan: () => void;
  markSaved: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  planId: null,
  currentStep: 0,
  formData: { ...defaultPlanFormData },
  isDirty: false,
  lastSaved: null,
  completedSections: [],

  setPlanId: (id) => set({ planId: id }),

  setStep: (step) => set({ currentStep: step }),

  updateField: (key, value) =>
    set((state) => ({
      formData: { ...state.formData, [key]: value },
      isDirty: true,
    })),

  updateFields: (fields) =>
    set((state) => ({
      formData: { ...state.formData, ...fields },
      isDirty: true,
    })),

  markSectionComplete: (section) =>
    set((state) => ({
      completedSections: state.completedSections.includes(section)
        ? state.completedSections
        : [...state.completedSections, section],
    })),

  markSectionIncomplete: (section) =>
    set((state) => ({
      completedSections: state.completedSections.filter((s) => s !== section),
    })),

  loadPlan: (id, data, completedSections) =>
    set({
      planId: id,
      formData: data,
      isDirty: false,
      completedSections: completedSections ?? [],
      currentStep: 0,
    }),

  resetPlan: () =>
    set({
      planId: null,
      currentStep: 0,
      formData: { ...defaultPlanFormData },
      isDirty: false,
      lastSaved: null,
      completedSections: [],
    }),

  markSaved: () =>
    set({
      isDirty: false,
      lastSaved: new Date(),
    }),
}));
