"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ExampleItem {
  name: string;
  content: string;
}

interface ExampleViewerProps {
  sectionNumber: number;
}

export function ExampleViewer({ sectionNumber }: ExampleViewerProps) {
  const [open, setOpen] = useState(false);
  const [examples, setExamples] = useState<ExampleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    fetch(`/api/examples?section=${sectionNumber}`)
      .then((res) => res.json())
      .then((data: ExampleItem[]) => {
        setExamples(data);
        setFetched(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, sectionNumber, fetched]);

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <BookOpen size={14} />
        {open ? "Ocultar Exemplos" : "Ver Exemplos"}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Button>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
          {loading ? (
            <p className="p-4 text-center text-sm text-gray-500">
              Carregando exemplos...
            </p>
          ) : examples.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">
              Nenhum exemplo disponível para esta seção.
            </p>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {examples.map((ex, i) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium transition-colors",
                      activeTab === i
                        ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="max-h-[400px] overflow-y-auto p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
                  {examples[activeTab]?.content}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
