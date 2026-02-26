"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  GraduationCap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { StaffMember } from "@/types/plan";

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEducation, setFormEducation] = useState("");
  const [formDegree, setFormDegree] = useState("");
  const [formMiniCv, setFormMiniCv] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => setStaff(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormEducation("");
    setFormDegree("");
    setFormMiniCv("");
  };

  const handleNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setFormName(member.name);
    setFormEducation(member.education || "");
    setFormDegree(member.degree || "");
    setFormMiniCv(member.miniCv || "");
    setShowForm(true);
  };

  const handleDelete = async (memberId: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este profissional?"
    );
    if (!confirmed) return;

    try {
      await fetch(`/api/staff/${memberId}`, { method: "DELETE" });
      setStaff((prev) => prev.filter((s) => s.id !== memberId));
    } catch (err) {
      console.error("Failed to delete staff member:", err);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        education: formEducation.trim(),
        degree: formDegree.trim(),
        miniCv: formMiniCv.trim(),
      };

      if (editingId) {
        const res = await fetch(`/api/staff/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setStaff((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setStaff((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }

      resetForm();
    } catch (err) {
      console.error("Failed to save staff member:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Recursos Humanos
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cadastre os profissionais da equipe. Esses dados serão reutilizados em todos os planos.
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew}>
              <Plus size={16} />
              Novo Profissional
            </Button>
          )}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingId ? "Editar Profissional" : "Novo Profissional"}
              </CardTitle>
            </CardHeader>

            <div className="space-y-4">
              <Input
                label="Nome completo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do profissional"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Formação"
                  value={formEducation}
                  onChange={(e) => setFormEducation(e.target.value)}
                  placeholder="Ex: Engenharia de Computação"
                />
                <Input
                  label="Titulação"
                  value={formDegree}
                  onChange={(e) => setFormDegree(e.target.value)}
                  placeholder="Ex: Mestre, Doutor, Especialista"
                />
              </div>

              <Textarea
                label="Mini CV"
                value={formMiniCv}
                onChange={(e) => setFormMiniCv(e.target.value)}
                placeholder="Breve currículo do profissional..."
                rows={4}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
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

        {/* Staff list */}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        ) : staff.length === 0 && !showForm ? (
          <Card>
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 rounded-full bg-primary-100 dark:bg-primary-950/40 p-3">
                <GraduationCap size={24} className="text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nenhum profissional cadastrado
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Clique em &quot;Novo Profissional&quot; para começar.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <Card key={member.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {member.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      {member.education && (
                        <span>{member.education}</span>
                      )}
                      {member.degree && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                          {member.degree}
                        </span>
                      )}
                    </div>
                    {member.miniCv && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {member.miniCv}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Editar"
                      onClick={() => handleEdit(member)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Excluir"
                      onClick={() => handleDelete(member.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
