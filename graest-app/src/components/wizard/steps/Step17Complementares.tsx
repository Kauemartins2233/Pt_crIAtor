"use client";

import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import type { JSONContent } from "@tiptap/react";

export function Step17Complementares() {
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
        17. Informações Complementares
      </h2>
      <p className="text-sm text-gray-600">
        Informações adicionais que auxiliem no entendimento do projeto.
      </p>

      <RichTextEditor
        section={17}
        fieldName="complementares"
        content={formData.complementares}
        onChange={(content) => updateField("complementares", content)}
        placeholder="Informações complementares..."
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={17} onInsert={handleSnippetInsert("complementares")} />
        <ExampleViewer sectionNumber={17} />
      </div>
    </div>
  );
}
