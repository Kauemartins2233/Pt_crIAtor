"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import type { JSONContent } from "@tiptap/react";

export function Step15Solucao() {
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
        15. Solução Proposta
      </h2>
      <p className="text-sm text-gray-600">
        Descreva as ações propostas para enfrentar os desafios/problemas.
      </p>

      <RichTextEditor
        section={15}
        fieldName="solucao"
        content={formData.solucao}
        onChange={(content) => updateField("solucao", content)}
        placeholder="Descreva a solução proposta..."
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={15} onInsert={handleSnippetInsert("solucao")} />
        <ExampleViewer sectionNumber={15} />
      </div>
    </div>
  );
}
