import { useState } from "react";
import { useParams, useNavigate } from "react-router";

export function ReportJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Relatório enviado com sucesso");
    navigate(`/job/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-4">
          REPORTAR VAGA
        </h1>
        <p className="text-neutral-600">Ajude-nos a manter a qualidade das vagas</p>
      </div>

      <div className="bg-white border-4 border-neutral-900 p-8">
        <div className="mb-6 p-4 border-2 border-neutral-400 bg-neutral-50">
          <p className="font-mono text-sm">ID DA VAGA: {id}</p>
          <p className="font-mono text-sm text-neutral-600">Engenheiro de Software Sênior</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-mono mb-2 text-neutral-700">
              MOTIVO DO REPORTE
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900 bg-white"
              required
            >
              <option value="">Selecione um motivo...</option>
              <option value="misleading">Informação Enganosa</option>
              <option value="duplicate">Vaga Duplicada</option>
              <option value="expired">Vaga Já Preenchida</option>
              <option value="scam">Possível Golpe</option>
              <option value="inappropriate">Conteúdo Inapropriado</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-mono mb-2 text-neutral-700">
              DETALHES ADICIONAIS
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900 h-40 resize-none"
              placeholder="Por favor, forneça mais detalhes sobre este reporte..."
              required
            />
            <p className="text-xs text-neutral-600 mt-2">
              {details.length} / 500 caracteres
            </p>
          </div>

          <div className="border-2 border-neutral-400 p-4 bg-neutral-50">
            <h3 className="font-mono text-sm mb-2">DIRETRIZES DE REPORTE</h3>
            <ul className="text-xs text-neutral-600 space-y-1">
              <li>□ Certifique-se de que o problema é legítimo</li>
              <li>□ Forneça o máximo de detalhes possível</li>
              <li>□ Reportes falsos podem afetar sua conta</li>
              <li>□ Reportes são revisados em 24-48 horas</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-neutral-900 text-white py-3 border-2 border-neutral-900 hover:bg-neutral-700 font-mono"
            >
              [ENVIAR REPORTE]
            </button>
            <button
              type="button"
              onClick={() => navigate(`/job/${id}`)}
              className="flex-1 border-2 border-neutral-400 py-3 hover:bg-neutral-200 font-mono"
            >
              [CANCELAR]
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-white border-4 border-neutral-400 p-6">
        <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
          MOTIVOS COMUNS DE REPORTE
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-neutral-300 p-3">
            <p className="font-mono text-sm mb-1">INFO ENGANOSA</p>
            <p className="text-xs text-neutral-600">
              Salário, local ou descrição não correspondem
            </p>
          </div>
          <div className="border-2 border-neutral-300 p-3">
            <p className="font-mono text-sm mb-1">DUPLICADA</p>
            <p className="text-xs text-neutral-600">
              Mesma vaga publicada várias vezes
            </p>
          </div>
          <div className="border-2 border-neutral-300 p-3">
            <p className="font-mono text-sm mb-1">EXPIRADA</p>
            <p className="text-xs text-neutral-600">
              Posição já foi preenchida
            </p>
          </div>
          <div className="border-2 border-neutral-300 p-3">
            <p className="font-mono text-sm mb-1">GOLPE</p>
            <p className="text-xs text-neutral-600">
              Publicação suspeita ou fraudulenta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}