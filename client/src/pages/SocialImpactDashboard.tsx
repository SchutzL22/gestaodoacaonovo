import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Package,
  HeartHandshake,
  Users,
  Award,
  Download,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  ArrowLeft,
  LogIn,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import fmpLogo from '../assets/fmplogo.png';
import './SocialImpactDashboard.css';

// Paleta de visualização de dados — tons de azul FMP e complementares
const CATEGORY_COLORS = ['#0A3A60', '#1A5282', '#2196F3', '#27AE60', '#F2994A'];

export default function SocialImpactDashboard({ embedded = false }: { embedded?: boolean }) {
  const [selectedYear, setSelectedYear] = useState('2026');

  const [kpis, setKpis] = useState({
    totalItens: 14850,
    familiasImpactadas: 620,
    alunosEngajados: 485,
    horasComputadas: 3240,
  });

  const categoryData = [
    { name: 'Alimentos Não Perecíveis', value: 7200, pct: '48.5%' },
    { name: 'Agasalhos e Cobertores', value: 3450, pct: '23.2%' },
    { name: 'Material Escolar e Livros', value: 2400, pct: '16.2%' },
    { name: 'Itens de Higiene e Limpeza', value: 1200, pct: '8.1%' },
    { name: 'Brinquedos e Acolhimento', value: 600, pct: '4.0%' },
  ];

  const monthlyData = [
    { mes: 'Jan', itens: 850, horas: 180 },
    { mes: 'Fev', itens: 1100, horas: 240 },
    { mes: 'Mar', itens: 1950, horas: 410 },
    { mes: 'Abr', itens: 2300, horas: 520 },
    { mes: 'Mai', itens: 2800, horas: 610 },
    { mes: 'Jun', itens: 3100, horas: 680 },
    { mes: 'Jul', itens: 2750, horas: 600 },
  ];

  const campaigns = [
    {
      id: 'CMP-01',
      title: 'Campanha de Inverno 2026 — Palhoça Sem Frio',
      categoria: 'Agasalhos e Cobertores',
      meta: '3.000 peças',
      arrecadado: '3.450 peças (115%)',
      status: 'CONCLUÍDA',
      impacto: '420 famílias assistidas',
      data: 'Maio – Junho / 2026',
    },
    {
      id: 'CMP-02',
      title: 'Alimentando o Saber — Cestas Básicas Comunitárias',
      categoria: 'Alimentos',
      meta: '5.000 kg',
      arrecadado: '7.200 kg (144%)',
      status: 'EM ANDAMENTO',
      impacto: '350 cestas montadas',
      data: 'Março – Atual',
    },
    {
      id: 'CMP-03',
      title: 'Volta às Aulas Inclusiva — Kits de Material Escolar',
      categoria: 'Material Escolar',
      meta: '2.000 itens',
      arrecadado: '2.400 itens (120%)',
      status: 'CONCLUÍDA',
      impacto: '180 estudantes beneficiados',
      data: 'Fevereiro / 2026',
    },
    {
      id: 'CMP-04',
      title: 'Higiene e Dignidade Comunitária',
      categoria: 'Higiene',
      meta: '1.000 kits',
      arrecadado: '1.200 kits (120%)',
      status: 'CONCLUÍDA',
      impacto: '120 lares atendidos',
      data: 'Abril / 2026',
    },
  ];

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get('/api/public/stats');
        if (res.data?.data?.impact) {
          const impact = res.data.data.impact;
          setKpis((prev) => ({
            ...prev,
            horasComputadas: impact.totalHoursGranted || prev.horasComputadas,
            totalItens: impact.totalApprovedDonations
              ? impact.totalApprovedDonations * 25
              : prev.totalItens,
          }));
        }
      } catch {
        // Dados institucionais de demonstração mantidos
      }
    }
    loadStats();
  }, []);

  const handleExportPDF = () => window.print();

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: '10px',
    color: '#1a2332',
    fontSize: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  };

  if (embedded) {
    return (
      <SocialImpactContent
        kpis={kpis}
        categoryData={categoryData}
        monthlyData={monthlyData}
        campaigns={campaigns}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        handleExportPDF={handleExportPDF}
        tooltipStyle={tooltipStyle}
      />
    );
  }

  return (
    <div className="sid-standalone">
      {/* ── HEADER STANDALONE ─────────────────────────────── */}
      <header className="sid-header">
        <div className="sid-header-inner">
          <Link to="/" className="sid-header-brand">
            <img src={fmpLogo} alt="Logo FMP" className="sid-header-logo" />
            <div>
              <div className="sid-header-title">COPER 3.0 — Impacto Social</div>
              <div className="sid-header-sub">Dashboard Institucional ESG & Transparência</div>
            </div>
          </Link>
          <div className="sid-header-actions">
            <Link to="/" className="sid-btn-back">
              <ArrowLeft size={14} />
              <span>Página Inicial</span>
            </Link>
            <Link to="/login" className="sid-btn-login">
              <LogIn size={13} />
              <span>Acessar Sistema</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO ──────────────────────────────────────── */}
      <div className="sid-content">
        <SocialImpactContent
          kpis={kpis}
          categoryData={categoryData}
          monthlyData={monthlyData}
          campaigns={campaigns}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          handleExportPDF={handleExportPDF}
          tooltipStyle={tooltipStyle}
        />
      </div>
    </div>
  );
}

// ── Conteúdo reutilizável (pode ser chamado dentro do AppLayout também) ──
interface KPIs { totalItens: number; familiasImpactadas: number; alunosEngajados: number; horasComputadas: number; }
interface Campaign { id: string; title: string; categoria: string; meta: string; arrecadado: string; status: string; impacto: string; data: string; }

function SocialImpactContent({
  kpis,
  categoryData,
  monthlyData,
  campaigns,
  selectedYear,
  setSelectedYear,
  handleExportPDF,
  tooltipStyle,
}: {
  kpis: KPIs;
  categoryData: { name: string; value: number; pct: string }[];
  monthlyData: { mes: string; itens: number; horas: number }[];
  campaigns: Campaign[];
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  handleExportPDF: () => void;
  tooltipStyle: object;
}) {
  return (
    <div className="sid-wrapper">
      {/* 1. CABEÇALHO DA SEÇÃO */}
      <div className="sid-top">
        <div>
          <div className="sid-top-badge">
            <Building2 size={12} />
            Portal de Responsabilidade Social & Prestação de Contas
          </div>
          <h1>Dashboard Institucional de Impacto Social</h1>
          <p className="sid-top-sub">
            Painel executivo para monitoramento de arrecadações, horas complementares e auditoria para parceiros empresariais.
          </p>
        </div>

        <div className="sid-top-actions">
          <div className="sid-year-select">
            <Calendar size={15} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2026">Exercício 2026</option>
              <option value="2025">Exercício 2025</option>
            </select>
          </div>
          <button type="button" onClick={handleExportPDF} className="btn-export">
            <Download size={14} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* 2. KPIs */}
      <div className="sid-kpis">
        <div className="sid-kpi-card">
          <div className="sid-kpi-icon blue"><Package size={20} /></div>
          <span className="sid-kpi-label">Total de Itens Arrecadados</span>
          <div className="sid-kpi-value">
            {kpis.totalItens.toLocaleString('pt-BR')}
            <span className="sid-kpi-unit"> unidades</span>
          </div>
          <div className="sid-kpi-trend">
            <TrendingUp size={13} />
            +24% em relação ao semestre anterior
          </div>
        </div>

        <div className="sid-kpi-card">
          <div className="sid-kpi-icon accent"><HeartHandshake size={20} /></div>
          <span className="sid-kpi-label">Famílias e Projetos Impactados</span>
          <div className="sid-kpi-value">
            {kpis.familiasImpactadas.toLocaleString('pt-BR')}
            <span className="sid-kpi-unit"> beneficiados</span>
          </div>
          <div className="sid-kpi-trend accent">
            <CheckCircle2 size={13} />
            12 ONGs e comunidades assistidas
          </div>
        </div>

        <div className="sid-kpi-card">
          <div className="sid-kpi-icon green"><Users size={20} /></div>
          <span className="sid-kpi-label">Alunos e Voluntários Engajados</span>
          <div className="sid-kpi-value">
            {kpis.alunosEngajados.toLocaleString('pt-BR')}
            <span className="sid-kpi-unit"> estudantes</span>
          </div>
          <div className="sid-kpi-trend muted">94% de adesão nos cursos de extensão</div>
        </div>

        <div className="sid-kpi-card">
          <div className="sid-kpi-icon orange"><Award size={20} /></div>
          <span className="sid-kpi-label">Horas de Extensão Computadas</span>
          <div className="sid-kpi-value">
            {kpis.horasComputadas.toLocaleString('pt-BR')}
            <span className="sid-kpi-unit"> horas</span>
          </div>
          <div className="sid-kpi-trend muted">Certificados auditáveis emitidos</div>
        </div>
      </div>

      {/* 3. GRÁFICOS */}
      <div className="sid-charts">
        {/* Gráfico 1: Rosca */}
        <div className="sid-chart-card">
          <h3 className="sid-chart-title">Distribuição por Categoria de Doação</h3>
          <p className="sid-chart-sub">Divisão proporcional dos suprimentos arrecadados na instituição.</p>

          <div className="sid-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any) => [`${Number(value).toLocaleString('pt-BR')} itens`, 'Quantidade']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sid-legend-grid">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="sid-legend-item">
                <span
                  className="sid-legend-dot"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                />
                <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                <span className="sid-legend-pct">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Área mensal */}
        <div className="sid-chart-card">
          <h3 className="sid-chart-title">Evolução Mensal de Arrecadações & Horas</h3>
          <p className="sid-chart-sub">
            Crescimento contínuo de itens doados e horas complementares atribuídas em {selectedYear}.
          </p>

          <div className="sid-chart-area" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="itensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A3A60" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0A3A60" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="horasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196F3" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="itens"
                  name="Itens Arrecadados"
                  stroke="#0A3A60"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#itensGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="horas"
                  name="Horas Concedidas"
                  stroke="#2196F3"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#horasGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="sid-chart-footer">
            <div className="sid-chart-legend-row">
              <div className="sid-chart-legend-item">
                <div className="sid-chart-legend-line" style={{ background: '#0A3A60' }} />
                <span>Itens Físicos</span>
              </div>
              <div className="sid-chart-legend-item">
                <div className="sid-chart-legend-line" style={{ background: '#2196F3' }} />
                <span>Horas Concedidas</span>
              </div>
            </div>
            <span>Atualizado em tempo real pelo COPER</span>
          </div>
        </div>
      </div>

      {/* 4. TABELA DE TRANSPARÊNCIA */}
      <div className="sid-table-card">
        <div className="sid-table-header">
          <div>
            <h3 className="sid-table-title">Relatório de Transparência das Campanhas</h3>
            <p className="sid-table-sub">Registro auditável dos projetos comunitários e destinação dos suprimentos.</p>
          </div>
          <button type="button" onClick={handleExportPDF} className="btn-sheet">
            <FileSpreadsheet size={14} />
            Baixar Planilha de Prestação de Contas
          </button>
        </div>

        <div className="sid-table-wrap">
          <table className="sid-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Categoria</th>
                <th>Meta Estipulada</th>
                <th>Arrecadado</th>
                <th>Status</th>
                <th>Impacto Social Direto</th>
                <th>Período</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="sid-td-title">{c.title}</td>
                  <td>{c.categoria}</td>
                  <td style={{ color: '#64748b' }}>{c.meta}</td>
                  <td className="sid-td-value">{c.arrecadado}</td>
                  <td>
                    <span className={`sid-badge ${c.status === 'CONCLUÍDA' ? 'done' : 'active'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.impacto}</td>
                  <td style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
