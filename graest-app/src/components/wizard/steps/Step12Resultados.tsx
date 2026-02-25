"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { TRL_LEVELS } from "@/lib/constants";
import type { JSONContent } from "@tiptap/react";

export function Step12Resultados() {
  const { formData, updateField } = usePlanStore();

  const handleSnippetInsert = (fieldName: string) => (snippetContent: JSONContent) => {
    const current = formData[fieldName as keyof typeof formData] as JSONContent | null;
    const currentChildren = current?.content ?? [];
    const snippetChildren = snippetContent?.content ?? [];
    updateField(fieldName as any, {
      type: "doc",
      content: [...currentChildren, ...snippetChildren],
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        12. Resultados Esperados
      </h2>

      <RichTextEditor
        section={12}
        fieldName="resultados"
        content={formData.resultados}
        onChange={(content) => updateField("resultados", content)}
        placeholder="Descreva os resultados esperados do projeto..."
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={12} onInsert={handleSnippetInsert("resultados")} />
        <ExampleViewer sectionNumber={12} />
      </div>

      {/* TRL Level Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Nível TRL/MRL (opcional)
        </label>
        <p className="text-sm text-gray-500">
          Selecione o nível de maturidade tecnológica esperado ao final do
          projeto.
        </p>

        <div className="space-y-2">
          {TRL_LEVELS.map((trl) => (
            <label
              key={trl.level}
              className="flex items-center gap-3 cursor-pointer rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="trlLevel"
                checked={formData.trlMrlLevel === trl.level}
                onChange={() => updateField("trlMrlLevel", trl.level)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">TRL {trl.level}</span> -{" "}
                {trl.name}
              </span>
            </label>
          ))}

          {/* Option to clear selection */}
          {formData.trlMrlLevel !== null && (
            <button
              type="button"
              onClick={() => updateField("trlMrlLevel", null)}
              className="text-sm text-blue-600 hover:underline mt-1"
            >
              Limpar seleção
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
