"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import type { JSONContent } from "@tiptap/react";

export function Step06Escopo() {
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
      <h2 className="text-lg font-semibold text-gray-900">6. Escopo</h2>
      <p className="text-sm text-gray-600">
        Descreva COMO o projeto será feito: etapas, módulos, metodologia,
        ferramentas, linguagens.
      </p>

      <RichTextEditor
        content={formData.escopo}
        onChange={(content) => updateField("escopo", content)}
        placeholder="Descreva o escopo do projeto..."
      />
      <SnippetPicker sectionNumber={6} onInsert={handleSnippetInsert("escopo")} />
    </div>
  );
}
