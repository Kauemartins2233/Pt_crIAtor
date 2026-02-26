"use client";

import { forwardRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { EapNode } from "./EapNode";
import type { ActivityFormData } from "@/types/plan";

interface EapTreeDiagramProps {
  projectName: string;
  activities: ActivityFormData[];
  editable?: boolean;
  onRenameSubActivity?: (actIndex: number, subIndex: number, name: string) => void;
  onAddSubActivity?: (actIndex: number) => void;
  onRemoveSubActivity?: (actIndex: number, subIndex: number) => void;
  onActivityContextMenu?: (actIndex: number, event: React.MouseEvent) => void;
  generatingActIndex?: number | null;
}

export const EapTreeDiagram = forwardRef<HTMLDivElement, EapTreeDiagramProps>(
  function EapTreeDiagram(
    {
      projectName,
      activities,
      editable = false,
      onRenameSubActivity,
      onAddSubActivity,
      onRemoveSubActivity,
      onActivityContextMenu,
      generatingActIndex,
    },
    ref
  ) {
    const actCount = activities.length;

    return (
      <div
        ref={ref}
        className="inline-flex flex-col items-center gap-0 p-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Root node */}
        <EapNode
          label={projectName || "Projeto"}
          number=""
          level="root"
        />

        {/* Vertical connector from root to horizontal bar */}
        <div className="w-0.5 h-6 bg-gray-400" />

        {/* Horizontal bar spanning all activity columns */}
        <div className="relative flex">
          {/* The horizontal line */}
          {actCount > 1 && (
            <div
              className="absolute top-0 h-0.5 bg-gray-400"
              style={{
                left: `calc(${100 / (actCount * 2)}%)`,
                right: `calc(${100 / (actCount * 2)}%)`,
              }}
            />
          )}

          {/* Activity columns */}
          {activities.map((activity, actIdx) => {
            const subs = activity.subActivities.filter(
              (s) => s !== undefined
            );

            return (
              <div
                key={actIdx}
                className="flex flex-col items-center px-2"
                style={{ minWidth: "180px" }}
              >
                {/* Vertical connector from horizontal bar to activity */}
                <div className="w-0.5 h-6 bg-gray-400" />

                {/* Activity node */}
                <div
                  onContextMenu={(e) => {
                    if (editable && onActivityContextMenu) {
                      e.preventDefault();
                      onActivityContextMenu(actIdx, e);
                    }
                  }}
                  className={editable ? "cursor-context-menu" : ""}
                >
                  <EapNode
                    label={activity.name}
                    number={`${actIdx + 1}`}
                    level="activity"
                  />
                </div>

                {/* AI generating indicator */}
                {generatingActIndex === actIdx && (
                  <div className="mt-1 flex items-center justify-center gap-1 text-xs text-purple-500 dark:text-purple-400">
                    <Loader2 size={12} className="animate-spin" />
                    <span>IA gerando...</span>
                  </div>
                )}

                {/* Vertical connector from activity to sub-activities */}
                {subs.length > 0 && (
                  <div className="w-0.5 h-4 bg-gray-400" />
                )}

                {/* Sub-activities */}
                <div className="flex flex-col items-center gap-1">
                  {subs.map((sub, subIdx) => (
                    <div key={subIdx} className="flex flex-col items-center">
                      {subIdx > 0 && (
                        <div className="w-0.5 h-1 bg-gray-400" />
                      )}
                      <EapNode
                        label={sub.name}
                        number={`${actIdx + 1}.${subIdx + 1}`}
                        level="subactivity"
                        editable={editable}
                        onRename={(name) =>
                          onRenameSubActivity?.(actIdx, subIdx, name)
                        }
                        onRemove={
                          subs.length > 1
                            ? () => onRemoveSubActivity?.(actIdx, subIdx)
                            : undefined
                        }
                      />
                    </div>
                  ))}

                  {/* Add sub-activity button */}
                  {editable && (
                    <button
                      onClick={() => onAddSubActivity?.(actIdx)}
                      className="mt-1 flex items-center gap-1 rounded border border-dashed border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-400 dark:text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
                    >
                      <Plus size={12} />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
