"use client";

import { useRef, useState, useCallback } from "react";
import { ImageDown, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { toPng } from "html-to-image";
import { usePlanStore } from "@/lib/store";
import { EapTreeDiagram } from "./EapTreeDiagram";
import { EapContextMenu } from "./EapContextMenu";
import type { ActivityFormData } from "@/types/plan";

interface EapTreeEditorProps {
  escopoEditor: Editor | null;
}

function jsonContentToText(content: JSONContent | null): string {
  if (!content || !content.content) return "";
  const texts: string[] = [];
  for (const node of content.content) {
    if (node.content) {
      for (const child of node.content) {
        if (child.text) texts.push(child.text);
      }
    }
  }
  return texts.join(" ");
}

export function EapTreeEditor({ escopoEditor }: EapTreeEditorProps) {
  const { formData, updateField } = usePlanStore();
  const treeRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    actIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [generatingActIndex, setGeneratingActIndex] = useState<number | null>(
    null
  );

  const activities = formData.activities;
  const projectName =
    formData.projectNickname || formData.projectName || "Projeto";

  // Clone activities array and update store
  const updateActivities = useCallback(
    (updater: (acts: ActivityFormData[]) => ActivityFormData[]) => {
      const updated = updater(
        activities.map((a) => ({
          ...a,
          subActivities: a.subActivities.map((s) => ({ ...s })),
        }))
      );
      updateField("activities", updated);
    },
    [activities, updateField]
  );

  const handleRenameSubActivity = useCallback(
    (actIndex: number, subIndex: number, name: string) => {
      updateActivities((acts) => {
        acts[actIndex].subActivities[subIndex] = {
          ...acts[actIndex].subActivities[subIndex],
          name,
        };
        return acts;
      });
    },
    [updateActivities]
  );

  const handleAddSubActivity = useCallback(
    (actIndex: number) => {
      updateActivities((acts) => {
        acts[actIndex].subActivities.push({ name: "", description: "" });
        return acts;
      });
    },
    [updateActivities]
  );

  const handleRemoveSubActivity = useCallback(
    (actIndex: number, subIndex: number) => {
      updateActivities((acts) => {
        if (acts[actIndex].subActivities.length > 1) {
          acts[actIndex].subActivities.splice(subIndex, 1);
        }
        return acts;
      });
    },
    [updateActivities]
  );

  const handleActivityContextMenu = useCallback(
    (actIndex: number, event: React.MouseEvent) => {
      setContextMenu({ actIndex, x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleGenerateSubActivities = useCallback(
    async (actIndex: number) => {
      setContextMenu(null);
      setGeneratingActIndex(actIndex);

      const activity = activities[actIndex];
      const planId = usePlanStore.getState().planId;

      const activityContext = [
        `Atividade macro: ${activity.name}`,
        activity.description ? `Descrição: ${activity.description}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const motivacaoText = jsonContentToText(formData.motivacao);
      const objetivosText = jsonContentToText(formData.objetivosGerais);
      const objetivosEspText = jsonContentToText(formData.objetivosEspecificos);

      try {
        const res = await fetch("/api/ai/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            section: 8,
            fieldName: "eapSubActivities",
            currentContent: activityContext,
            projectContext: {
              projectName: formData.projectName,
              projectNickname: formData.projectNickname,
              partnerName: formData.partnerName,
              motivacao: motivacaoText?.slice(0, 1000),
              objetivosGerais: objetivosText?.slice(0, 1000),
              objetivosEspecificos: objetivosEspText?.slice(0, 1000),
            },
          }),
        });

        if (!res.ok) throw new Error("Erro ao gerar");

        const data = await res.json();
        const suggestion: string = data.suggestion || "";

        // Parse: split by newlines, clean up numbering/bullets, filter empty
        const subNames = suggestion
          .split("\n")
          .map((line: string) =>
            line
              .replace(/^[\d]+[.)]\s*/, "")
              .replace(/^[-•*]\s*/, "")
              .trim()
          )
          .filter((line: string) => line.length > 0 && line.length < 200);

        if (subNames.length > 0) {
          updateActivities((acts) => {
            const existing = acts[actIndex].subActivities;
            let nameIdx = 0;

            // Fill empty slots first
            for (
              let i = 0;
              i < existing.length && nameIdx < subNames.length;
              i++
            ) {
              if (!existing[i].name.trim()) {
                existing[i] = {
                  name: subNames[nameIdx],
                  description: "",
                };
                nameIdx++;
              }
            }

            // Append remaining
            while (nameIdx < subNames.length) {
              existing.push({ name: subNames[nameIdx], description: "" });
              nameIdx++;
            }

            return acts;
          });
        }
      } catch (error) {
        console.error("AI sub-activity generation error:", error);
      } finally {
        setGeneratingActIndex(null);
      }
    },
    [activities, formData, updateActivities]
  );

  const handleExport = async () => {
    if (!treeRef.current || exporting) return;
    setExporting(true);

    try {
      // Capture tree as PNG
      const dataUrl = await toPng(treeRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      // Convert to File
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "eap-tree.png", { type: "image/png" });

      // Upload
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      // Insert into escopo editor
      if (escopoEditor && url) {
        escopoEditor.chain().focus().setImage({ src: url }).run();
      }
    } catch (error) {
      console.error("EAP export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Estrutura Analítica do Projeto (EAP)
        </h3>
        <button
          onClick={handleExport}
          disabled={exporting || !escopoEditor}
          className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImageDown size={14} />
          )}
          {exporting ? "Exportando..." : "Inserir EAP no Escopo"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Edite as subatividades clicando duas vezes. Clique com o botão direito
        em uma atividade para gerar subatividades com IA.
      </p>

      {/* Scrollable tree container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <EapTreeDiagram
          ref={treeRef}
          projectName={projectName}
          activities={activities}
          editable={true}
          onRenameSubActivity={handleRenameSubActivity}
          onAddSubActivity={handleAddSubActivity}
          onRemoveSubActivity={handleRemoveSubActivity}
          onActivityContextMenu={handleActivityContextMenu}
          generatingActIndex={generatingActIndex}
        />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <EapContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          loading={generatingActIndex === contextMenu.actIndex}
          onGenerateSubActivities={() =>
            handleGenerateSubActivities(contextMenu.actIndex)
          }
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
