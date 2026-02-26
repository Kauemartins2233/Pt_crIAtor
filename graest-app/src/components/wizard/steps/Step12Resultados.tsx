"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { TRL_LEVELS } from "@/lib/constants";
import { aiTextToHtml, jsonContentToText } from "@/lib/utils";
import type { JSONContent, Editor } from "@tiptap/react";

export function Step12Resultados() {
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
      const inovadoras = jsonContentToText(fd.inovadoras);
      const desafios = jsonContentToText(fd.desafios);
      const solucao = jsonContentToText(fd.solucao);

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 12,
          fieldName: "resultados",
          currentContent: "",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: motivacao?.slice(0, 1500),
            objetivosGerais: objetivosGerais?.slice(0, 1000),
            objetivosEspecificos: objetivosEspecificos?.slice(0, 1000),
            escopo: escopo?.slice(0, 2000),
            inovadoras: inovadoras?.slice(0, 1000),
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
        12. Resultados Esperados
      </h2>

      <RichTextEditor
        section={12}
        fieldName="resultados"
        content={formData.resultados}
        onChange={(content) => updateField("resultados", content)}
        placeholder="Descreva os resultados esperados do projeto..."
        onEditorReady={(editor) => {
          editorRef.current = editor;
        }}
      />
      <div className="flex items-center gap-2">
        <SnippetPicker sectionNumber={12} onInsert={handleSnippetInsert("resultados")} />
        <ExampleViewer sectionNumber={12} />
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

      {/* TRL Level Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nível TRL/MRL (opcional)
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecione o nível de maturidade tecnológica esperado ao final do
          projeto.
        </p>

        <div className="space-y-2">
          {TRL_LEVELS.map((trl) => (
            <label
              key={trl.level}
              className="flex items-center gap-3 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <input
                type="radio"
                name="trlLevel"
                checked={formData.trlMrlLevel === trl.level}
                onChange={() => updateField("trlMrlLevel", trl.level)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">TRL {trl.level}</span> -{" "}
                {trl.name}
              </span>
            </label>
          ))}

          {/* Option to clear selection */}
          {formData.trlMrlLevel !== null && (
            <button
              type="button"
              onClick={() => updateField("trlMrlLevel", null)}
              className="text-sm text-primary-600 hover:underline mt-1"
            >
              Limpar seleção
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
