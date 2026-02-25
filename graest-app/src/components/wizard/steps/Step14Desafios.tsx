"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import type { JSONContent } from "@tiptap/react";

export function Step14Desafios() {
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
        14. Desafios Científicos e Tecnológicos
      </h2>
      <p className="text-sm text-gray-600">
        Descreva os desafios científicos e tecnológicos que demonstram as
        incertezas do projeto.
      </p>

      <RichTextEditor
        content={formData.desafios}
        onChange={(content) => updateField("desafios", content)}
        placeholder="Descreva os desafios científicos e tecnológicos..."
      />
      <SnippetPicker sectionNumber={14} onInsert={handleSnippetInsert("desafios")} />
    </div>
  );
}
