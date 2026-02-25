"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { aiTextToHtml } from "@/lib/utils";

interface AiIdlePromptProps {
  editor: Editor;
  section: number;
  fieldName: string;
}

const IDLE_DELAY_MS = 3000;

export function AiIdlePrompt({ editor, section, fieldName }: AiIdlePromptProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptPos, setPromptPos] = useState<{ top: number; left: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const planId = usePlanStore((s) => s.planId);
  const formData = usePlanStore((s) => s.formData);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hidePrompt = useCallback(() => {
    setVisible(false);
    setLoading(false);
    clearTimer();
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    // Only start timer if editor is focused
    if (!editor.isFocused) return;

    timerRef.current = setTimeout(() => {
      if (!editor.isFocused) return;

      // Calculate position at cursor
      const { from, to } = editor.state.selection;
      // Only show if no text is selected (cursor idle, not selecting)
      if (from !== to) return;

      try {
        const coords = editor.view.coordsAtPos(from);
        const editorEl = editor.view.dom;
        const editorRect = editorEl.getBoundingClientRect();

        // Position relative to the editor's parent (the relative container)
        const top = coords.bottom - editorRect.top + 4;
        const left = coords.left - editorRect.left;

        setPromptPos({ top, left });
        setVisible(true);
      } catch {
        // If coords fail (e.g. empty doc), show at start
        setPromptPos({ top: 40, left: 16 });
        setVisible(true);
      }
    }, IDLE_DELAY_MS);
  }, [editor, clearTimer]);

  // Listen to editor events
  useEffect(() => {
    const onUpdate = () => {
      hidePrompt();
      startTimer();
    };

    const onFocus = () => {
      startTimer();
    };

    const onBlur = () => {
      hidePrompt();
    };

    const onSelectionUpdate = () => {
      // Hide if user starts selecting text (they might want the context menu instead)
      const { from, to } = editor.state.selection;
      if (from !== to) {
        hidePrompt();
        clearTimer();
      }
    };

    // Also listen for keydown to reset timer on any key press (not just content changes)
    const editorDom = editor.view.dom;
    const onKeyDown = () => {
      hidePrompt();
      startTimer();
    };

    editor.on("update", onUpdate);
    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    editor.on("selectionUpdate", onSelectionUpdate);
    editorDom.addEventListener("keydown", onKeyDown);

    // Start timer if editor is already focused
    if (editor.isFocused) {
      startTimer();
    }

    return () => {
      clearTimer();
      editor.off("update", onUpdate);
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
      editor.off("selectionUpdate", onSelectionUpdate);
      editorDom.removeEventListener("keydown", onKeyDown);
    };
  }, [editor, hidePrompt, startTimer, clearTimer]);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const currentContent = editor.state.doc.textContent;
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section,
          fieldName,
          currentContent,
          action: "generate",
          useModulosApproach: formData.useModulosApproach,
          projectContext: {
            projectName: formData.projectName,
            projectNickname: formData.projectNickname,
            partnerName: formData.partnerName,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.suggestion) {
        // Insert at current cursor position
        editor.chain().focus().insertContent(aiTextToHtml(data.suggestion)).run();
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      hidePrompt();
    }
  };

  if (!visible || !promptPos) return null;

  const hasContent = editor.state.doc.textContent.trim().length > 0;

  return (
    <div
      ref={promptRef}
      className="absolute z-50 animate-in fade-in duration-200"
      style={{ top: promptPos.top, left: promptPos.left }}
    >
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 shadow-sm transition-all hover:bg-purple-100 hover:shadow-md disabled:opacity-70"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Sparkles size={13} />
        )}
        {loading
          ? "Gerando..."
          : hasContent
            ? "Continuar com IA"
            : "Gerar com IA"}
      </button>
    </div>
  );
}
