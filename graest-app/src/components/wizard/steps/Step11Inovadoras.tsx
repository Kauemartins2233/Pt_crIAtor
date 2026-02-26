"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { aiTextToHtml, jsonContentToText } from "@/lib/utils";
import type { JSONContent, Editor } from "@tiptap/react";

export function Step11Inovadoras() {
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

      const motivacao = jsonContentToText(fd.motivacao);
      const objetivosGerais = jsonContentToText(fd.objetivosGerais);
      const objetivosEspecificos = jsonContentToText(fd.objetivosEspecificos);
      const escopo = jsonContentToText(fd.escopo);
      const desafios = jsonContentToText(fd.desafios);
      const solucao = jsonContentToText(fd.solucao);

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 11,
          fieldName: "inovadoras",
          currentContent: "",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: motivacao?.slice(0, 1500),
            objetivosGerais: objetivosGerais?.slice(0, 1000),
            objetivosEspecificos: objetivosEspecificos?.slice(0, 1000),
            escopo: escopo?.slice(0, 2000),
            desafios: desafios?.slice(0, 1000),
            solucao: solucao?.slice(0, 1000),
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion && editorRef.current) {
        editorRef.current
          .chain()
          .focus()
          .selectAll()
          .deleteSelection()
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
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        11. Características Inovadoras
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Descreva as características inovadoras sendo incorporadas.
      </p>

      <RichTextEditor
        section={11}
        fieldName="inovadoras"
        content={formData.inovadoras}
        onChange={(content) => updateField("inovadoras", content)}
        placeholder="Descreva as características inovadoras..."
        onEditorReady={(editor) => {
          editorRef.current = editor;
        }}
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={11} onInsert={handleSnippetInsert("inovadoras")} />
        <ExampleViewer sectionNumber={11} />
        <button
          type="button"
          onClick={handleGenerateAi}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
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
