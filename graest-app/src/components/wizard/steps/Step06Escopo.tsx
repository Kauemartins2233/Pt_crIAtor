"use client";

import { useState, useCallback, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SnippetPicker } from "@/components/editor/SnippetPicker";
import { ExampleViewer } from "@/components/editor/ExampleViewer";
import { EapTreeEditor, replaceEapPlaceholder } from "@/components/eap/EapTreeEditor";
import { aiTextToHtml, jsonContentToText } from "@/lib/utils";
import type { JSONContent, Editor } from "@tiptap/react";

interface SnippetData {
  id: string;
  name: string;
  content: JSONContent;
}

/**
 * Find all [Inserir Snippet: X] placeholders in the editor and replace them
 * with actual snippet content from the database.
 */
function replaceSnippetPlaceholders(editor: Editor, snippets: SnippetData[]): number {
  let replacedCount = 0;

  // Process one snippet at a time (doc changes after each replacement)
  for (const snippet of snippets) {
    let found = false;

    editor.state.doc.descendants((node, pos) => {
      if (found) return false;
      if (!node.isText || !node.text) return true;

      // Match [Inserir Snippet: SnippetName] — case insensitive on the tag, exact on name
      const regex = new RegExp(`\\[Inserir Snippet:\\s*${escapeRegex(snippet.name)}\\s*\\]`, "i");
      if (!regex.test(node.text)) return true;

      // Find parent paragraph boundaries
      const resolved = editor.state.doc.resolve(pos);
      const parentStart = resolved.before(resolved.depth);
      const parentEnd = resolved.after(resolved.depth);

      // Build the snippet content as HTML-like nodes for TipTap insertion
      const snippetNodes = snippet.content?.content ?? [];

      // Replace the placeholder paragraph with the snippet content
      editor
        .chain()
        .focus()
        .setTextSelection({ from: parentStart, to: parentEnd })
        .deleteSelection()
        .insertContent(snippet.content)
        .run();

      found = true;
      replacedCount++;
      return false;
    });
  }

  return replacedCount;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function Step06Escopo() {
  const { formData, updateField } = usePlanStore();
  const [escopoEditor, setEscopoEditor] = useState<Editor | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const captureEapRef = useRef<(() => Promise<string | null>) | null>(null);

  const handleEditorReady = useCallback((editor: Editor) => {
    setEscopoEditor(editor);
  }, []);

  const handleSnippetInsert = (fieldName: string) => (snippetContent: JSONContent) => {
    const current = formData[fieldName as keyof typeof formData] as JSONContent | null;
    const currentChildren = current?.content ?? [];
    const snippetChildren = snippetContent?.content ?? [];
    updateField(fieldName as any, {
      type: "doc",
      content: [...currentChildren, ...snippetChildren],
    });
  };

  const handleAiGenerate = async () => {
    if (aiLoading || !escopoEditor) return;
    setAiLoading(true);

    try {
      const planId = usePlanStore.getState().planId;
      const currentContent = escopoEditor.state.doc.textContent;
      const motivacaoText = jsonContentToText(formData.motivacao);
      const objetivosGeraisText = jsonContentToText(formData.objetivosGerais);
      const objetivosEspText = jsonContentToText(formData.objetivosEspecificos);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectContext: Record<string, any> = {
        projectName: formData.projectName,
        projectNickname: formData.projectNickname,
        partnerName: formData.partnerName,
        motivacao: motivacaoText?.slice(0, 2000),
        objetivosGerais: objetivosGeraisText?.slice(0, 1000),
        objetivosEspecificos: objetivosEspText?.slice(0, 1000),
      };

      if (formData.activities?.length > 0) {
        projectContext.activities = formData.activities.map((a) => ({
          name: a.name,
          description: a.description,
          subActivities: a.subActivities?.map((s) => s.name).filter(Boolean) ?? [],
        }));
      }

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 6,
          fieldName: "escopo",
          currentContent,
          action: "generate",
          useModulosApproach: formData.useModulosApproach,
          projectContext,
        }),
      });

      const data = await res.json();
      if (res.ok && data.suggestion) {
        // Insert AI text into editor
        escopoEditor.chain().focus().insertContent(aiTextToHtml(data.suggestion)).run();

        // Auto-replace [Inserir Figura: ...EAP...] placeholder with actual EAP image
        if (escopoEditor.state.doc.textContent.includes("[Inserir Figura:") && captureEapRef.current) {
          try {
            const eapUrl = await captureEapRef.current();
            if (eapUrl) {
              replaceEapPlaceholder(escopoEditor, eapUrl);
            }
          } catch (err) {
            console.error("Auto EAP capture error:", err);
          }
        }

        // Auto-replace [Inserir Snippet: X] placeholders with actual snippet content
        if (escopoEditor.state.doc.textContent.includes("[Inserir Snippet:")) {
          try {
            const snippetsRes = await fetch("/api/snippets?section=6");
            if (snippetsRes.ok) {
              const snippets: SnippetData[] = await snippetsRes.json();
              if (snippets.length > 0) {
                replaceSnippetPlaceholders(escopoEditor, snippets);
              }
            }
          } catch (err) {
            console.error("Auto snippet insertion error:", err);
          }
        }
      }
    } catch (err) {
      console.error("AI escopo generation error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">6. Escopo</h2>
      <p className="text-sm text-gray-600">
        Descreva COMO o projeto será feito: etapas, módulos, metodologia,
        ferramentas, linguagens.
      </p>

      {/* EAP Tree Editor */}
      <EapTreeEditor escopoEditor={escopoEditor} captureRef={captureEapRef} />

      <RichTextEditor
        section={6}
        fieldName="escopo"
        content={formData.escopo}
        onChange={(content) => updateField("escopo", content)}
        placeholder="Descreva o escopo do projeto..."
        onEditorReady={handleEditorReady}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiLoading || !escopoEditor}
          className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {aiLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {aiLoading ? "Gerando escopo..." : "Gerar Escopo com IA"}
        </button>
        <SnippetPicker sectionNumber={6} onInsert={handleSnippetInsert("escopo")} />
        <ExampleViewer sectionNumber={6} />
      </div>
    </div>
  );
}
