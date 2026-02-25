"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  FileImage,
  Trash2,
  Plus,
  File,
  MessageSquareText,
} from "lucide-react";

interface Material {
  id: string;
  type: string;
  filename: string | null;
  filePath: string | null;
  mimeType: string | null;
  textContent: string | null;
  createdAt: string;
}

const MIME_ICONS: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "text/plain": FileText,
  default: File,
};

function getMimeIcon(mimeType: string | null) {
  if (!mimeType) return MessageSquareText;
  if (mimeType.startsWith("image/")) return FileImage;
  return MIME_ICONS[mimeType] || MIME_ICONS.default;
}

export default function MaterialsPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textLabel, setTextLabel] = useState("");
  const [planName, setPlanName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch(`/api/materials/${planId}`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchMaterials();
    // Fetch plan name
    fetch(`/api/plans/${planId}`)
      .then((r) => r.json())
      .then((p) => setPlanName(p.projectName || p.projectNickname || "Plano"))
      .catch(() => {});
  }, [planId, fetchMaterials]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/materials/${planId}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchMaterials();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao fazer upload.");
      }
    } finally {
      setUploading(false);
    }
  };

  const addText = async () => {
    if (!textInput.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/materials/${planId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textContent: textInput.trim(),
          filename: textLabel.trim() || "Texto",
        }),
      });
      if (res.ok) {
        setTextInput("");
        setTextLabel("");
        fetchMaterials();
      }
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este material?")) return;
    await fetch(`/api/materials/${planId}?id=${id}`, { method: "DELETE" });
    fetchMaterials();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <button
            onClick={() => router.push(`/plans/${planId}`)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao Plano
          </button>
          <div className="h-5 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-800">
            Materiais de Contexto
          </h1>
          {planName && (
            <span className="text-sm text-gray-500">— {planName}</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Info banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Deposite aqui todos os materiais que servirão de contexto para a IA
            gerar sugestões nas seções do plano: emails, apresentações, PDFs,
            documentos, anotações, etc.
          </p>
        </div>

        {/* Upload area */}
        <div
          className={`mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload className="mx-auto mb-3 text-gray-400" size={40} />
          <p className="mb-2 text-gray-600">
            Arraste arquivos aqui ou{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-blue-600 hover:underline"
              disabled={uploading}
            >
              clique para selecionar
            </button>
          </p>
          <p className="text-xs text-gray-400">
            PDF, DOCX, PPTX, TXT, imagens — máximo 10MB cada
          </p>
          {uploading && (
            <p className="mt-2 text-sm text-blue-600 animate-pulse">
              Enviando...
            </p>
          )}
        </div>

        {/* Text input — always visible */}
        <div className="mb-6 rounded-lg border border-gray-300 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MessageSquareText size={16} />
            Adicionar informações em texto
          </h3>
          <input
            type="text"
            placeholder="Título (ex: Email do cliente, Notas da reunião...)"
            value={textLabel}
            onChange={(e) => setTextLabel(e.target.value)}
            className="mb-3 w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <textarea
            placeholder="Cole aqui o conteúdo do email, anotações, informações relevantes..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={5}
            className="mb-3 w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-y"
          />
          <button
            onClick={addText}
            disabled={!textInput.trim() || uploading}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
            Salvar texto
          </button>
        </div>

        {/* Materials list */}
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Materiais enviados ({materials.length})
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400 animate-pulse">Carregando...</p>
        ) : materials.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-400">Nenhum material adicionado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((mat) => {
              const Icon = mat.type === "text" ? MessageSquareText : getMimeIcon(mat.mimeType);
              return (
                <div
                  key={mat.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <Icon size={20} className="shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {mat.filename || "Texto"}
                    </p>
                    {mat.type === "text" && mat.textContent && (
                      <p className="truncate text-xs text-gray-400 mt-0.5">
                        {mat.textContent.slice(0, 120)}...
                      </p>
                    )}
                    {mat.mimeType && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {mat.mimeType}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(mat.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    onClick={() => deleteMaterial(mat.id)}
                    className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
