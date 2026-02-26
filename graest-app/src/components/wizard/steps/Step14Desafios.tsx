"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { aiTextToHtml, jsonContentToText } from "@/lib/utils";
import type { JSONContent, Editor } from "@tiptap/react";

export function Step14Desafios() {
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

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 14,
          fieldName: "desafios",
          currentContent: "",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: jsonContentToText(fd.motivacao)?.slice(0, 1500),
            objetivosGerais: jsonContentToText(fd.objetivosGerais)?.slice(0, 1000),
            objetivosEspecificos: jsonContentToText(fd.objetivosEspecificos)?.slice(0, 1000),
            escopo: jsonContentToText(fd.escopo)?.slice(0, 2000),
            inovadoras: jsonContentToText(fd.inovadoras)?.slice(0, 1000),
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion && editorRef.current) {
        editorRef.current
          .chain().focus().selectAll().deleteSelection()
          .insertContent(aiTextToHtml(data.suggestion)).run();
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGenerating(false);
    }
  }, [generating]);

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
        section={14}
        fieldName="desafios"
        content={formData.desafios}
        onChange={(content) => updateField("desafios", content)}
        placeholder="Descreva os desafios científicos e tecnológicos..."
        onEditorReady={(editor) => { editorRef.current = editor; }}
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={14} onInsert={handleSnippetInsert("desafios")} />
        <ExampleViewer sectionNumber={14} />
        <button
          type="button"
          onClick={handleGenerateAi}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "Gerando..." : "Gerar com IA"}
        </button>
      </div>
    </div>
  );
}
