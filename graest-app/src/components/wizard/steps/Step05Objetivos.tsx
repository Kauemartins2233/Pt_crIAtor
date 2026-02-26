"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { Checkbox } from "@/components/ui/Checkbox";
import { aiTextToHtml, jsonContentToText } from "@/lib/utils";
import type { JSONContent, Editor } from "@tiptap/react";

export function Step05Objetivos() {
  const { formData, updateField } = usePlanStore();
  const [generatingGerais, setGeneratingGerais] = useState(false);
  const [generatingEspecificos, setGeneratingEspecificos] = useState(false);
  const geraisEditorRef = useRef<Editor | null>(null);
  const especificosEditorRef = useRef<Editor | null>(null);

  const handleSnippetInsert = (fieldName: string) => (snippetContent: JSONContent) => {
    const current = formData[fieldName as keyof typeof formData] as JSONContent | null;
    const currentChildren = current?.content ?? [];
    const snippetChildren = snippetContent?.content ?? [];
    updateField(fieldName as any, {
      type: "doc",
      content: [...currentChildren, ...snippetChildren],
    });
  };

  const handleGenerateGerais = useCallback(async () => {
    if (generatingGerais) return;
    setGeneratingGerais(true);
    try {
      const fd = usePlanStore.getState().formData;
      const planId = usePlanStore.getState().planId;

      const motivacao = jsonContentToText(fd.motivacao);
      const currentContent = geraisEditorRef.current?.state.doc.textContent || "";

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 5,
          fieldName: "objetivosGerais",
          currentContent,
          action: "generate",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: motivacao?.slice(0, 2000),
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion && geraisEditorRef.current) {
        geraisEditorRef.current
          .chain()
          .focus()
          .insertContent(aiTextToHtml(data.suggestion))
          .run();
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGeneratingGerais(false);
    }
  }, [generatingGerais]);

  const handleGenerateEspecificos = useCallback(async () => {
    if (generatingEspecificos) return;
    setGeneratingEspecificos(true);
    try {
      const fd = usePlanStore.getState().formData;
      const planId = usePlanStore.getState().planId;

      const motivacao = jsonContentToText(fd.motivacao);
      const objetivosGerais = jsonContentToText(fd.objetivosGerais);
      const currentContent = especificosEditorRef.current?.state.doc.textContent || "";

      const fieldName = fd.useModulosApproach
        ? "objetivosEspecificosModulos"
        : "objetivosEspecificos";

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 5,
          fieldName,
          currentContent,
          action: "generate",
          useModulosApproach: fd.useModulosApproach,
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: motivacao?.slice(0, 2000),
            objetivosGerais: objetivosGerais?.slice(0, 1000),
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion && especificosEditorRef.current) {
        especificosEditorRef.current
          .chain()
          .focus()
          .insertContent(aiTextToHtml(data.suggestion))
          .run();
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGeneratingEspecificos(false);
    }
  }, [generatingEspecificos]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        5. Objetivos Gerais e Específicos
      </h2>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">5.1 Objetivo Geral</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Descreva o objetivo principal (macro) do projeto.
        </p>
        <RichTextEditor
          section={5}
          fieldName="objetivosGerais"
          content={formData.objetivosGerais}
          onChange={(content) => updateField("objetivosGerais", content)}
          placeholder="Descreva os objetivos gerais do projeto..."
          onEditorReady={(editor) => {
            geraisEditorRef.current = editor;
          }}
        />
        <div className="flex items-center gap-2">
          <SnippetPicker sectionNumber={5} onInsert={handleSnippetInsert("objetivosGerais")} />
          <button
            type="button"
            onClick={handleGenerateGerais}
            disabled={generatingGerais}
            className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 disabled:opacity-50 transition-colors"
          >
            {generatingGerais ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generatingGerais ? "Gerando..." : "Gerar com IA"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">5.2 Objetivos Específicos</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Liste os objetivos detalhados e mensuráveis, ligados às atividades do projeto.
        </p>
        <Checkbox
          label="Abordagem por módulos (estilo Lity/MES)"
          checked={formData.useModulosApproach}
          onChange={(checked) => updateField("useModulosApproach", checked)}
          className="mb-2"
        />
        <RichTextEditor
          section={5}
          fieldName="objetivosEspecificos"
          content={formData.objetivosEspecificos}
          onChange={(content) => updateField("objetivosEspecificos", content)}
          placeholder="Descreva os objetivos específicos do projeto..."
          onEditorReady={(editor) => {
            especificosEditorRef.current = editor;
          }}
        />
        <div className="flex items-center gap-2">
          <SnippetPicker sectionNumber={5} onInsert={handleSnippetInsert("objetivosEspecificos")} />
          <ExampleViewer sectionNumber={5} />
          <button
            type="button"
            onClick={handleGenerateEspecificos}
            disabled={generatingEspecificos}
            className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 disabled:opacity-50 transition-colors"
          >
            {generatingEspecificos ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generatingEspecificos ? "Gerando..." : "Gerar com IA"}
          </button>
        </div>
      </div>
    </div>
  );
}
