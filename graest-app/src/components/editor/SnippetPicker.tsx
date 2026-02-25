"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/Button";
import { Puzzle, X } from "lucide-react";
import { WIZARD_SECTIONS } from "@/lib/constants";

interface SnippetItem {
  id: string;
  name: string;
  targetSection: number;
  content: JSONContent;
}

interface SnippetPickerProps {
  sectionNumber: number;
  onInsert: (content: JSONContent) => void;
}

export function SnippetPicker({ sectionNumber, onInsert }: SnippetPickerProps) {
  const [open, setOpen] = useState(false);
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/snippets?section=${sectionNumber}`)
      .then((res) => res.json())
      .then((data) => setSnippets(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, sectionNumber]);

  const sectionTitle =
    WIZARD_SECTIONS.find((s) => s.number === sectionNumber)?.title ?? "";

  const handleInsert = (snippet: SnippetItem) => {
    onInsert(snippet.content);
    setOpen(false);
  };

  const extractText = (content: JSONContent): string => {
    if (!content) return "";
    let text = "";
    if (content.text) text += content.text;
    if (content.content) {
      for (const child of content.content) {
        text += extractText(child) + " ";
      }
    }
    return text.trim();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Puzzle size={14} />
        Inserir Snippet
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Inserir Snippet
                </h2>
                <p className="text-sm text-gray-500">
                  Seção: {sectionTitle}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-6">
              {loading ? (
                <p className="text-center text-sm text-gray-500">Carregando...</p>
              ) : snippets.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  Nenhum snippet cadastrado para esta seção.
                </p>
              ) : (
                <div className="space-y-3">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.id}
                      onClick={() => handleInsert(snippet)}
                      className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      <p className="font-medium text-gray-900">{snippet.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {extractText(snippet.content).slice(0, 120)}
                        {extractText(snippet.content).length > 120 ? "..." : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-3">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
