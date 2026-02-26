"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlanStore } from "@/lib/store";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { HIRING_TYPES, DIRECT_INDIRECT } from "@/lib/constants";
import { ChevronDown, ChevronUp, GraduationCap, Trash2, UserPlus, Sparkles, Loader2 } from "lucide-react";
import type { ProfessionalFormData, StaffMember } from "@/types/plan";
import { jsonContentToText } from "@/lib/utils";
import Link from "next/link";

export function Step09RecursosHumanos() {
  const { formData, updateField } = usePlanStore();
  const professionals = formData.professionals;

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generatingRoleIndex, setGeneratingRoleIndex] = useState<number | null>(null);

  const handleGenerateRole = useCallback(async (index: number) => {
    if (generatingRoleIndex !== null) return;
    setGeneratingRoleIndex(index);
    try {
      const fd = usePlanStore.getState().formData;
      const planId = usePlanStore.getState().planId;
      const prof = fd.professionals[index];

      const motivacao = jsonContentToText(fd.motivacao);
      const objetivosGerais = jsonContentToText(fd.objetivosGerais);
      const escopo = jsonContentToText(fd.escopo);

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 9,
          fieldName: "roleInProject",
          currentContent: prof.roleInProject || "",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: motivacao?.slice(0, 1500),
            objetivosGerais: objetivosGerais?.slice(0, 1000),
            escopo: escopo?.slice(0, 2000),
            professional: {
              name: prof.name,
              education: prof.education,
              degree: prof.degree,
              miniCv: prof.miniCv,
            },
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion) {
        handleUpdate(index, "roleInProject", data.suggestion.trim());
      }
    } catch (error) {
      console.error("AI role generation error:", error);
    } finally {
      setGeneratingRoleIndex(null);
    }
  }, [generatingRoleIndex]);

  const handleGenerateAssignment = useCallback(async (index: number) => {
    if (generatingIndex !== null) return;
    setGeneratingIndex(index);
    try {
      const fd = usePlanStore.getState().formData;
      const planId = usePlanStore.getState().planId;
      const prof = fd.professionals[index];

      const motivacao = jsonContentToText(fd.motivacao);
      const objetivosGerais = jsonContentToText(fd.objetivosGerais);
      const objetivosEspecificos = jsonContentToText(fd.objetivosEspecificos);
      const escopo = jsonContentToText(fd.escopo);

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          section: 9,
          fieldName: "activityAssignment",
          currentContent: prof.activityAssignment || "",
          projectContext: {
            projectName: fd.projectName,
            projectNickname: fd.projectNickname,
            partnerName: fd.partnerName,
            motivacao: motivacao?.slice(0, 1500),
            objetivosGerais: objetivosGerais?.slice(0, 1000),
            objetivosEspecificos: objetivosEspecificos?.slice(0, 1000),
            escopo: escopo?.slice(0, 2000),
            professional: {
              name: prof.name,
              education: prof.education,
              degree: prof.degree,
              miniCv: prof.miniCv,
            },
          },
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar");
      const data = await res.json();

      if (data.suggestion) {
        handleUpdate(index, "activityAssignment", data.suggestion);
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGeneratingIndex(null);
    }
  }, [generatingIndex]);

  useEffect(() => {
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => setStaffMembers(data))
      .catch(console.error)
      .finally(() => setLoadingStaff(false));
  }, []);

  // Filter out already-added staff members from the dropdown
  const addedStaffIds = new Set(
    professionals.filter((p) => p.staffMemberId).map((p) => p.staffMemberId)
  );
  const availableStaff = staffMembers.filter((s) => !addedStaffIds.has(s.id));

  function handleAddFromStaff() {
    if (!selectedStaffId) return;
    const member = staffMembers.find((s) => s.id === selectedStaffId);
    if (!member) return;

    const newProfessional: ProfessionalFormData = {
      staffMemberId: member.id,
      orderIndex: professionals.length,
      name: member.name,
      category: member.category || "",
      education: member.education || "",
      degree: member.degree || "",
      miniCv: member.miniCv || "",
      roleInProject: "",
      activityAssignment: "",
      hiringType: "",
      directIndirect: "",
    };

    updateField("professionals", [...professionals, newProfessional]);
    setSelectedStaffId("");
    setExpandedIndex(professionals.length); // expand the new one
  }

  function handleRemove(index: number) {
    const updated = professionals
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, orderIndex: i }));
    updateField("professionals", updated);
    if (expandedIndex === index) setExpandedIndex(null);
  }

  function handleUpdate(
    index: number,
    field: keyof ProfessionalFormData,
    value: string
  ) {
    const updated = professionals.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    updateField("professionals", updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...professionals];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updateField(
      "professionals",
      updated.map((p, i) => ({ ...p, orderIndex: i }))
    );
    setExpandedIndex(index - 1);
  }

  function handleMoveDown(index: number) {
    if (index >= professionals.length - 1) return;
    const updated = [...professionals];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updateField(
      "professionals",
      updated.map((p, i) => ({ ...p, orderIndex: i }))
    );
    setExpandedIndex(index + 1);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        9. Recursos Humanos
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Selecione os profissionais cadastrados e defina suas atribuições neste projeto.
      </p>

      {/* Add from staff dropdown */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adicionar profissional
          </label>
          {loadingStaff ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800 px-3 py-2.5 text-sm text-gray-400">
              Carregando...
            </div>
          ) : availableStaff.length === 0 && staffMembers.length > 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800 px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500">
              Todos os profissionais já foram adicionados
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface-800 px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500">
              Nenhum profissional cadastrado.{" "}
              <Link
                href="/staff"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Cadastrar equipe
              </Link>
            </div>
          ) : (
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
            >
              <option value="">Selecione um profissional...</option>
              {availableStaff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.category === "professor" ? " (Professor)" : member.category === "aluno" ? " (Aluno)" : ""}
                  {member.degree ? ` — ${member.degree}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
        <Button
          type="button"
          onClick={handleAddFromStaff}
          disabled={!selectedStaffId}
        >
          <UserPlus size={16} />
          Adicionar
        </Button>
      </div>

      {/* Professional cards */}
      {professionals.length === 0 && (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface-800 py-8 text-center">
          <GraduationCap size={24} className="mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum profissional adicionado ao projeto.
          </p>
        </div>
      )}

      {professionals.map((professional, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={`${professional.staffMemberId || ""}-${index}`}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-800 overflow-hidden transition-all"
          >
            {/* Header — always visible */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-850 transition-colors"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950/40 text-xs font-bold text-primary-700 dark:text-primary-300">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {professional.name || "Sem nome"}
                    </p>
                    {professional.category && (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
                        professional.category === "professor"
                          ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                      }`}>
                        {professional.category === "professor" ? "Professor" : "Aluno"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {professional.degree && <span>{professional.degree}</span>}
                    {professional.education && (
                      <>
                        {professional.degree && <span>·</span>}
                        <span>{professional.education}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveUp(index);
                  }}
                  disabled={index === 0}
                  className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors"
                  title="Mover para cima"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveDown(index);
                  }}
                  disabled={index >= professionals.length - 1}
                  className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors"
                  title="Mover para baixo"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="rounded p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                  title="Remover do projeto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expandable body */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 space-y-4">
                {/* Read-only global info */}
                {professional.miniCv && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mini CV
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-surface-850 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                      {professional.miniCv}
                    </p>
                  </div>
                )}

                {/* Editable per-project fields */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="mb-3 text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                    Dados específicos do projeto
                  </p>

                  <div className="mb-4">
                    <label
                      htmlFor={`prof-role-${index}`}
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Função no Projeto
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`prof-role-${index}`}
                        type="text"
                        value={professional.roleInProject || ""}
                        onChange={(e) =>
                          handleUpdate(index, "roleInProject", e.target.value)
                        }
                        placeholder="Ex: Aluno Pesquisador - Desenvolvedor Full Stack"
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateRole(index)}
                        disabled={generatingRoleIndex !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-purple-500 dark:hover:bg-purple-600 shrink-0"
                        title="Sugerir função com IA"
                      >
                        {generatingRoleIndex === index ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Sparkles size={13} />
                        )}
                        {generatingRoleIndex === index ? "Gerando..." : "Sugerir"}
                      </button>
                    </div>
                  </div>

                  <Textarea
                    id={`prof-assignment-${index}`}
                    label="Atribuição na Atividade"
                    value={professional.activityAssignment}
                    onChange={(e) =>
                      handleUpdate(index, "activityAssignment", e.target.value)
                    }
                    placeholder="Descreva a atribuição do profissional neste projeto"
                    rows={4}
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateAssignment(index)}
                    disabled={generatingIndex !== null}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-purple-500 dark:hover:bg-purple-600"
                  >
                    {generatingIndex === index ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    {generatingIndex === index ? "Gerando..." : "Gerar com IA"}
                  </button>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      id={`prof-hiring-${index}`}
                      label="Tipo de Contratação"
                      options={[...HIRING_TYPES]}
                      placeholder="Selecione..."
                      value={professional.hiringType}
                      onChange={(e) =>
                        handleUpdate(index, "hiringType", e.target.value)
                      }
                    />
                    <Select
                      id={`prof-direct-${index}`}
                      label="Direto / Indireto"
                      options={[...DIRECT_INDIRECT]}
                      placeholder="Selecione..."
                      value={professional.directIndirect}
                      onChange={(e) =>
                        handleUpdate(index, "directIndirect", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
