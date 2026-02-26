"use client";

import { usePlanStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";

function formatBRL(value: number | null): string {
  if (value === null || isNaN(value)) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseBRL(formatted: string): number | null {
  const cleaned = formatted.replace(/[R$\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function Step01Identificacao() {
  const { formData, updateField } = usePlanStore();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        1. Identificação do Projeto
      </h2>

      {/* Project Name with char counter */}
      <div>
        <Input
          id="projectName"
          label="Nome do Projeto"
          value={formData.projectName}
          maxLength={120}
          onChange={(e) => updateField("projectName", e.target.value)}
          placeholder="Digite o nome do projeto"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {formData.projectName.length}/120 caracteres
        </p>
      </div>

      <Input
        id="projectNickname"
        label="Apelido do Projeto"
        value={formData.projectNickname}
        onChange={(e) => updateField("projectNickname", e.target.value)}
        placeholder="Apelido ou sigla do projeto"
      />

      <Input
        id="coordinatorInstitution"
        label="Coordenador da Instituição"
        value={formData.coordinatorInstitution}
        onChange={(e) => updateField("coordinatorInstitution", e.target.value)}
        placeholder="Nome do coordenador da instituição"
      />

      <Input
        id="coordinatorFoxconn"
        label="Coordenador do Projeto na Empresa"
        value={formData.coordinatorFoxconn}
        onChange={(e) => updateField("coordinatorFoxconn", e.target.value)}
        placeholder="Nome do coordenador na empresa"
      />

      {/* Total Value - BRL formatted */}
      <div>
        <Input
          id="totalValue"
          label="Valor Total (R$)"
          value={formData.totalValue !== null ? formatBRL(formData.totalValue) : ""}
          onChange={(e) => updateField("totalValue", parseBRL(e.target.value))}
          placeholder="R$ 0,00"
        />
      </div>

      <Input
        id="totalValueWritten"
        label="Valor por Extenso"
        value={formData.totalValueWritten}
        onChange={(e) => updateField("totalValueWritten", e.target.value)}
        placeholder="Ex: cem mil reais"
      />

      {/* Execution Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="executionStartDate"
          label="Início da Execução"
          type="date"
          value={formData.executionStartDate}
          onChange={(e) => updateField("executionStartDate", e.target.value)}
        />
        <Input
          id="executionEndDate"
          label="Fim da Execução"
          type="date"
          value={formData.executionEndDate}
          onChange={(e) => updateField("executionEndDate", e.target.value)}
        />
      </div>

      {/* Validity Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="validityStartDate"
          label="Início da Vigência"
          type="date"
          value={formData.validityStartDate}
          onChange={(e) => updateField("validityStartDate", e.target.value)}
        />
        <Input
          id="validityEndDate"
          label="Fim da Vigência"
          type="date"
          value={formData.validityEndDate}
          onChange={(e) => updateField("validityEndDate", e.target.value)}
        />
      </div>
    </div>
  );
}
