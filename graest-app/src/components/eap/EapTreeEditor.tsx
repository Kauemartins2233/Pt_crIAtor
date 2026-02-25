"use client";

import { useRef, useState, useCallback } from "react";
import { ImageDown, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { toPng } from "html-to-image";
import { usePlanStore } from "@/lib/store";
import { EapTreeDiagram } from "./EapTreeDiagram";
import type { ActivityFormData } from "@/types/plan";

interface EapTreeEditorProps {
  escopoEditor: Editor | null;
}

export function EapTreeEditor({ escopoEditor }: EapTreeEditorProps) {
  const { formData, updateField } = usePlanStore();
  const treeRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const activities = formData.activities;
  const projectName = formData.projectNickname || formData.projectName || "Projeto";

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
        Edite as subatividades clicando duas vezes. Alterações refletem
        automaticamente no Plano de Ação.
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
        />
      </div>
    </div>
  );
}
