import React, { useState } from 'react';
import { HeartHandshake, Calendar, Target, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CampanhasAlunoPage() {
  const campanhas = [
    {
      id: 1,
      titulo: 'Campanha de Agasalho 2026',
      descricao: 'Doe cobertores, agasalhos e casacos em bom estado para as famílias assistidas pela comissão comunitária.',
      limiteHoras: 20,
      dataLimite: '30/06/2026',
      categoria: 'Agasalhos',
    },
    {
      id: 2,
      titulo: 'Arrecadação de Alimentos - Páscoa Solidária',
      descricao: 'Alimentos não perecíveis (arroz, feijão, leite, óleo). Cada 5kg de alimento equivale a 5h de extensão.',
      limiteHoras: 30,
      dataLimite: '15/05/2026',
      categoria: 'Alimentos',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Campanhas de Doação Ativas</h1>
        <p className="text-xs text-slate-400 mt-1">
          Participe das ações solidárias do COPER e converta suas doações em horas complementares.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campanhas.map((c) => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                {c.categoria}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">{c.titulo}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{c.descricao}</p>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Até {c.limiteHoras}h comp.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Válido até {c.dataLimite}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.success('Solicitação de entrega registrada! Entregue os itens no posto COPER.')}
              className="mt-6 w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Registrar Doação para esta Campanha</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
