"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import type { JSONContent } from "@tiptap/react";

export function Step07Estrategias() {
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
      <h2 className="text-lg font-semibold text-gray-900">7. Estratégias</h2>
      <p className="text-sm text-gray-600">
        Descreva a abordagem de execução: execução própria, contratos,
        parcerias.
      </p>

      <RichTextEditor
        content={formData.estrategias}
        onChange={(content) => updateField("estrategias", content)}
        placeholder="Descreva as estratégias de execução..."
      />
      <SnippetPicker sectionNumber={7} onInsert={handleSnippetInsert("estrategias")} />
    </div>
  );
}
