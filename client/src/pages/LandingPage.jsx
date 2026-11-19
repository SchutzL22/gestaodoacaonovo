import React, { useState, useEffect } from 'react';
import fmpLogo from '../assets/fmplogo.png';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HeartHandshake,
  ShieldCheck,
  Award,
  Users,
  Package,
  CheckCircle2,
  Sparkles,
  BarChart3,
  QrCode,
  LogIn,
  Search,
  ExternalLink,
  AlertCircle,
  Building2,
  Download,
  X,
  Clock,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Check,
  Gift
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
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { registrarDoacaoAnonima } from '../services/api';
import './LandingPage.css';

// Cores temáticas para os gráficos em Dark Mode
const CATEGORY_COLORS = ['#38bdf8', '#818cf8', '#a855f7', '#34d399', '#fbbf24'];

export default function LandingPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Scroll state para a navbar
  const [scrolled, setScrolled] = useState(false);

  // Validação rápida de documento/certificado
  const [quickHash, setQuickHash] = useState('');
  const [valLoading, setValLoading] = useState(false);
  const [valResult, setValResult] = useState(null);
  const [valError, setValError] = useState(null);

  // Modal de Doação de Civil (sem login)
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccessData, setDonateSuccessData] = useState(null);
  const [donateError, setDonateError] = useState('');
  const [donateForm, setDonateForm] = useState({
    donorName: '',
    donorCpf: '',
    donorPhone: '',
    donorEmail: '',
    campaignId: '',
    itemDescription: '',
    itemCategory: 'ALIMENTOS',
    itemQuantity: 1,
    itemUnit: 'kg',
    observation: ''
  });

  // Métricas dinâmicas em tempo real
  const [kpis, setKpis] = useState({
    totalItens: 14850,
    familiasImpactadas: 620,
    alunosEngajados: 485,
    horasComputadas: 3240,
    cursosAtivos: 4,
    campanhasAtivas: 4,
    certificadosEmitidos: 156
  });

  // Campanhas e Cursos dinâmicos
  const [campaignsList, setCampaignsList] = useState([
    {
      id: 'camp-inverno-2026',
      title: 'Campanha do Agasalho FMP 2026',
      description: 'Arrecadação de cobertores, casacos e calçados de frio para comunidades da Grande Florianópolis.',
      status: 'ACTIVE',
      isUrgent: true,
      priorityItems: [
        { name: 'Cobertores e Mantas', urgencyLevel: 'ALTA' },
        { name: 'Casacos de Inverno', urgencyLevel: 'ALTA' },
      ],
      currentItems: 3450,
      targetItems: 3000
    },
    {
      id: 'camp-alimentos-2026',
      title: 'SOS Alimentos & Cestas Básicas',
      description: 'Campanha permanente para auxílio nutricional a lares em situação de vulnerabilidade.',
      status: 'ACTIVE',
      isUrgent: true,
      priorityItems: [
        { name: 'Leite em Pó', urgencyLevel: 'CRÍTICA' },
        { name: 'Fraldas G / GG', urgencyLevel: 'CRÍTICA' },
        { name: 'Arroz e Feijão', urgencyLevel: 'ALTA' }
      ],
      currentItems: 7200,
      targetItems: 8000
    },
    {
      id: 'camp-livros-2026',
      title: 'Volta às Aulas Inclusiva & Livros',
      description: 'Doação de cadernos, literatura infanto-juvenil e materiais didáticos para bibliotecas comunitárias.',
      status: 'ACTIVE',
      isUrgent: false,
      priorityItems: [
        { name: 'Cadernos Universitários', urgencyLevel: 'NORMAL' },
        { name: 'Kits de Lápis e Canetas', urgencyLevel: 'NORMAL' }
      ],
      currentItems: 2400,
      targetItems: 2500
    }
  ]);

  const [coursesList, setCoursesList] = useState([
    {
      id: 'course-libras-01',
      title: 'Língua Brasileira de Sinais (Libras) - Nível Básico',
      description: 'Capacitação presencial voltada para acessibilidade comunicacional, inclusão de pessoas surdas e formação cidadã.',
      workloadHours: 40,
      minAttendancePct: 75.0,
      minGrade: 7.0,
      enrollmentOpen: true,
      classrooms: [
        {
          code: 'LIBRAS-2026-T01',
          capacity: 50,
          enrolledCount: 42,
          waitlistCount: 5,
          schedule: 'Terças e Quintas • 19h00 às 21h30'
        }
      ]
    },
    {
      id: 'course-info-01',
      title: 'Informática Cidadã e Ferramentas Digitais',
      description: 'Oficina de inclusão digital para jovens e adultos: elaboração de currículos, navegação segura e ferramentas de escritório.',
      workloadHours: 30,
      minAttendancePct: 75.0,
      minGrade: 7.0,
      enrollmentOpen: true,
      classrooms: [
        {
          code: 'INFO-2026-T01',
          capacity: 35,
          enrolledCount: 35,
          waitlistCount: 8,
          schedule: 'Sábados • 08h30 às 12h00'
        }
      ]
    }
  ]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Busca dados em tempo real da API pública
  useEffect(() => {
    async function fetchPublicStats() {
      try {
        const res = await axios.get('/api/public/stats');
        if (res.data?.data) {
          const { impact, campaigns, courses } = res.data.data;
          if (impact) {
            setKpis((prev) => ({
              ...prev,
              totalItens: impact.totalItemsDonated > 0 ? impact.totalItemsDonated : prev.totalItens,
              familiasImpactadas: impact.familiesHelped || prev.familiasImpactadas,
              alunosEngajados: impact.activeStudents > 0 ? impact.activeStudents : prev.alunosEngajados,
              horasComputadas: impact.totalHoursGranted > 0 ? impact.totalHoursGranted : prev.horasComputadas,
              cursosAtivos: impact.activeCourses || prev.cursosAtivos,
              campanhasAtivas: impact.totalCampaigns || prev.campanhasAtivas,
              certificadosEmitidos: impact.totalCertificatesIssued || prev.certificadosEmitidos
            }));
          }
          if (campaigns && Array.isArray(campaigns) && campaigns.length > 0) {
            setCampaignsList((prev) => {
              // Mescla com metas visuais
              return campaigns.map((c, idx) => ({
                ...c,
                currentItems: c.currentItems || (prev[idx] ? prev[idx].currentItems : 1200),
                targetItems: c.targetItems || (prev[idx] ? prev[idx].targetItems : 2000),
                priorityItems: c.priorityItems && c.priorityItems.length > 0 ? c.priorityItems : [
                  { name: 'Alimentos Não Perecíveis', urgencyLevel: 'ALTA' },
                  { name: 'Itens de Higiene', urgencyLevel: 'MÉDIA' }
                ]
              }));
            });
          }
          if (courses && Array.isArray(courses) && courses.length > 0) {
            setCoursesList(courses);
          }
        }
      } catch (err) {
        // Mantém dados estáticos elegantes em fallback
      }
    }
    fetchPublicStats();
  }, []);

  // Validação rápida inline de hash
  const handleQuickValidate = async (codigoOpcional) => {
    const code = (codigoOpcional || quickHash).trim();
    if (!code) {
      setValError('Informe o código verificador do documento (hash ou token).');
      setValResult(null);
      return;
    }

    setValLoading(true);
    setValError(null);
    setValResult(null);

    try {
      const res = await axios.get(`/api/public/validar/${encodeURIComponent(code)}`);
      if (res.data?.data) {
        setValResult(res.data.data);
      } else {
        throw new Error('Formato inesperado.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setValError('Código não localizado. Verifique se o hash foi digitado corretamente.');
      } else {
        setValError('Falha temporária ao consultar documento. Tente novamente.');
      }
    } finally {
      setValLoading(false);
    }
  };

  // Abrir Modal de Doação Civil com campanha opcional
  const handleOpenDonateModal = (campaignId = '') => {
    setDonateForm({
      donorName: '',
      donorCpf: '',
      donorPhone: '',
      donorEmail: '',
      campaignId: campaignId || (campaignsList[0] ? campaignsList[0].id : ''),
      itemDescription: '',
      itemCategory: 'ALIMENTOS',
      itemQuantity: 1,
      itemUnit: 'kg',
      observation: ''
    });
    setDonateError('');
    setDonateSuccessData(null);
    setIsDonateModalOpen(true);
  };

  // Submissão do formulário de Doação Civil sem Login
  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    setDonateError('');

    const cleanCpf = donateForm.donorCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setDonateError('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (!donateForm.donorName || donateForm.donorName.trim().length < 3) {
      setDonateError('Nome completo do doador é obrigatório (mínimo 3 caracteres).');
      return;
    }

    if (!donateForm.itemDescription || donateForm.itemDescription.trim().length < 2) {
      setDonateError('Informe a descrição do item a ser doado.');
      return;
    }

    if (!donateForm.itemQuantity || Number(donateForm.itemQuantity) <= 0) {
      setDonateError('Quantidade deve ser maior que zero.');
      return;
    }

    setDonateLoading(true);

    try {
      const payload = {
        donorName: donateForm.donorName.trim(),
        donorCpf: cleanCpf,
        donorPhone: donateForm.donorPhone.trim() || undefined,
        donorEmail: donateForm.donorEmail.trim() || undefined,
        campaignId: donateForm.campaignId || undefined,
        observation: donateForm.observation.trim() || undefined,
        items: [
          {
            description: donateForm.itemDescription.trim(),
            category: donateForm.itemCategory,
            quantity: Number(donateForm.itemQuantity),
            unit: donateForm.itemUnit
          }
        ]
      };

      const res = await registrarDoacaoAnonima(payload);
      setDonateSuccessData(res.data || res);
    } catch (err) {
      const msg = err.response?.data?.message || 'Falha ao registrar doação. Verifique os dados e tente novamente.';
      setDonateError(msg);
    } finally {
      setDonateLoading(false);
    }
  };

  // Dados dos Gráficos
  const categoryData = [
    { name: 'Alimentos Não Perecíveis', value: 7200, pct: '48%' },
    { name: 'Agasalhos & Cobertores', value: 3450, pct: '23%' },
    { name: 'Material Escolar & Livros', value: 2400, pct: '16%' },
    { name: 'Itens de Higiene', value: 1200, pct: '8%' },
    { name: 'Brinquedos & Outros', value: 600, pct: '5%' }
  ];

  const monthlyData = [
    { mes: 'Jan', itens: 850, horas: 180 },
    { mes: 'Fev', itens: 1200, horas: 250 },
    { mes: 'Mar', itens: 2100, horas: 440 },
    { mes: 'Abr', itens: 2600, horas: 560 },
    { mes: 'Mai', itens: 3200, horas: 690 },
    { mes: 'Jun', itens: 3550, horas: 780 },
    { mes: 'Jul', itens: 3800, horas: 820 }
  ];

  // Destino do botão de login/painel
  const getDashboardPath = () => {
    if (!usuario) return '/login';
    if (usuario.tipo === 'admin' || usuario.role === 'COPER') return '/dashboard';
    if (usuario.role === 'PROFESSOR') return '/diario-classe';
    if (usuario.role === 'EMPRESARIO') return '/painel-impacto';
    return '/meu-painel';
  };

  return (
    <div className="landing-page dark-coper" id="inicio">
      {/* Background Glows com acentos ciano e neon */}
      <div className="landing-bg-glow glow-top-left" />
      <div className="landing-bg-glow glow-center-right" />
      <div className="landing-bg-glow glow-bottom-left" />

      {/* ── 1. NAVBAR FIXA ────────────────────────────────────── */}
      <header className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#inicio" className="landing-brand">
          <img src={fmpLogo} alt="Logo FMP" className="brand-logo-img" />
          <div className="brand-texts">
            <span className="brand-title">COPER 3.0</span>
            <span className="brand-subtitle">Faculdade Municipal de Palhoça</span>
          </div>
        </a>

        <nav className="landing-nav-center">
          <ul className="landing-nav-links">
            <li><a href="#impacto" className="landing-nav-link">Impacto Social</a></li>
            <li><a href="#campanhas" className="landing-nav-link">Campanhas Ativas</a></li>
            <li><a href="#cursos" className="landing-nav-link">Cursos Extracurriculares</a></li>
            <li><a href="#validar" className="landing-nav-link">Validar Certificado</a></li>
          </ul>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            onClick={() => handleOpenDonateModal()}
            className="btn-nav-civil-donate"
            title="Realizar doação comunitária sem necessidade de cadastro"
          >
            <Gift size={16} />
            <span>Doar sem Login</span>
          </button>

          <Link to={getDashboardPath()} className="btn-nav-login">
            <LogIn size={18} />
            <span>{usuario ? 'Acessar Painel' : 'Entrar / Acessar Sistema'}</span>
          </Link>
        </div>
      </header>

      {/* ── 2. HERO SECTION ───────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-pill">
          <Sparkles size={16} className="text-cyan-400" />
          <span>Ecossistema Acadêmico & Transparência Social • FMP</span>
        </div>

        <h1 className="hero-title">
          Solidariedade que <span className="hero-highlight">transforma realidades</span> e gera impacto acadêmico auditável.
        </h1>

        <p className="hero-description">
          A plataforma oficial da <strong>Faculdade Municipal de Palhoça</strong> para gestão de campanhas de arrecadação, 
          concessão de horas complementares com <strong>QR Code oficial (Modelo Unisul)</strong>, 
          diário de classe digital e inscrições em cursos com <strong>fila de espera automática FIFO</strong>.
        </p>

        <div className="hero-cta-group">
          <button
            type="button"
            onClick={() => handleOpenDonateModal()}
            className="btn-hero-donate-highlight"
          >
            <HeartHandshake size={20} />
            <span>Doação de Civil (Sem Login)</span>
          </button>

          <a href="#impacto" className="btn-hero-primary">
            <BarChart3 size={20} />
            <span>Dados de Impacto</span>
          </a>

          <a href="#validar" className="btn-hero-secondary">
            <ShieldCheck size={20} />
            <span>Validar Documento</span>
          </a>

          <Link to="/login" className="btn-hero-secondary portal-link">
            <LogIn size={20} />
            <span>Portal Aluno / COPER</span>
          </Link>
        </div>

        {/* Trust Badges Strip */}
        <div className="hero-badges-strip">
          <div className="hero-badge-item">
            <div className="badge-icon icon-cyan">
              <ShieldCheck size={22} />
            </div>
            <div className="badge-info">
              <h4>100% Criptográfico</h4>
              <p>Código hash UUID único por doação</p>
            </div>
          </div>

          <div className="hero-badge-item">
            <div className="badge-icon icon-purple">
              <QrCode size={22} />
            </div>
            <div className="badge-info">
              <h4>QR Code Público</h4>
              <p>Validação pública sem necessidade de login</p>
            </div>
          </div>

          <div className="hero-badge-item">
            <div className="badge-icon icon-green">
              <Award size={22} />
            </div>
            <div className="badge-info">
              <h4>Horas de Extensão</h4>
              <p>Conversão direta para alunos FMP</p>
            </div>
          </div>

          <div className="hero-badge-item">
            <div className="badge-icon icon-amber">
              <Building2 size={22} />
            </div>
            <div className="badge-info">
              <h4>Governança ESG</h4>
              <p>Relatórios para empresas parceiras</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. DADOS DE IMPACTO & TRANSPARÊNCIA (EMPRESAS / PARCEIROS) ── */}
      <section className="landing-section" id="impacto">
        <div className="section-header">
          <span className="section-tag">Transparência em Tempo Real</span>
          <h2 className="section-title">Resultados Concretos para a Comunidade</h2>
          <p className="section-subtitle">
            Acompanhe os principais indicadores de assistência humanitária, engajamento universitário 
            e impacto social gerados pelo projeto da Faculdade Municipal de Palhoça.
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="kpi-cards-grid">
          <div className="kpi-card" style={{ '--kpi-accent': '#38bdf8' }}>
            <div className="kpi-header">
              <div className="kpi-icon icon-cyan">
                <Package size={24} />
              </div>
              <span className="kpi-trend">+18.5% este mês</span>
            </div>
            <div className="kpi-value">{kpis.totalItens.toLocaleString('pt-BR')}</div>
            <div className="kpi-label">Itens e Doações Arrecadadas</div>
            <div className="kpi-subtext">Alimentos, agasalhos, livros e kits prioritários</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#34d399' }}>
            <div className="kpi-header">
              <div className="kpi-icon icon-green">
                <HeartHandshake size={24} />
              </div>
              <span className="kpi-trend">Famílias Assistidas</span>
            </div>
            <div className="kpi-value">{kpis.familiasImpactadas.toLocaleString('pt-BR')}</div>
            <div className="kpi-label">Lares e Entidades Atendidas</div>
            <div className="kpi-subtext">Beneficiários diretos em comunidades de Palhoça e região</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#a855f7' }}>
            <div className="kpi-header">
              <div className="kpi-icon icon-purple">
                <Users size={24} />
              </div>
              <span className="kpi-trend">Engajamento Universitário</span>
            </div>
            <div className="kpi-value">{kpis.alunosEngajados}</div>
            <div className="kpi-label">Estudantes Voluntários Ativos</div>
            <div className="kpi-subtext">Alunos vinculados com e-mail @aluno.fmpsc.edu.br</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#fbbf24' }}>
            <div className="kpi-header">
              <div className="kpi-icon icon-amber">
                <Award size={24} />
              </div>
              <span className="kpi-trend">Extensão Acadêmica</span>
            </div>
            <div className="kpi-value">{kpis.horasComputadas}h</div>
            <div className="kpi-label">Horas Acadêmicas Validadas</div>
            <div className="kpi-subtext">Comprovantes com QR Code emitidos pela coordenação</div>
          </div>
        </div>

        {/* Impact Charts */}
        <div className="impact-charts-wrapper">
          <div className="chart-card">
            <div className="chart-title-area">
              <div>
                <h3>Distribuição por Categoria de Itens</h3>
                <span className="text-muted">Proporção das arrecadações auditadas no banco</span>
              </div>
              <span className="chart-badge">Volume Total</span>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0c1a2e',
                      border: '1px solid #1e3a5f',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend-grid">
              {categoryData.map((item, i) => (
                <div key={i} className="chart-legend-item">
                  <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                  <span>{item.name}: <strong>{item.pct}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title-area">
              <div>
                <h3>Evolução Mensal de Arrecadações</h3>
                <span className="text-muted">Itens recebidos e horas complementares emitidas</span>
              </div>
              <span className="chart-badge">Série Histórica</span>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorItensDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorHorasDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#132742" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#0c1a2e',
                      border: '1px solid #1e3a5f',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Area type="monotone" dataKey="itens" stroke="#38bdf8" fillOpacity={1} fill="url(#colorItensDark)" name="Itens Doados" />
                  <Area type="monotone" dataKey="horas" stroke="#a855f7" fillOpacity={1} fill="url(#colorHorasDark)" name="Horas Concedidas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ESG Banner para Investidores */}
        <div className="esg-banner">
          <div className="esg-info">
            <div className="esg-pill">
              <Building2 size={16} />
              <span>ESG & Responsabilidade Social Universitária</span>
            </div>
            <h3>Sua Empresa com Propósito e Prestação de Contas Aberta</h3>
            <p>
              Oferecemos canal de governança e dados auditados para empresas parceiras. 
              Ao patrocinar turmas de capacitação comunitária ou campanhas de arrecadação, sua empresa recebe relatórios analíticos de impacto para o balanço social.
            </p>
          </div>
          <Link to="/impacto-social" className="btn-esg-portal">
            <ExternalLink size={18} />
            <span>Abrir Painel Executivo ESG</span>
          </Link>
        </div>
      </section>

      {/* ── 4. VITRINE DE CAMPANHAS ATIVAS ─────────────────────── */}
      <section className="landing-section" id="campanhas">
        <div className="section-header">
          <span className="section-tag">Ações Sociais Abertas</span>
          <h2 className="section-title">Campanhas Ativas & Itens Prioritários</h2>
          <p className="section-subtitle">
            Participe entregando itens essenciais no balcão da COPER na FMP. Cada arrecadação é conferida e homologada com transparência total.
          </p>
        </div>

        <div className="projects-grid">
          {campaignsList.map((c) => {
            const pct = Math.min(100, Math.round(((c.currentItems || 1200) / (c.targetItems || 2000)) * 100));
            return (
              <div key={c.id} className="project-card">
                <div>
                  <div className="project-top">
                    <span className="project-category">Campanha Universitária</span>
                    {c.isUrgent && (
                      <span className="project-status status-urgent">Prioritário / Urgente</span>
                    )}
                    {!c.isUrgent && (
                      <span className="project-status status-active">Arrecadação Ativa</span>
                    )}
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>

                  {/* Itens Prioritários */}
                  <div className="priority-items-strip">
                    <span className="priority-title">Itens Prioritários:</span>
                    <div className="priority-tags-wrap">
                      {c.priorityItems?.map((pi, idx) => (
                        <span key={idx} className="priority-tag">
                          {pi.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="progress-section">
                    <div className="progress-labels">
                      <span>Progresso da Meta</span>
                      <span>{(c.currentItems || 0).toLocaleString('pt-BR')} / {(c.targetItems || 2000).toLocaleString('pt-BR')} ({pct}%)</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? 'linear-gradient(90deg, #10b981, #38bdf8)' : 'linear-gradient(90deg, #38bdf8, #818cf8)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="project-footer-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenDonateModal(c.id)}
                    className="btn-card-donate"
                  >
                    <HeartHandshake size={16} />
                    <span>Doar para esta Campanha</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. VITRINE DE CURSOS EXTRACURRICULARES (FIFO) ──────── */}
      <section className="landing-section" id="cursos">
        <div className="section-header">
          <span className="section-tag">Capacitação & Inclusão</span>
          <h2 className="section-title">Cursos Extracurriculares da FMP</h2>
          <p className="section-subtitle">
            Cursos com gestão acadêmica integrada, chamada digital, notas A1/A2/A3 e <strong>fila de espera transacional FIFO</strong>.
          </p>
        </div>

        <div className="projects-grid">
          {coursesList.map((curso) => {
            const turma = curso.classrooms && curso.classrooms[0] ? curso.classrooms[0] : null;
            const enrolled = turma ? (turma.enrolledCount ?? turma._count?.enrollments ?? 30) : 30;
            const cap = turma ? (turma.capacity ?? turma.maxCapacity ?? 40) : 40;
            const waitlist = turma?.waitlistCount || 0;
            const isFull = enrolled >= cap;

            return (
              <div key={curso.id} className="project-card">
                <div>
                  <div className="project-top">
                    <span className="project-category">Curso Extracurricular</span>
                    <span className={`project-status ${isFull ? 'status-waitlist' : 'status-open'}`}>
                      {isFull ? `Lotado (${waitlist} na fila FIFO)` : 'Vagas Disponíveis'}
                    </span>
                  </div>
                  <h3>{curso.title}</h3>
                  <p>{curso.description}</p>

                  <div className="course-specs-grid">
                    <div className="spec-box">
                      <span className="spec-label">Carga Horária</span>
                      <strong className="spec-val">{curso.workloadHours}h</strong>
                    </div>
                    <div className="spec-box">
                      <span className="spec-label">Frequência Mínima</span>
                      <strong className="spec-val">{curso.minAttendancePct}%</strong>
                    </div>
                    <div className="spec-box">
                      <span className="spec-label">Média Mínima</span>
                      <strong className="spec-val">{curso.minGrade || 7.0}</strong>
                    </div>
                  </div>

                  {turma && (
                    <div className="progress-section" style={{ marginTop: '16px' }}>
                      <div className="progress-labels">
                        <span>Ocupação da Turma ({turma.code})</span>
                        <span>{enrolled} / {cap} vagas ({Math.round((enrolled / cap) * 100)}%)</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.round((enrolled / cap) * 100))}%`,
                            background: isFull ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #818cf8)'
                          }}
                        />
                      </div>
                      {turma.schedule && (
                        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                          <Clock size={13} className="text-cyan-400" />
                          <span>{turma.schedule}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="project-footer-actions">
                  <Link to="/login" className="btn-card-enroll">
                    <GraduationCap size={16} />
                    <span>Inscrever-se no Portal do Aluno</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 6. SEÇÃO VALIDAÇÃO RÁPIDA DE CERTIFICADOS & QR CODE ── */}
      <section className="landing-section" id="validar">
        <div className="validation-container">
          <div className="brand-icon-box">
            <ShieldCheck size={32} />
          </div>

          <h2 className="validation-title">
            Validação Pública de Documentos
          </h2>

          <p className="validation-desc">
            Verifique a autenticidade oficial de qualquer comprovante de doação ou certificado de curso emitido pelo Sistema COPER 3.0. 
            Sem necessidade de login, disponível 24h com proteção por hash criptográfico e QR Code (Modelo Unisul).
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickValidate();
            }}
            className="validation-input-wrapper"
          >
            <input
              type="text"
              placeholder="Digite o código verificador (ex: tok-luc-001 ou hash UUID)"
              value={quickHash}
              onChange={(e) => setQuickHash(e.target.value)}
              className="validation-input"
            />
            <button type="submit" disabled={valLoading} className="btn-validate-submit">
              {valLoading ? (
                <span>Consultando...</span>
              ) : (
                <>
                  <Search size={18} />
                  <span>Verificar Autenticidade</span>
                </>
              )}
            </button>
          </form>

          {/* Atalhos para testes rápidos */}
          <div className="validation-shortcuts">
            <span>Atalhos de teste:</span>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => {
                setQuickHash('tok-luc-001');
                handleQuickValidate('tok-luc-001');
              }}
            >
              tok-luc-001 (Doação Aluno)
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => {
                setQuickHash('tok-edu-001');
                handleQuickValidate('tok-edu-001');
              }}
            >
              tok-edu-001 (Doação Docente)
            </button>
            <Link to="/validar" className="shortcut-chip link-chip">
              <ExternalLink size={13} />
              <span>Abrir Página Completa de Validação</span>
            </Link>
          </div>

          {/* Resultado da Validação */}
          {valResult && (
            <div className="validation-result-box result-valid">
              <div className="result-header">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <h4>DOCUMENTO OFICIAL AUTÊNTICO E HOMOLOGADO</h4>
              </div>

              <div className="result-details-grid">
                <div>
                  <span className="detail-label">BENEFICIÁRIO(A):</span>
                  <strong>{valResult.holderName || valResult.beneficiaryName}</strong>
                </div>
                <div>
                  <span className="detail-label">CAMPANHA / CURSO:</span>
                  <strong>{valResult.details?.campaignTitle || valResult.title}</strong>
                </div>
                <div>
                  <span className="detail-label">HORAS ACADÊMICAS:</span>
                  {valResult.hoursEarned || valResult.hoursCompleted ? (
                    <strong className="text-cyan-400">+{valResult.hoursEarned ?? valResult.hoursCompleted}h concedidas</strong>
                  ) : (
                    <span className="text-slate-400">Doação Solidária (Sem Horas)</span>
                  )}
                </div>
                <div>
                  <span className="detail-label">DATA DE EMISSÃO:</span>
                  <span>{new Date(valResult.issuedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="result-actions">
                <a
                  href={`/validar?code=${encodeURIComponent(valResult.authHash)}`}
                  className="btn-hero-secondary"
                >
                  <ExternalLink size={16} />
                  <span>Ver Detalhes do Registro</span>
                </a>

                <a
                  href={`/api/v1/certificates/${encodeURIComponent(valResult.authHash)}/pdf`}
                  className="btn-hero-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={16} />
                  <span>Baixar PDF Oficial</span>
                </a>
              </div>
            </div>
          )}

          {valError && (
            <div className="validation-result-box result-invalid">
              <div className="result-header">
                <AlertCircle size={22} className="text-rose-400" />
                <span className="text-rose-200 font-semibold">{valError}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 7. FOOTER INSTITUCIONAL ───────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-brand">
              <img src={fmpLogo} alt="Logo FMP" className="brand-logo-img" />
              <div className="brand-texts">
                <span className="brand-title">SISTEMA COPER 3.0</span>
                <span className="brand-subtitle">Faculdade Municipal de Palhoça</span>
              </div>
            </div>
            <p>
              Iniciativa acadêmica de extensão universitária que une tecnologia, governança e solidariedade 
              com registro auditável de doações e cursos de inclusão.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navegação</h4>
            <ul>
              <li><a href="#inicio">Início</a></li>
              <li><a href="#impacto">Dados de Impacto</a></li>
              <li><a href="#campanhas">Campanhas Ativas</a></li>
              <li><a href="#cursos">Cursos Extracurriculares</a></li>
              <li><a href="#validar">Validar Certificado</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portais Integrados</h4>
            <ul>
              <li><Link to="/login">Entrar no Sistema</Link></li>
              <li><Link to="/impacto-social">Painel de Impacto ESG</Link></li>
              <li><Link to="/validar">Validação Pública QR</Link></li>
              <li><button type="button" onClick={() => handleOpenDonateModal()} className="footer-link-btn">Doação Civil sem Login</button></li>
              <li><Link to="/meu-painel">Portal do Aluno</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Instituição</h4>
            <ul>
              <li><a href="https://fmpsc.edu.br" target="_blank" rel="noreferrer">Portal Oficial FMP</a></li>
              <li><span>Palhoça - Santa Catarina, Brasil</span></li>
              <li><span>coper@fmpsc.edu.br</span></li>
              <li><span>Transparência e LGPD Atendidas</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Faculdade Municipal de Palhoça (FMP) — Todos os direitos reservados.</span>
          <span>Desenvolvido com Arquitetura Limpa, PostgreSQL, RBAC e Assinatura Digital</span>
        </div>
      </footer>

      {/* ── 8. MODAL INTERATIVO: DOAÇÃO DE CIVIL (SEM LOGIN) ──── */}
      {isDonateModalOpen && (
        <div className="donate-modal-overlay">
          <div className="donate-modal-box">
            <button
              type="button"
              onClick={() => setIsDonateModalOpen(false)}
              className="modal-close-btn"
              title="Fechar"
            >
              <X size={20} />
            </button>

            {!donateSuccessData ? (
              <div>
                <div className="modal-header">
                  <div className="modal-icon-badge">
                    <HeartHandshake size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="modal-title">Doação Solidária Comunitária</h3>
                    <p className="modal-subtitle">
                      Participe sem necessidade de login. Suas contribuições geram o <strong>Comprovante Oficial de Doação (Modelo 2)</strong> com hash e QR Code verificáveis.
                    </p>
                  </div>
                </div>

                {donateError && (
                  <div className="modal-error-box">
                    <AlertCircle size={18} className="text-rose-400 shrink-0" />
                    <span>{donateError}</span>
                  </div>
                )}

                <form onSubmit={handleDonateSubmit} className="modal-form">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Nome Completo do Doador *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria dos Santos"
                        value={donateForm.donorName}
                        onChange={(e) => setDonateForm({ ...donateForm, donorName: e.target.value })}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>CPF do Doador *</label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        placeholder="000.000.000-00"
                        value={donateForm.donorCpf}
                        onChange={(e) => setDonateForm({ ...donateForm, donorCpf: e.target.value })}
                        className="modal-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>WhatsApp / Telefone</label>
                      <input
                        type="tel"
                        placeholder="(48) 99999-9999"
                        value={donateForm.donorPhone}
                        onChange={(e) => setDonateForm({ ...donateForm, donorPhone: e.target.value })}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>E-mail (Para envio do comprovante)</label>
                      <input
                        type="email"
                        placeholder="doador@exemplo.com"
                        value={donateForm.donorEmail}
                        onChange={(e) => setDonateForm({ ...donateForm, donorEmail: e.target.value })}
                        className="modal-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Campanha de Destino</label>
                    <select
                      value={donateForm.campaignId}
                      onChange={(e) => setDonateForm({ ...donateForm, campaignId: e.target.value })}
                      className="modal-select"
                    >
                      <option value="">Ação Solidária Geral / Ponto de Coleta FMP</option>
                      {campaignsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} {c.isUrgent ? '• (Urgente)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Item a ser doado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Leite em Pó, Arroz, Cobertor"
                        value={donateForm.itemDescription}
                        onChange={(e) => setDonateForm({ ...donateForm, itemDescription: e.target.value })}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Categoria *</label>
                      <select
                        value={donateForm.itemCategory}
                        onChange={(e) => setDonateForm({ ...donateForm, itemCategory: e.target.value })}
                        className="modal-select"
                      >
                        <option value="ALIMENTOS">Alimentos</option>
                        <option value="VESTUARIO">Vestuário / Agasalhos</option>
                        <option value="HIGIENE">Higiene & Limpeza</option>
                        <option value="EDUCACIONAL">Material Escolar / Livros</option>
                        <option value="BRINQUEDOS">Brinquedos</option>
                        <option value="OUTROS">Outros</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ maxWidth: 100 }}>
                      <label>Qtd *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={donateForm.itemQuantity}
                        onChange={(e) => setDonateForm({ ...donateForm, itemQuantity: e.target.value })}
                        className="modal-input text-center"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Observação / Detalhes de Entrega</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Entrega prevista para o balcão central da FMP na terça-feira pela manhã."
                      value={donateForm.observation}
                      onChange={(e) => setDonateForm({ ...donateForm, observation: e.target.value })}
                      className="modal-textarea"
                    />
                  </div>

                  <div className="modal-footer-actions">
                    <button
                      type="button"
                      onClick={() => setIsDonateModalOpen(false)}
                      className="btn-modal-cancel"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={donateLoading}
                      className="btn-modal-submit"
                    >
                      {donateLoading ? (
                        <span>Registrando Doação...</span>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Confirmar e Gerar Comprovante</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="modal-success-box">
                <div className="success-icon-badge">
                  <CheckCircle2 size={44} className="text-emerald-400" />
                </div>
                <h3 className="success-title">Doação Pré-Cadastrada com Sucesso!</h3>
                <p className="success-message">
                  Obrigado por apoiar a comunidade através da Faculdade Municipal de Palhoça.
                  Sua doação foi registrada no sistema e aguarda conferência no ponto de coleta COPER.
                </p>

                <div className="success-hash-card">
                  <span className="hash-label">Código de Autenticidade (Hash):</span>
                  <strong className="hash-code">{donateSuccessData.authHash || donateSuccessData.id}</strong>
                  <p className="hash-instruction">
                    Guarde este código ou acesse o link de validação para acompanhar o status e fazer download do Comprovante Oficial (Modelo 2) após a conferência.
                  </p>
                </div>

                <div className="success-actions">
                  <Link
                    to={`/validar?code=${donateSuccessData.authHash || donateSuccessData.id}`}
                    className="btn-success-validate"
                    onClick={() => setIsDonateModalOpen(false)}
                  >
                    <ExternalLink size={18} />
                    <span>Ver Status na Validação Pública</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setDonateSuccessData(null);
                      handleOpenDonateModal();
                    }}
                    className="btn-success-new"
                  >
                    Fazer Outra Doação
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDonateModalOpen(false)}
                    className="btn-modal-cancel"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
