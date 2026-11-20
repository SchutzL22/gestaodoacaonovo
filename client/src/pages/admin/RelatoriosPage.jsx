import { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Package,
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSessao } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUser() {
  try {
    const rawUser = localStorage.getItem('coper_usuario');
    if (rawUser) return JSON.parse(rawUser);
    const rawSessao = localStorage.getItem('coper_sessao');
    if (rawSessao) return JSON.parse(rawSessao);
    return null;
  } catch {
    return null;
  }
}

function getToken() {
  return getSessao()?.accessToken || '';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_BADGE = {
  APPROVED: { label: 'Aprovada', cls: 'bg-green-900/50 text-green-400 border border-green-700' },
  PENDING:  { label: 'Pendente', cls: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' },
  REJECTED: { label: 'Reprovada', cls: 'bg-red-900/50 text-red-400 border border-red-700' },
};

// ── Componente principal ───────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const user = getUser();
  const isCoper = user?.role === 'COPER' || user?.tipo === 'admin';

  // Filtros
  const [startDate, setStartDate]   = useState(defaultStart());
  const [endDate, setEndDate]       = useState(defaultEnd());
  const [status, setStatus]         = useState('ALL');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns]   = useState([]);
  const [page, setPage]             = useState(1);

  // Dados
  const [loading, setLoading]         = useState(true);
  const [summary, setSummary]         = useState(null);
  const [donations, setDonations]     = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [consulta, setConsulta] = useState({ startDate, endDate, status, campaignId, page: 1 });

  // Exportação
  const [exporting, setExporting] = useState({ pdf: false, csv: false });

  // Retenção
  const [retentionOpen, setRetentionOpen]       = useState(false);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionResult, setRetentionResult]   = useState(null);

  // Carregar lista de campanhas para o filtro
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await fetch('/api/campaigns', {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        const list = json.data?.campaigns || json.data || [];
        setCampaigns(list);
      } catch {
        setCampaigns([]);
      }
    }
    loadCampaigns();
  }, []);

  // ── Validação front-end RN10 ─────────────────────────────────────────────
  const rangeMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const rangeExceeds1Year = rangeMs > 365 * 24 * 60 * 60 * 1000;

  // ── Buscar dados consolidados ─────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ ...consulta, page: String(consulta.page), limit: '20' });
    if (!consulta.campaignId) params.delete('campaignId');
    async function buscar() {
      try {
        const res = await fetch(`/api/reports/consolidated?${params}`, {
          signal: controller.signal, headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erro ao carregar relatório');
        if (controller.signal.aborted) return;
        setSummary(json.data.summary);
        setDonations(json.data.donations || []);
        setPagination(json.data.pagination || null);
      } catch (err) {
        if (!controller.signal.aborted) toast.error(err.message || 'Erro ao carregar relatório');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    buscar();
    return () => controller.abort();
  }, [consulta]);

  function handleFilter() {
    if (rangeExceeds1Year) return;
    setLoading(true);
    setPage(1);
    setConsulta({ startDate, endDate, status, campaignId, page: 1 });
  }
  function handlePage(pg) {
    setLoading(true);
    setPage(pg);
    setConsulta(prev => ({ ...prev, page: pg }));
  }

  // ── Exportar arquivo (PDF ou CSV) ─────────────────────────────────────────
  async function exportFile(format) {
    if (rangeExceeds1Year) {
      toast.error('Intervalo máximo permitido é de 1 ano (RN10)');
      return;
    }
    setExporting((prev) => ({ ...prev, [format]: true }));
    try {
      const params = new URLSearchParams({ startDate, endDate, status });
      if (campaignId) {
        params.append('campaignId', campaignId);
      }
      const url = `/api/reports/export/${format}?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Erro ao exportar ${format.toUpperCase()}`);
      }
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      const filename = format === 'pdf'
        ? `relatorio-coper-${today}.pdf`
        : `doacoes-coper-${today}.csv`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      toast.success(`${format.toUpperCase()} exportado com sucesso!`);
    } catch (err) {
      toast.error(err.message || `Erro ao exportar ${format.toUpperCase()}`);
    } finally {
      setExporting((prev) => ({ ...prev, [format]: false }));
    }
  }

  // ── Limpeza de retenção ───────────────────────────────────────────────────
  async function runRetentionCleanup() {
    if (!confirm('⚠️ Esta ação executa a política de retenção LGPD (2 anos), anonimizando ou deletando registros expirados. Deseja prosseguir?')) return;
    setRetentionLoading(true);
    setRetentionResult(null);
    try {
      const res = await fetch('/api/reports/retention/cleanup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro na limpeza');
      setRetentionResult(json.data);
      toast.success('Rotina LGPD executada com sucesso!');
      handleFilter();
    } catch (err) {
      toast.error(err.message || 'Erro ao executar limpeza');
    } finally {
      setRetentionLoading(false);
    }
  }

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  const kpiCards = summary
    ? [
        { label: 'Total de Doações', value: summary.totalDonations, icon: Package, color: 'text-cyan-400', bg: 'border-cyan-700/40' },
        { label: 'Horas Complementares', value: `${summary.totalHoursGranted}h`, icon: Award, color: 'text-green-400', bg: 'border-green-700/40' },
        { label: 'Itens Arrecadados', value: `${summary.totalItemsCollected} un`, icon: TrendingUp, color: 'text-purple-400', bg: 'border-purple-700/40' },
        { label: 'Impacto Estimado', value: `~${summary.estimatedSocialImpact?.beneficiariesAssisted} pessoas`, icon: Users, color: 'text-yellow-400', bg: 'border-yellow-700/40' },
      ]
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-section">
      {/* Título & Ações Principais */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Relatórios Consolidados</h1>
          <p className="text-sm text-gray-400 mt-1">
            Exportação institucional de dados — COPER / FMP &nbsp;·&nbsp; Retenção de 2 anos (LGPD) &nbsp;·&nbsp; Filtro máx. 1 ano (RN10)
          </p>
        </div>

        {/* Botões de exportação */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFile('pdf')}
            disabled={exporting.pdf || rangeExceeds1Year}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 transition shadow-sm"
          >
            {exporting.pdf
              ? <RefreshCw size={15} className="animate-spin" />
              : <FileText size={15} />}
            <span>Exportar PDF</span>
          </button>

          {isCoper && (
            <button
              onClick={() => exportFile('csv')}
              disabled={exporting.csv || rangeExceeds1Year}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 transition shadow-sm"
            >
              {exporting.csv
                ? <RefreshCw size={15} className="animate-spin" />
                : <FileSpreadsheet size={15} />}
              <span>Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-[#0D2137] border border-[#1E3A5F] rounded-xl p-4 mb-5">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Filter size={14} />
          Filtros de Consulta
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filtro por Campanha */}
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-xs text-gray-400 font-medium">Campanha</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">Todas as Campanhas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Data Início */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filtro Data Fim */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Data Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs text-gray-400 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="APPROVED">Aprovadas</option>
              <option value="PENDING">Pendentes</option>
              <option value="REJECTED">Reprovadas</option>
            </select>
          </div>

          <button
            onClick={handleFilter}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-medium disabled:opacity-50 transition"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Filtrar
          </button>
        </div>

        {/* Alerta RN10 */}
        {rangeExceeds1Year && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
            <AlertTriangle size={15} />
            <span>⚠️ Regra de Negócio RN10: O intervalo máximo permitido para relatórios é de <strong>1 ano</strong>. Ajuste o período selecionado.</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {kpiCards.map((k) => (
            <div key={k.label} className={`bg-[#0D2137] border ${k.bg} rounded-xl p-4 flex items-center gap-3`}>
              <k.icon size={28} className={k.color} />
              <div>
                <p className="text-xs text-gray-400">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-cards de status */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Aprovadas', val: summary.APPROVED, icon: CheckCircle2, cls: 'text-green-400' },
            { label: 'Pendentes', val: summary.PENDING, icon: Clock, cls: 'text-yellow-400' },
            { label: 'Reprovadas', val: summary.REJECTED, icon: XCircle, cls: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0D2137] border border-[#1E3A5F] rounded-lg px-4 py-3 flex items-center gap-3">
              <s.icon size={18} className={s.cls} />
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className={`font-bold ${s.cls}`}>{s.val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de doações (apenas COPER) */}
      {isCoper && (
        <div className="bg-[#0D2137] border border-[#1E3A5F] rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#1E3A5F] flex items-center justify-between">
            <span className="font-semibold text-white text-sm">
              Detalhamento de Doações ({pagination?.total ?? donations.length} registros)
            </span>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page <= 1}
                  className="p-1 rounded hover:bg-[#1E3A5F] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>Página {page} de {pagination.totalPages}</span>
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="p-1 rounded hover:bg-[#1E3A5F] disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              <span>Carregando doações...</span>
            </div>
          ) : donations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Nenhuma doação encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0A1628] text-gray-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Doador</th>
                    <th className="px-4 py-3">Campanha</th>
                    <th className="px-4 py-3">Itens</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Horas</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60">
                  {donations.map((d) => {
                    const donorName = d.donorName
                      ? `${d.donorName} (externo)`
                      : (d.user?.name || '—');
                    const badge = STATUS_BADGE[d.status] || { label: d.status, cls: '' };
                    return (
                      <tr key={d.id} className="hover:bg-[#112843] transition">
                        <td className="px-4 py-3 font-medium text-white">{donorName}</td>
                        <td className="px-4 py-3 text-gray-400">{d.campaign?.title || 'Sem campanha'}</td>
                        <td className="px-4 py-3">
                          {d.items?.map((it) => `${it.quantity}x ${it.description}`).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-cyan-400">
                          {d.hoursEarned > 0 ? `${d.hoursEarned}h` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{fmtDate(d.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Painel LGPD / Retenção de 2 Anos (apenas COPER) */}
      {isCoper && (
        <div className="bg-[#0D2137] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <button
            onClick={() => setRetentionOpen(!retentionOpen)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#112843] transition"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Trash2 size={16} className="text-orange-400" />
              <span>Governança LGPD — Política de Retenção de Dados (2 Anos)</span>
            </div>
            <span className="text-xs text-gray-400">{retentionOpen ? '▲ Recolher' : '▼ Expandir'}</span>
          </button>

          {retentionOpen && (
            <div className="px-5 pb-5 pt-2 border-t border-[#1E3A5F]/60 text-xs text-gray-400 space-y-3">
              <p>
                Conforme as regras <strong>RF07, RNF06, RN09 e RN14</strong>, o sistema mantém o histórico operacional de doações por <strong>2 anos</strong>.
                A rotina de limpeza é executada automaticamente pelo servidor diariamente às <strong>02:00</strong> (via <code className="text-cyan-400">node-cron</code>),
                mas pode ser acionada manualmente pela equipe COPER a qualquer momento.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Doações com certificado/declaração emitida são <strong>anonimizadas</strong> (nome e CPF substituídos).</li>
                <li>Doações sem emissão documental são <strong>removidas definitivamente</strong>.</li>
                <li>Cada execução gera uma entrada auditável nos logs persistentes do sistema.</li>
              </ul>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={runRetentionCleanup}
                  disabled={retentionLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 text-white font-medium disabled:opacity-50 transition"
                >
                  {retentionLoading
                    ? <RefreshCw size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                  <span>Executar Limpeza Manual Agora</span>
                </button>
              </div>

              {retentionResult && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 space-y-1">
                  <div className="font-semibold text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Resultado da Execução:
                  </div>
                  <div>• Registros deletados: <strong>{retentionResult.deletedCount}</strong></div>
                  <div>• Registros anonimizados (LGPD): <strong>{retentionResult.anonymizedCount}</strong></div>
                  <div>• Data de corte aplicada: <strong>{new Date(retentionResult.cutoffDate).toLocaleDateString('pt-BR')}</strong></div>
                  <div>• Executado em: <strong>{new Date(retentionResult.executedAt).toLocaleString('pt-BR')}</strong></div>
                  <div>• Duração: <strong>{retentionResult.executionTimeMs}ms</strong></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
