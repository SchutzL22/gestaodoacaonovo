import React, { useState, useEffect } from 'react';
import { HeartHandshake, Calendar, Target, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { listarCampanhas } from '../../services/api';
import toast from 'react-hot-toast';

/** Formata uma data ISO em DD/MM/AAAA */
function fmt(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}

const STATUS_LABEL = {
  ACTIVE: { text: 'Ativa', cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  Ativa: { text: 'Ativa', cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  FUTURE: { text: 'Futura', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  Futura: { text: 'Futura', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  CLOSED: { text: 'Encerrada', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  Encerrada: { text: 'Encerrada', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export default function CampanhasAlunoPage() {
  const [campanhas, setCampanhas] = useState([]);
  const [filtro, setFiltro] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarCampanhas()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.campaigns || data?.data?.campaigns || []);
        // Filtra para exibir ativas e futuras
        setCampanhas(list);
      })
      .catch(() => toast.error('Erro ao carregar campanhas.'))
      .finally(() => setLoading(false));
  }, []);

  const campanhasFiltradas = campanhas.filter((c) => {
    const isAtiva = c.status === 'ACTIVE' || c.status === 'Ativa';
    const isFutura = c.status === 'FUTURE' || c.status === 'Futura';
    const isEncerrada = c.status === 'CLOSED' || c.status === 'Encerrada';

    if (filtro === 'ACTIVE') return isAtiva;
    if (filtro === 'FUTURE') return isFutura;
    if (filtro === 'CLOSED') return isEncerrada;
    return true; // ALL
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando campanhas...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas de Doação</h1>
          <p className="text-xs text-slate-400 mt-1">
            Participe das ações solidárias do COPER e converta suas doações em horas complementares.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'ACTIVE', label: 'Ativas' },
            { id: 'FUTURE', label: 'Futuras' },
            { id: 'CLOSED', label: 'Encerradas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltro(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filtro === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {campanhasFiltradas.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <HeartHandshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma campanha encontrada neste filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campanhasFiltradas.map((c) => {
            const st = STATUS_LABEL[c.status] || STATUS_LABEL.ACTIVE;
            const isAtiva = st.text === 'Ativa';
            const isFutura = st.text === 'Futura';
            const isEncerrada = st.text === 'Encerrada';

            return (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${st.cls}`}>
                      {st.text}
                    </span>
                    {c.isUrgent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                        🔥 Urgente
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">{c.title || c.titulo}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{c.description || c.descricao}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4 border-t border-slate-800 pt-3">
                    {c.hoursLimit && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>Até {c.hoursLimit}h comp.</span>
                      </div>
                    )}
                    {(c.startDate || c.dataInicio) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        <span>De {fmt(c.startDate || c.dataInicio)} até {c.endDate || c.dataLimite ? fmt(c.endDate || c.dataLimite) : 'em aberto'}</span>
                      </div>
                    )}
                  </div>

                  {c.conversionRules && (
                    <p className="text-[11px] text-teal-500 mt-2 italic">💡 {c.conversionRules}</p>
                  )}

                  {c.priorityItems && c.priorityItems.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Itens prioritários:</p>
                      <div className="flex flex-wrap gap-1">
                        {c.priorityItems.map((item, i) => (
                          <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                            {item.name || item.nome}
                            {item.goal || item.meta ? ` (meta: ${item.goal || item.meta})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isFutura ? (
                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full bg-slate-800/80 text-blue-400 border border-blue-500/20 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>Inicia em {fmt(c.startDate || c.dataInicio)}</span>
                  </button>
                ) : isEncerrada ? (
                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full bg-slate-800/50 text-slate-500 border border-slate-700/30 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>Campanha Encerrada</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toast.success('Entregue os itens no posto COPER na FMP. Sua doação será registrada e validada pela equipe.')}
                    className="mt-6 w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Registrar Doação para esta Campanha</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
