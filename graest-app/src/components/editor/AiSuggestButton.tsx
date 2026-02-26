"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Check, Replace, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/lib/store";

interface AiSuggestButtonProps {
  section: number;
  fieldName: string;
  currentContent?: string;
  onInsert: (text: string) => void;
  onReplace?: (text: string) => void;
  className?: string;
  variant?: "toolbar" | "inline";
}

export function AiSuggestButton({
  section,
  fieldName,
  currentContent,
  onInsert,
  onReplace,
  className,
  variant = "inline",
}: AiSuggestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const planId = usePlanStore((s) => s.planId);
  const formData = usePlanStore((s) => s.formData);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSuggestion(null);
        setError(null);
      }
    }
    if (suggestion || error) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [suggestion, error]);

  const handleClick = async () => {
    if (loading) return;
    if (suggestion) {
      setSuggestion(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section,
          fieldName,
          currentContent: currentContent || "",
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
        setSuggestion(data.suggestion);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (suggestion) {
      onInsert(suggestion);
      setSuggestion(null);
    }
  };

  const handleReplace = () => {
    if (suggestion && onReplace) {
      onReplace(suggestion);
      setSuggestion(null);
    }
  };

  const isToolbar = variant === "toolbar";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title="Sugestão IA"
        className={cn(
          "transition-colors",
          isToolbar
            ? "rounded p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 disabled:opacity-50"
            : "flex items-center gap-1 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 disabled:opacity-50"
        )}
      >
        {loading ? (
          <Loader2 size={isToolbar ? 16 : 14} className="animate-spin" />
        ) : (
          <Sparkles size={isToolbar ? 16 : 14} />
        )}
        {!isToolbar && <span>IA</span>}
      </button>

      {/* Suggestion popover */}
      {(suggestion || error) && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-50 mt-2 w-[480px] max-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-850 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
              <Sparkles size={14} />
              Sugestão da IA
            </span>
            <button
              onClick={() => {
                setSuggestion(null);
                setError(null);
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[300px] overflow-y-auto px-4 py-3">
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {suggestion}
              </div>
            )}
          </div>

          {/* Actions */}
          {suggestion && (
            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 px-4 py-2">
              <button
                onClick={handleInsert}
                className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
              >
                <Check size={12} />
                Inserir
              </button>
              {onReplace && (
                <button
                  onClick={handleReplace}
                  className="flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Replace size={12} />
                  Substituir
                </button>
              )}
              <button
                onClick={() => setSuggestion(null)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Descartar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
