"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { aiTextToHtml } from "@/lib/utils";
import type { JSONContent, Editor } from "@tiptap/react";

export function Step04Motivacao() {
  const { formData, updateField } = usePlanStore();
  const [generating, setGenerating] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const handleSnippetInsert = (fieldName: string) => (snippetContent: JSONContent) => {
    const current = formData[fieldName as keyof typeof formData] as JSONContent | null;
    const currentChildren = current?.content ?? [];
    const snippetChildren = snippetContent?.content ?? [];
    updateField(fieldName as any, {
      type: "doc",
      content: [...currentChildren, ...snippetChildren],
    });
  };

  const handleGenerateAi = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const fd = usePlanStore.getState().formData;
      const planId = usePlanStore.getState().planId;

      const currentContent = editorRef.current?.state.doc.textContent || "";

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 4,
          fieldName: "motivacao",
          currentContent,
          action: "generate",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion && editorRef.current) {
        editorRef.current
          .chain()
          .focus()
          .insertContent(aiTextToHtml(data.suggestion))
          .run();
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">4. Motivação</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Justifique a escolha do projeto, sua importância e a razão da execução.
      </p>

      <RichTextEditor
        section={4}
        fieldName="motivacao"
        content={formData.motivacao}
        onChange={(content) => updateField("motivacao", content)}
        placeholder="Descreva a motivação do projeto..."
        onEditorReady={(editor) => {
          editorRef.current = editor;
        }}
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={4} onInsert={handleSnippetInsert("motivacao")} />
        <ExampleViewer sectionNumber={4} />
        <button
          type="button"
          onClick={handleGenerateAi}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {generating ? "Gerando..." : "Gerar com IA"}
        </button>
      </div>
    </div>
  );
}
