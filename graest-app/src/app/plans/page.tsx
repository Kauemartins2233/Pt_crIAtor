"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Copy, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface PlanSummary {
  id: string;
  projectName: string | null;
  projectNickname: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  completed: "Concluído",
};

const statusColors: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export default function PlansListPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleNewPlan = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/plans", { method: "POST" });
      const { id } = await res.json();
      router.push(`/plans/${id}`);
    } catch (err) {
      console.error("Failed to create plan:", err);
      setCreating(false);
    }
  };

  const handleDuplicate = async (planId: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}/duplicate`, {
        method: "POST",
      });
      const { id } = await res.json();
      router.push(`/plans/${id}`);
    } catch (err) {
      console.error("Failed to duplicate plan:", err);
    }
  };

  const handleDelete = async (planId: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita."
    );
    if (!confirmed) return;

    try {
      await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Planos de Trabalho
          </h1>
          <Button onClick={handleNewPlan} disabled={creating}>
            <Plus size={16} />
            {creating ? "Criando..." : "Novo Plano"}
          </Button>
        </div>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Carregando...</div>
          ) : plans.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
              Nenhum plano encontrado. Crie um novo plano para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Nome
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Apelido
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Última atualização
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {plan.projectName || "Sem nome"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {plan.projectNickname || "\u2014"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[plan.status] ??
                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {statusLabels[plan.status] ?? plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(plan.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/plans/${plan.id}`}>
                            <Button variant="ghost" size="sm" title="Editar">
                              <Pencil size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Duplicar"
                            onClick={() => handleDuplicate(plan.id)}
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Excluir"
                            onClick={() => handleDelete(plan.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
