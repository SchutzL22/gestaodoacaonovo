import React, { useState } from 'react';
import { Award, FileText, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HistoricoAlunoPage() {
  const [certificados] = useState([
    {
      id: 'cert-1',
      hash: 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32',
      tipo: 'DECLARATION',
      titulo: 'Declaração de Doação Social - Campanha de Alimentos',
      horas: 10,
      data: '15/04/2026',
      status: 'AUTÊNTICO',
    },
    {
      id: 'cert-2',
      hash: 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4',
      tipo: 'COURSE',
      titulo: 'Certificado de Conclusão - Libras Módulo Básico',
      horas: 40,
      data: '20/03/2026',
      status: 'AUTÊNTICO',
    },
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Histórico de Documentos e Certificados</h1>
        <p className="text-xs text-slate-400 mt-1">
          Consulte seus comprovantes emitidos, baixe o PDF oficial ou valide a autenticidade online.
        </p>
      </div>

      <div className="space-y-4">
        {certificados.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {c.status}
                </span>
                <h3 className="font-semibold text-white text-sm mt-1">{c.titulo}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">Código Hash: {c.hash}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>Emitido em: {c.data}</span>
                  <span>•</span>
                  <span className="font-bold text-teal-400">{c.horas} horas computadas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link
                to={`/validar?code=${c.hash}`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>Validar</span>
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
