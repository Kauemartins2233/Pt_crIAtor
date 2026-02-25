"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  Puzzle,
  ClipboardList,
  FilePen,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
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
  draft: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
};

export default function DashboardPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const totalPlans = plans.length;
  const drafts = plans.filter((p) => p.status === "draft").length;
  const completed = plans.filter((p) => p.status === "completed").length;
  const recentPlans = plans.slice(0, 5);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={handleNewPlan} disabled={creating}>
            <Plus size={16} />
            {creating ? "Criando..." : "Novo Plano"}
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total de Planos</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <ClipboardList size={24} className="text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "-" : totalPlans}
              </span>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rascunhos</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <FilePen size={24} className="text-amber-500" />
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "-" : drafts}
              </span>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Concluídos</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-500" />
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "-" : completed}
              </span>
            </div>
          </Card>
        </div>

        {/* Recent plans */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Planos Recentes</CardTitle>
          </CardHeader>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : recentPlans.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum plano criado ainda. Clique em &quot;Novo Plano&quot; para começar.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-gray-50 -mx-6 px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {plan.projectName || "Sem nome"}
                    </p>
                    {plan.projectNickname && (
                      <p className="text-sm text-gray-500">
                        {plan.projectNickname}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {formatDate(plan.updatedAt)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[plan.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[plan.status] ?? plan.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/plans">
            <Card className="transition-colors hover:border-blue-300">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">Planos de Trabalho</p>
                  <p className="text-sm text-gray-500">
                    Ver e gerenciar todos os planos
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/snippets">
            <Card className="transition-colors hover:border-blue-300">
              <div className="flex items-center gap-3">
                <Puzzle size={20} className="text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">Snippets</p>
                  <p className="text-sm text-gray-500">
                    Gerenciar trechos de texto reutilizáveis
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </>
  );
}
