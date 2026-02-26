"use client";

import { useEffect, useRef } from "react";
import { usePlanStore } from "@/lib/store";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { JSONContent } from "@tiptap/react";
import { jsonContentToText } from "@/lib/utils";

function buildEstrategiasDefault(foundationName: string, partnerName: string): JSONContent {
  const fund = foundationName || "Fundação de Apoio";
  const partner = partnerName || "empresa parceira";

  const paragraphs = [
    `O projeto será executado através de Convênio firmado entre as instituições Universidade do Estado do Amazonas (UEA) com a interveniência financeira da ${fund}, que contarão com todo apoio técnico da empresa ${partner} para prestação de informações necessárias para o bom andamento da pesquisa. Esta integração possibilitará a eliminação ou mitigação de ruídos de comunicação, acelerando a execução.`,
    `A ${fund} será responsável por um conjunto de tarefas que tem como objetivo apoiar as demais atividades do projeto e garantir cumprimento de todas as regras, resoluções e legislação por parte da UEA. A ${fund} atuará principalmente na gestão, planejamento e controle dos recursos financeiros e humanos, gestão da alocação das horas dos bolsistas para que não ocorra super alocação de horas entre os projetos, alinhamento das atividades realizadas para garantir conformidade com o estabelecido em Convênio/Termo Aditivo/Plano de Trabalho/Contratos, normas e políticas envolvidas no projeto.`,
    `Será atribuição desses profissionais as atividades relacionadas a gestão de contrato, pessoas, contas a pagar e receber, faturamento, financeiro, compras, infraestrutura, logística, departamento de pessoal, tesouraria, requisitos legais através da assessoria jurídica e contábil no tocante a área de PD&I e escritório de projetos de PD&I se responsabilizando por todas as áreas que envolverão a administração de recursos dentro do projeto.`,
    `Estas atividades são consideradas indiretas e consequentemente estão associadas a todos os projetos do período e seus custos serão distribuídos de forma proporcional às horas trabalhadas na forma de rateio, elas são executadas por área organizacional dedicada à Gestão de PD&I voltadas para todas as fases do ciclo de vida dos projetos.`,
    `O projeto será executado na Universidade do Estado do Amazonas - Escola Superior de Tecnologia - EST no prédio Núcleo de Robótica e Automação. O mesmo será executado por alunos de graduação, especialização, pós, por professores doutores, mestres, especialistas, renomados em suas respectivas áreas, das mais diversas engenharias com vasta experiência em docência, bem como, frequentes publicações em periódicos de relevância agregando multiplicidade de competências e valores complementares visando maior integração e setorização de tarefas de desenvolvimento com a composição de diferentes times, o que possibilitará a otimização do resultado final a ser obtido.`,
  ];

  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

export function Step07Estrategias() {
  const { formData, updateField } = usePlanStore();
  const initialized = useRef(false);

  // Auto-populate with default text when field is empty
  useEffect(() => {
    if (initialized.current) return;
    const currentText = jsonContentToText(formData.estrategias).trim();
    if (!currentText) {
      updateField(
        "estrategias",
        buildEstrategiasDefault(formData.foundationName, formData.partnerName)
      );
    }
    initialized.current = true;
  }, [formData.estrategias, formData.foundationName, formData.partnerName, updateField]);

  // Update text when foundation name changes (only if text still matches template pattern)
  useEffect(() => {
    const currentText = jsonContentToText(formData.estrategias).trim();
    if (currentText && currentText.includes("interveniência financeira")) {
      updateField(
        "estrategias",
        buildEstrategiasDefault(formData.foundationName, formData.partnerName)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.foundationName, formData.partnerName]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">7. Estratégias</h2>
      <p className="text-sm text-gray-600">
        Texto padrão de estratégias de execução. O nome da fundação de apoio e
        da empresa parceira são inseridos automaticamente. Edite se necessário.
      </p>

      <RichTextEditor
        section={7}
        fieldName="estrategias"
        content={formData.estrategias}
        onChange={(content) => updateField("estrategias", content)}
        placeholder="Texto de estratégias será carregado automaticamente..."
      />
    </div>
  );
}
