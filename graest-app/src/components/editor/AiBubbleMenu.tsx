"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Expand,
  RefreshCw,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { aiTextToHtml } from "@/lib/utils";

interface AiBubbleMenuProps {
  editor: Editor;
  section: number;
  fieldName: string;
}

type AiAction = "expand" | "rewrite" | "custom";

export function AiBubbleMenu({ editor, section, fieldName }: AiBubbleMenuProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const planId = usePlanStore((s) => s.planId);
  const formData = usePlanStore((s) => s.formData);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    if (menuPos) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuPos]);

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const closeMenu = useCallback(() => {
    setMenuPos(null);
    setError(null);
    setShowCustomInput(false);
    setCustomInstruction("");
    setSelectedText("");
    setLoading(false);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuPos) {
        closeMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuPos, closeMenu]);

  // Right-click handler on the editor
  useEffect(() => {
    const editorDom = editor.view.dom;

    const handleContextMenu = (e: MouseEvent) => {
      const { from, to } = editor.state.selection;
      if (from === to) return; // no selection, use default context menu

      e.preventDefault();
      const text = editor.state.doc.textBetween(from, to, " ");
      setSelectedText(text);
      setError(null);
      setShowCustomInput(false);
      setCustomInstruction("");

      // Position relative to viewport, clamped to stay on screen
      const menuWidth = 260;
      const menuHeight = 200;
      const top = Math.min(e.clientY, window.innerHeight - menuHeight);
      const left = Math.min(e.clientX, window.innerWidth - menuWidth);
      setMenuPos({ top, left });
    };

    editorDom.addEventListener("contextmenu", handleContextMenu);
    return () => editorDom.removeEventListener("contextmenu", handleContextMenu);
  }, [editor]);

  const callAi = async (action: AiAction, instruction?: string) => {
    if (loading || !selectedText) return;
    setLoading(true);
    setError(null);

    // Save selection range before async call
    const { from, to } = editor.state.selection;

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section,
          fieldName,
          currentContent: editor.state.doc.textContent,
          selectedText,
          action,
          customInstruction: instruction || undefined,
          projectContext: {
            projectName: formData.projectName,
            projectNickname: formData.projectNickname,
            partnerName: formData.partnerName,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao gerar sugestão.");
      } else {
        // Insert directly — user can Ctrl+Z to undo
        editor.chain().focus().deleteRange({ from, to }).insertContent(aiTextToHtml(data.suggestion)).run();
        closeMenu();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customInstruction.trim()) {
      callAi("custom", customInstruction.trim());
      setShowCustomInput(false);
    }
  };

  if (!menuPos) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-xl"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-purple-600">
          <Loader2 size={16} className="animate-spin" />
          Gerando sugestão...
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={closeMenu}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Action menu (initial state) */}
      {!loading && !error && !showCustomInput && (
        <div className="py-1">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
            IA — Texto selecionado
          </div>
          <button
            onClick={() => callAi("rewrite")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
          >
            <RefreshCw size={15} />
            Reescrever
          </button>
          <button
            onClick={() => callAi("expand")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
          >
            <Expand size={15} />
            Expandir texto
          </button>
          <div className="mx-2 my-1 border-t border-gray-100" />
          <button
            onClick={() => setShowCustomInput(true)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
          >
            <MessageSquare size={15} />
            Instrução personalizada...
          </button>
        </div>
      )}

      {/* Custom instruction input */}
      {showCustomInput && !loading && !error && (
        <div className="p-3">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">
            O que deseja fazer com o texto?
          </label>
          <input
            ref={customInputRef}
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomSubmit();
              if (e.key === "Escape") {
                setShowCustomInput(false);
                setCustomInstruction("");
              }
            }}
            placeholder="Ex: Torne mais formal, resuma em 2 frases..."
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleCustomSubmit}
              disabled={!customInstruction.trim()}
              className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <MessageSquare size={12} />
              Enviar
            </button>
            <button
              onClick={() => {
                setShowCustomInput(false);
                setCustomInstruction("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
