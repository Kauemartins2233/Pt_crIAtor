"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import type { JSONContent } from "@tiptap/react";

export function Step11Inovadoras() {
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
        11. Características Inovadoras
      </h2>
      <p className="text-sm text-gray-600">
        Descreva as características inovadoras sendo incorporadas.
      </p>

      <RichTextEditor
        content={formData.inovadoras}
        onChange={(content) => updateField("inovadoras", content)}
        placeholder="Descreva as características inovadoras..."
      />
      <SnippetPicker sectionNumber={11} onInsert={handleSnippetInsert("inovadoras")} />
    </div>
  );
}
