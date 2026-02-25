"use client";

import { usePlanStore } from "@/lib/store";
import { useCallback } from "react";

export function Step00Cabecalho() {
  const { formData, updateField } = usePlanStore();

  const handleImageUpload = useCallback(
    (field: "partnerLogo" | "foundationLogo") => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          alert("A imagem deve ter no máximo 2MB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          updateField(field, base64);
        };
        reader.readAsDataURL(file);
      };
    },
    [updateField]
  );

  const removeImage = (field: "partnerLogo" | "foundationLogo") => {
    updateField(field, "");
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Configure o cabeçalho do documento. O cabeçalho terá 3 logos: UEA (texto
        por enquanto), a empresa parceira e a fundação de apoio.
      </p>

      {/* Header preview */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Pré-visualização do cabeçalho
        </p>
        <div className="flex items-center justify-between gap-4">
          {/* UEA - text only */}
          <div className="flex flex-1 flex-col items-center justify-center rounded border border-gray-200 bg-white p-4">
            <span className="text-lg font-bold text-gray-700">UEA</span>
            <span className="text-xs text-gray-400">
              Universidade do Estado do Amazonas
            </span>
          </div>

          {/* Partner company */}
          <div className="flex flex-1 flex-col items-center justify-center rounded border border-gray-200 bg-white p-4">
            {formData.partnerLogo ? (
              <img
                src={formData.partnerLogo}
                alt="Logo empresa parceira"
                className="max-h-16 object-contain"
              />
            ) : (
              <span className="text-sm text-gray-400">
                {formData.partnerName || "Empresa Parceira"}
              </span>
            )}
          </div>

          {/* Foundation */}
          <div className="flex flex-1 flex-col items-center justify-center rounded border border-gray-200 bg-white p-4">
            {formData.foundationLogo ? (
              <img
                src={formData.foundationLogo}
                alt="Logo fundação de apoio"
                className="max-h-16 object-contain"
              />
            ) : (
              <span className="text-sm text-gray-400">
                {formData.foundationName || "Fundação de Apoio"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Partner company fields */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Empresa Parceira (logo do meio)
        </h3>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Nome da Empresa
          </label>
          <input
            type="text"
            value={formData.partnerName}
            onChange={(e) => updateField("partnerName", e.target.value)}
            placeholder="Ex: Salcomp"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Logo da Empresa
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload("partnerLogo")}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
            {formData.partnerLogo && (
              <button
                type="button"
                onClick={() => removeImage("partnerLogo")}
                className="shrink-0 rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remover
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            PNG, JPG ou SVG. Máximo 2MB.
          </p>
        </div>
      </div>

      {/* Foundation fields */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Fundação de Apoio (logo da direita)
        </h3>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Nome da Fundação
          </label>
          <input
            type="text"
            value={formData.foundationName}
            onChange={(e) => updateField("foundationName", e.target.value)}
            placeholder="Ex: FADECT"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Logo da Fundação
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload("foundationLogo")}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
            {formData.foundationLogo && (
              <button
                type="button"
                onClick={() => removeImage("foundationLogo")}
                className="shrink-0 rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remover
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            PNG, JPG ou SVG. Máximo 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
