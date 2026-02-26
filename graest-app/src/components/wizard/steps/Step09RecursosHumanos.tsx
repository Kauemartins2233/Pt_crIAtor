"use client";

import { usePlanStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { HIRING_TYPES, DIRECT_INDIRECT } from "@/lib/constants";
import type { ProfessionalFormData } from "@/types/plan";

function createEmptyProfessional(orderIndex: number): ProfessionalFormData {
  return {
    orderIndex,
    name: "",
    education: "",
    degree: "",
    miniCv: "",
    activityAssignment: "",
    hiringType: "",
    directIndirect: "",
  };
}

export function Step09RecursosHumanos() {
  const { formData, updateField } = usePlanStore();
  const professionals = formData.professionals;

  function handleAdd() {
    const newProfessional = createEmptyProfessional(professionals.length);
    updateField("professionals", [...professionals, newProfessional]);
  }

  function handleRemove(index: number) {
    const updated = professionals
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, orderIndex: i }));
    updateField("professionals", updated);
  }

  function handleUpdate(
    index: number,
    field: keyof ProfessionalFormData,
    value: string
  ) {
    const updated = professionals.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    updateField("professionals", updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        9. Recursos Humanos
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Adicione os profissionais envolvidos no projeto.
      </p>

      {professionals.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          Nenhum profissional adicionado.
        </p>
      )}

      {professionals.map((professional, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800 p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profissional {index + 1}
            </h3>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemove(index)}
            >
              Remover
            </Button>
          </div>

          <Input
            id={`prof-name-${index}`}
            label="Nome"
            value={professional.name}
            onChange={(e) => handleUpdate(index, "name", e.target.value)}
            placeholder="Nome do profissional"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id={`prof-education-${index}`}
              label="Formação"
              value={professional.education}
              onChange={(e) =>
                handleUpdate(index, "education", e.target.value)
              }
              placeholder="Área de formação"
            />
            <Input
              id={`prof-degree-${index}`}
              label="Titulação"
              value={professional.degree}
              onChange={(e) => handleUpdate(index, "degree", e.target.value)}
              placeholder="Ex: Mestre, Doutor"
            />
          </div>

          <Textarea
            id={`prof-minicv-${index}`}
            label="Mini CV"
            value={professional.miniCv}
            onChange={(e) => handleUpdate(index, "miniCv", e.target.value)}
            placeholder="Breve currículo do profissional"
            rows={3}
          />

          <Textarea
            id={`prof-assignment-${index}`}
            label="Atribuição na Atividade"
            value={professional.activityAssignment}
            onChange={(e) =>
              handleUpdate(index, "activityAssignment", e.target.value)
            }
            placeholder="Descreva a atribuição do profissional"
            rows={2}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id={`prof-hiring-${index}`}
              label="Tipo de Contratação"
              options={[...HIRING_TYPES]}
              placeholder="Selecione..."
              value={professional.hiringType}
              onChange={(e) =>
                handleUpdate(index, "hiringType", e.target.value)
              }
            />
            <Select
              id={`prof-direct-${index}`}
              label="Direto / Indireto"
              options={[...DIRECT_INDIRECT]}
              placeholder="Selecione..."
              value={professional.directIndirect}
              onChange={(e) =>
                handleUpdate(index, "directIndirect", e.target.value)
              }
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={handleAdd}>
        + Adicionar Profissional
      </Button>
    </div>
  );
}
