"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EapNodeProps {
  label: string;
  number: string;
  level: "root" | "activity" | "subactivity";
  editable?: boolean;
  onRename?: (newName: string) => void;
  onRemove?: () => void;
}

export function EapNode({
  label,
  number,
  level,
  editable = false,
  onRename,
  onRemove,
}: EapNodeProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (!editable || level !== "subactivity") return;
    setEditValue(label);
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    if (editValue.trim() !== label && onRename) {
      onRename(editValue.trim());
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue(label);
  };

  const baseClasses =
    "relative flex items-center justify-center text-center px-3 py-2 rounded border-2 min-h-[48px] transition-colors";

  const levelClasses = {
    root: "bg-primary-600 border-primary-700 text-white font-bold text-sm min-w-[160px] max-w-[200px]",
    activity:
      "bg-primary-100 border-primary-300 text-primary-800 font-semibold text-xs min-w-[150px] max-w-[180px]",
    subactivity:
      "bg-white border-gray-300 text-gray-700 text-xs min-w-[150px] max-w-[180px] group/node",
  };

  if (editing) {
    return (
      <div className={cn(baseClasses, levelClasses.subactivity, "p-1")}>
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="w-full rounded border border-primary-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, levelClasses[level], {
        "cursor-pointer hover:border-primary-400":
          editable && level === "subactivity",
      })}
      onDoubleClick={startEdit}
      title={
        editable && level === "subactivity"
          ? "Clique duplo para editar"
          : undefined
      }
    >
      <span className="leading-tight">
        {level !== "root" && (
          <span className="font-bold mr-1">{number}</span>
        )}
        {label || <span className="italic text-gray-400">Sem nome</span>}
      </span>

      {editable && level === "subactivity" && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 hidden group-hover/node:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
          title="Remover subatividade"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
