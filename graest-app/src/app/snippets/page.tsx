"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { WIZARD_SECTIONS } from "@/lib/constants";

interface Snippet {
  id: string;
  name: string;
  targetSection: number;
  content: JSONContent;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
}

const sectionOptions = WIZARD_SECTIONS.map((s) => ({
  value: String(s.number),
  label: `${s.number}. ${s.title}`,
}));

function getSectionTitle(sectionNumber: number): string {
  const section = WIZARD_SECTIONS.find((s) => s.number === sectionNumber);
  return section ? `${section.number}. ${section.title}` : `Seção ${sectionNumber}`;
}

function getContentPreview(content: JSONContent): string {
  const extractText = (node: JSONContent): string => {
    if (node.text) return node.text;
    if (node.content) return node.content.map(extractText).join(" ");
    return "";
  };
  const text = extractText(content).trim();
  return text.length > 120 ? text.slice(0, 120) + "..." : text || "(vazio)";
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSection, setFormSection] = useState("");
  const [formContent, setFormContent] = useState<JSONContent | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSnippets = () => {
    setLoading(true);
    fetch("/api/snippets")
      .then((res) => res.json())
      .then((data) => setSnippets(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormSection("");
    setFormContent(null);
  };

  const handleNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingId(snippet.id);
    setFormName(snippet.name);
    setFormSection(String(snippet.targetSection));
    setFormContent(snippet.content);
    setShowForm(true);
  };

  const handleDelete = async (snippetId: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este snippet?"
    );
    if (!confirmed) return;

    try {
      await fetch(`/api/snippets/${snippetId}`, { method: "DELETE" });
      setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
    } catch (err) {
      console.error("Failed to delete snippet:", err);
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !formSection || !formContent) return;

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        targetSection: parseInt(formSection, 10),
        content: formContent,
      };

      if (editingId) {
        const res = await fetch(`/api/snippets/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setSnippets((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
      } else {
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setSnippets((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error("Failed to save snippet:", err);
    } finally {
      setSaving(false);
    }
  };

  // Group snippets by section
  const grouped = snippets.reduce<Record<number, Snippet[]>>((acc, s) => {
    if (!acc[s.targetSection]) acc[s.targetSection] = [];
    acc[s.targetSection].push(s);
    return acc;
  }, {});

  const sortedSections = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Snippets</h1>
          {!showForm && (
            <Button onClick={handleNew}>
              <Plus size={16} />
              Novo Snippet
            </Button>
          )}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingId ? "Editar Snippet" : "Novo Snippet"}
              </CardTitle>
            </CardHeader>

            <div className="space-y-4">
              <Input
                label="Nome"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do snippet"
              />

              <Select
                label="Seção alvo"
                options={sectionOptions}
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                placeholder="Selecione uma seção"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conteúdo
                </label>
                <RichTextEditor
                  content={formContent}
                  onChange={(content) => setFormContent(content)}
                  placeholder="Escreva o conteúdo do snippet..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !formName.trim() || !formSection}
                >
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  <X size={16} />
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Snippet list grouped by section */}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        ) : snippets.length === 0 && !showForm ? (
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum snippet criado ainda. Clique em &quot;Novo Snippet&quot; para
              começar.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedSections.map((sectionNum) => (
              <div key={sectionNum}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {getSectionTitle(sectionNum)}
                </h2>
                <div className="space-y-2">
                  {grouped[sectionNum].map((snippet) => (
                    <Card key={snippet.id} className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {snippet.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {getContentPreview(snippet.content)}
                          </p>
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar"
                            onClick={() => handleEdit(snippet)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Excluir"
                            onClick={() => handleDelete(snippet.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
