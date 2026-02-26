"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { Checkbox } from "@/components/ui/Checkbox";
import type { JSONContent } from "@tiptap/react";

export function Step05Objetivos() {
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
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        5. Objetivos Gerais e Específicos
      </h2>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">5.1 Objetivo Geral</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Descreva o objetivo principal (macro) do projeto.
        </p>
        <RichTextEditor
          section={5}
          fieldName="objetivosGerais"
          content={formData.objetivosGerais}
          onChange={(content) => updateField("objetivosGerais", content)}
          placeholder="Descreva os objetivos gerais do projeto..."
        />
        <SnippetPicker sectionNumber={5} onInsert={handleSnippetInsert("objetivosGerais")} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">5.2 Objetivos Específicos</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Liste os objetivos detalhados e mensuráveis, ligados às atividades do projeto.
        </p>
        <Checkbox
          label="Abordagem por módulos (estilo Lity/MES)"
          checked={formData.useModulosApproach}
          onChange={(checked) => updateField("useModulosApproach", checked)}
          className="mb-2"
        />
        <RichTextEditor
          section={5}
          fieldName="objetivosEspecificos"
          content={formData.objetivosEspecificos}
          onChange={(content) => updateField("objetivosEspecificos", content)}
          placeholder="Descreva os objetivos específicos do projeto..."
        />
        <div className="flex items-center gap-2">
          <SnippetPicker sectionNumber={5} onInsert={handleSnippetInsert("objetivosEspecificos")} />
          <ExampleViewer sectionNumber={5} />
        </div>
      </div>
    </div>
  );
}
