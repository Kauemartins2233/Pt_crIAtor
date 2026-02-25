"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import type { JSONContent } from "@tiptap/react";

export function Step04Motivacao() {
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
      <h2 className="text-lg font-semibold text-gray-900">4. Motivação</h2>
      <p className="text-sm text-gray-600">
        Justifique a escolha do projeto, sua importância e a razão da execução.
      </p>

      <RichTextEditor
        section={4}
        fieldName="motivacao"
        content={formData.motivacao}
        onChange={(content) => updateField("motivacao", content)}
        placeholder="Descreva a motivação do projeto..."
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={4} onInsert={handleSnippetInsert("motivacao")} />
        <ExampleViewer sectionNumber={4} />
      </div>
    </div>
  );
}
