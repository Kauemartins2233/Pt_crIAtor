"use client";

import { useEffect, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface EapContextMenuProps {
  x: number;
  y: number;
  loading: boolean;
  onGenerateSubActivities: () => void;
  onClose: () => void;
}

export function EapContextMenu({
  x,
  y,
  loading,
  onGenerateSubActivities,
  onClose,
}: EapContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onGenerateSubActivities}
        disabled={loading}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} className="text-purple-500" />
        )}
        {loading ? "Gerando subatividades..." : "Gerar subatividades com IA"}
      </button>
    </div>
  );
}
