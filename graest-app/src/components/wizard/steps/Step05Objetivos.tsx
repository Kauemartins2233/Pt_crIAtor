"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
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
      <h2 className="text-lg font-semibold text-gray-900">
        5. Objetivos Gerais e Específicos
      </h2>

      <RichTextEditor
        content={formData.objetivosGerais}
        onChange={(content) => updateField("objetivosGerais", content)}
        placeholder="Descreva os objetivos gerais do projeto..."
      />
      <SnippetPicker sectionNumber={5} onInsert={handleSnippetInsert("objetivosGerais")} />

      <RichTextEditor
        content={formData.objetivosEspecificos}
        onChange={(content) => updateField("objetivosEspecificos", content)}
        placeholder="Descreva os objetivos específicos do projeto..."
      />
      <SnippetPicker sectionNumber={5} onInsert={handleSnippetInsert("objetivosEspecificos")} />
    </div>
  );
}
