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
  ArrowUpRight,
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
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Hero section */}
        <div className="mb-8 flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gerencie seus planos de trabalho PD&I
            </p>
          </div>
          <Button onClick={handleNewPlan} disabled={creating} size="lg">
            <Plus size={18} />
            {creating ? "Criando..." : "Novo Plano"}
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3 animate-fade-in-up-delay-1">
          <Card className="card-hover-primary group">
            <CardHeader>
              <CardTitle>Total de Planos</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-box-primary">
                <ClipboardList size={20} />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {loading ? "-" : totalPlans}
              </span>
            </div>
          </Card>
          <Card className="card-hover-accent group">
            <CardHeader>
              <CardTitle>Rascunhos</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-box-accent">
                <FilePen size={20} />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {loading ? "-" : drafts}
              </span>
            </div>
          </Card>
          <Card className="card-hover-primary group">
            <CardHeader>
              <CardTitle>Concluídos</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-box-primary">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {loading ? "-" : completed}
              </span>
            </div>
          </Card>
        </div>

        {/* Recent plans */}
        <Card className="mb-8 animate-fade-in-up-delay-2">
          <CardHeader>
            <CardTitle>Planos Recentes</CardTitle>
          </CardHeader>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
          ) : recentPlans.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum plano criado ainda. Clique em &quot;Novo Plano&quot; para começar.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-950/30 -mx-6 px-6 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {plan.projectName || "Sem nome"}
                    </p>
                    {plan.projectNickname && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plan.projectNickname}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(plan.updatedAt)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[plan.status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
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
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up-delay-3">
          <Link href="/plans">
            <Card className="card-hover-primary group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-box-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Planos de Trabalho</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ver e gerenciar todos os planos
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Card>
          </Link>
          <Link href="/snippets">
            <Card className="card-hover-accent group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-box-accent">
                    <Puzzle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Snippets</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Gerenciar trechos de texto reutilizáveis
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </>
  );
}
