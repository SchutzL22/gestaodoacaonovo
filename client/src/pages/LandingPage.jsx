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
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  QrCode,
  LogIn,
  Search,
  ExternalLink,
  BookOpen,
  Calendar,
  Building2,
  Clock,
  Layers,
  ChevronRight,
  FileCheck2,
  Download,
  AlertCircle
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
import './LandingPage.css';

// Cores temáticas para os gráficos
const CATEGORY_COLORS = ['#0284c7', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

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

  // Métricas dinâmicas em tempo real
  const [kpis, setKpis] = useState({
    totalItens: 14850,
    familiasImpactadas: 620,
    alunosEngajados: 485,
    horasComputadas: 3240,
    cursosAtivos: 4,
    campanhasAtivas: 4
  });

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
        if (res.data?.data?.impact) {
          const imp = res.data.data.impact;
          setKpis((prev) => ({
            ...prev,
            totalItens: imp.totalItemsDonated > 0 ? imp.totalItemsDonated : prev.totalItens,
            familiasImpactadas: imp.familiesHelped || prev.familiasImpactadas,
            alunosEngajados: imp.activeStudents > 0 ? imp.activeStudents : prev.alunosEngajados,
            horasComputadas: imp.totalHoursGranted > 0 ? imp.totalHoursGranted : prev.horasComputadas,
            cursosAtivos: imp.coursesOffered || prev.cursosAtivos,
            campanhasAtivas: imp.activeCampaigns || prev.campanhasAtivas
          }));
        }
      } catch (err) {
        // Mantém dados institucionais de demonstração
      }
    }
    fetchPublicStats();
  }, []);

  // Validação rápida inline de hash
  const handleQuickValidate = async (codigoOpcional) => {
    const code = (codigoOpcional || quickHash).trim();
    if (!code) {
      setValError('Informe o código verificador do documento.');
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
    if (usuario.role === 'PROFESSOR') return '/chamada';
    if (usuario.role === 'EMPRESARIO') return '/impacto-social';
    return '/meu-painel';
  };

  return (
    <div className="landing-page" id="inicio">
      {/* Background Glows */}
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

        <nav>
          <ul className="landing-nav-links">
            <li><a href="#inicio" className="landing-nav-link">Início</a></li>
            <li><a href="#impacto" className="landing-nav-link">Dados de Impacto</a></li>
            <li><a href="#projetos" className="landing-nav-link">Projetos & Cursos</a></li>
            <li><a href="#como-doar" className="landing-nav-link">Como Doar</a></li>
            <li><a href="#validar" className="landing-nav-link">Validar Certificado</a></li>
          </ul>
        </nav>

        <div className="nav-actions">
          <Link to={getDashboardPath()} className="btn-nav-login">
            <LogIn size={18} />
            <span>{usuario ? 'Ir para o Painel' : 'Acessar Sistema / Login'}</span>
          </Link>
        </div>
      </header>

      {/* ── 2. HERO SECTION ───────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-pill">
          <Sparkles size={16} />
          <span>Plataforma Unificada de Gestão Social & Cursos Extracurriculares</span>
        </div>

        <h1 className="hero-title">
          Solidariedade que <span className="hero-highlight">transforma vidas</span> e impulsiona a formação acadêmica.
        </h1>

        <p className="hero-description">
          O <strong>Sistema COPER 3.0</strong> conecta estudantes, coordenação universitária e empresas parceiras 
          em um ecossistema transparente de doações, emissão auditável de horas complementares e cursos extracurriculares como Libras.
        </p>

        <div className="hero-cta-group">
          <a href="#impacto" className="btn-hero-primary">
            <BarChart3 size={20} />
            <span>Ver Dados de Impacto</span>
          </a>

          <a href="#validar" className="btn-hero-secondary">
            <ShieldCheck size={20} />
            <span>Verificar Autenticidade (Hash / QR)</span>
          </a>

          <Link to="/login" className="btn-hero-secondary">
            <LogIn size={20} />
            <span>Portal do Aluno & COPER</span>
          </Link>
        </div>

        {/* Trust Badges Strip */}
        <div className="hero-badges-strip">
          <div className="hero-badge-item">
            <div className="badge-icon icon-cyan">
              <ShieldCheck size={22} />
            </div>
            <div className="badge-info">
              <h4>100% Auditável</h4>
              <p>Código hash único por doação</p>
            </div>
          </div>

          <div className="hero-badge-item">
            <div className="badge-icon icon-purple">
              <QrCode size={22} />
            </div>
            <div className="badge-info">
              <h4>QR Code Oficial</h4>
              <p>Validação pública sem login</p>
            </div>
          </div>

          <div className="hero-badge-item">
            <div className="badge-icon icon-green">
              <Award size={22} />
            </div>
            <div className="badge-info">
              <h4>Horas Acadêmicas</h4>
              <p>Conversão direta para alunos</p>
            </div>
          </div>

          <div className="hero-badge-item">
            <div className="badge-icon icon-amber">
              <Building2 size={22} />
            </div>
            <div className="badge-info">
              <h4>Parcerias ESG</h4>
              <p>Relatórios para empresas parceiras</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. DADOS DE IMPACTO & TRANSPARÊNCIA (EMPRESAS / PARCEIROS) ── */}
      <section className="landing-section" id="impacto">
        <div className="section-header">
          <span className="section-tag">Transparência & Governança Social</span>
          <h2 className="section-title">Resultados Concretos em Tempo Real</h2>
          <p className="section-subtitle">
            Acompanhe os principais indicadores de assistência comunitária, engajamento universitário 
            e impacto social gerados pelo projeto da Faculdade Municipal de Palhoça.
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="kpi-cards-grid">
          <div className="kpi-card" style={{ '--kpi-accent': '#0284c7' }}>
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

          <div className="kpi-card" style={{ '--kpi-accent': '#10b981' }}>
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

          <div className="kpi-card" style={{ '--kpi-accent': '#8b5cf6' }}>
            <div className="kpi-header">
              <div className="kpi-icon icon-purple">
                <Users size={24} />
              </div>
              <span className="kpi-trend">Engajamento Total</span>
            </div>
            <div className="kpi-value">{kpis.alunosEngajados}</div>
            <div className="kpi-label">Estudantes Universitários Ativos</div>
            <div className="kpi-subtext">Alunos voluntários de cursos de graduação FMP</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
            <div className="kpi-header">
              <div className="kpi-icon icon-amber">
                <Award size={24} />
              </div>
              <span className="kpi-trend">Atividades Complementares</span>
            </div>
            <div className="kpi-value">{kpis.horasComputadas}h</div>
            <div className="kpi-label">Horas Acadêmicas Validadas</div>
            <div className="kpi-subtext">Certificados oficiais emitidos com selo de extensão</div>
          </div>
        </div>

        {/* Impact Charts */}
        <div className="impact-charts-wrapper">
          <div className="chart-card">
            <div className="chart-title-area">
              <div>
                <h3>Distribuição por Categoria de Itens</h3>
                <span className="text-muted">Proporção das arrecadações auditadas</span>
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
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
              {categoryData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CATEGORY_COLORS[i] }} />
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
                    <linearGradient id="colorItens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Area type="monotone" dataKey="itens" stroke="#0284c7" fillOpacity={1} fill="url(#colorItens)" name="Itens Doados" />
                  <Area type="monotone" dataKey="horas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHoras)" name="Horas Concedidas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ESG Banner para Investidores */}
        <div className="esg-banner">
          <div className="esg-info">
            <h3>Sua Empresa com Propósito e Alinhamento ESG</h3>
            <p>
              Oferecemos canal de prestação de contas aberto para empresas privadas e parceiros corporativos. 
              Ao patrocinar turmas de capacitação ou campanhas de arrecadação, sua instituição recebe relatórios detalhados de impacto.
            </p>
          </div>
          <Link to="/impacto-social" className="btn-esg-portal">
            <ExternalLink size={18} />
            <span>Acessar Painel Analítico Completo</span>
          </Link>
        </div>
      </section>

      {/* ── 4. PROJETOS SOCIAIS & CURSOS EXTRACURRICULARES ─────── */}
      <section className="landing-section" id="projetos">
        <div className="section-header">
          <span className="section-tag">Extensão & Capacitação</span>
          <h2 className="section-title">Projetos Ativos e Cursos Comunitários</h2>
          <p className="section-subtitle">
            Iniciativas acadêmicas que unem formação técnica e compromisso cidadão com a comunidade.
          </p>
        </div>

        <div className="projects-grid">
          {/* Card Curso Libras */}
          <div className="project-card">
            <div>
              <div className="project-top">
                <span className="project-category">Curso Extracurricular</span>
                <span className="project-status status-open">Inscrições Abertas</span>
              </div>
              <h3>Língua Brasileira de Sinais (Libras)</h3>
              <p>
                Capacitação com foco em acessibilidade e inclusão social. Gestão com fila de espera transacional FIFO 
                automática para estudantes e membros da comunidade.
              </p>
              <div className="progress-section">
                <div className="progress-labels">
                  <span>Preenchimento de Vagas</span>
                  <span>42 / 50 vagas (84%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '84%', background: 'linear-gradient(90deg, #8b5cf6, #38bdf8)' }} />
                </div>
              </div>
            </div>
            <div className="project-footer-meta">
              <span>Carga Horária: 60h</span>
              <span>Chamada Mobile-First</span>
            </div>
          </div>

          {/* Card Campanha Inverno */}
          <div className="project-card">
            <div>
              <div className="project-top">
                <span className="project-category">Campanha Ativa</span>
                <span className="project-status status-active">Arrecadação Ativa</span>
              </div>
              <h3>Campanha do Agasalho Palhoça</h3>
              <p>
                Arrecadação de casacos, cobertores e calçados para acolhimento de famílias em vulnerabilidade térmica 
                durante as frentes frias do inverno catarinense.
              </p>
              <div className="progress-section">
                <div className="progress-labels">
                  <span>Meta de Peças</span>
                  <span>3.450 / 3.000 (115%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                </div>
              </div>
            </div>
            <div className="project-footer-meta">
              <span>Regra: 1 agasalho = 5h</span>
              <span>Meta Superada</span>
            </div>
          </div>

          {/* Card SOS Enchentes */}
          <div className="project-card">
            <div>
              <div className="project-top">
                <span className="project-category">Ação Emergencial</span>
                <span className="project-status status-active">Prioritário</span>
              </div>
              <h3>SOS Alimentos & Água Potável</h3>
              <p>
                Mobilização contínua para envio de cestas básicas, fardos de água mineral e produtos de higiene 
                para municípios atingidos por emergências climáticas.
              </p>
              <div className="progress-section">
                <div className="progress-labels">
                  <span>Meta de Alimentos</span>
                  <span>7.200 / 8.000 kg (90%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '90%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                </div>
              </div>
            </div>
            <div className="project-footer-meta">
              <span>Regra: 1kg = 2h</span>
              <span>Ponto de Coleta FMP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. COMO PARTICIPAR / COMO DOAR ────────────────────── */}
      <section className="landing-section" id="como-doar">
        <div className="section-header">
          <span className="section-tag">Engajamento Comunitário</span>
          <h2 className="section-title">Como Participar e Apoiar</h2>
          <p className="section-subtitle">
            Fluxos simplificados para alunos, empresas e cidadãos fazerem parte desta rede de solidariedade.
          </p>
        </div>

        <div className="how-it-works-grid">
          {/* Para Alunos */}
          <div className="how-card">
            <span className="how-step-badge">1</span>
            <div className="how-card-icon">
              <Award size={26} />
            </div>
            <h3>Para Estudantes FMP</h3>
            <p>Conquiste horas complementares acadêmicas comprovadas enquanto apoia ações reais:</p>
            <ul>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Escolha uma campanha ativa com itens prioritários</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Realize a entrega no ponto oficial de coleta</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Validação automática pela equipe da COPER</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Emissão imediata do certificado com QR Code</li>
            </ul>
          </div>

          {/* Para Empresas */}
          <div className="how-card">
            <span className="how-step-badge">2</span>
            <div className="how-card-icon">
              <Building2 size={26} />
            </div>
            <h3>Para Empresas & Parceiros</h3>
            <p>Fortaleça sua marca empregadora e métricas de responsabilidade corporativa (ESG):</p>
            <ul>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Doações de lotes corporativos de suprimentos</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Apoio e patrocínio a turmas de Libras comunitário</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Relatórios executivos de prestação de contas</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Selo "Empresa Cidadã FMP" para seu balanço</li>
            </ul>
          </div>

          {/* Para Comunidade */}
          <div className="how-card">
            <span className="how-step-badge">3</span>
            <div className="how-card-icon">
              <Users size={26} />
            </div>
            <h3>Para a Sociedade Civil</h3>
            <p>Participe de cursos gratuitos de capacitação e apoie iniciativas locais:</p>
            <ul>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Inscrições em cursos de extensão presenciais</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Doação espontânea de roupas, livros e brinquedos</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Consulta aberta de destino de cada arrecadação</li>
              <li><CheckCircle2 size={16} color="#38bdf8" /> Acesso irrestrito à validação de documentos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 6. SEÇÃO VALIDAÇÃO RÁPIDA DE CERTIFICADOS & QR CODE ── */}
      <section className="landing-section" id="validar">
        <div className="validation-container">
          <div className="brand-icon-box" style={{ margin: '0 auto 16px', width: 56, height: 56 }}>
            <ShieldCheck size={30} />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            Validação Pública de Documentos
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            Verifique a autenticidade oficial de qualquer certificado ou declaração de horas emitido pelo Sistema COPER 3.0. 
            Sem necessidade de login, disponível 24h para qualquer instituição de ensino ou empregador.
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
              placeholder="Digite o código verificador (ex: tok-luc-001)"
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
            <span>Códigos de teste rápido:</span>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => {
                setQuickHash('tok-luc-001');
                handleQuickValidate('tok-luc-001');
              }}
            >
              tok-luc-001
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => {
                setQuickHash('tok-edu-001');
                handleQuickValidate('tok-edu-001');
              }}
            >
              tok-edu-001
            </button>
          </div>

          {/* Resultado da Validação */}
          {valResult && (
            <div className="validation-result-box result-valid">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle2 size={24} color="#10b981" />
                <h4 style={{ margin: 0, color: '#34d399', fontSize: '1.1rem', fontWeight: 700 }}>
                  DOCUMENTO OFICIAL AUTÊNTICO E VÁLIDO
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>BENEFICIÁRIO(A):</span>
                  <strong>{valResult.beneficiaryName}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>CAMPANHA / CURSO:</span>
                  <strong>{valResult.details?.campaignTitle || valResult.title}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>HORAS COMPLEMENTARES:</span>
                  <strong style={{ color: '#38bdf8' }}>+{valResult.hoursCompleted}h concedidas</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>DATA DE EMISSÃO:</span>
                  <span>{new Date(valResult.issuedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href={`/validar?code=${encodeURIComponent(valResult.authHash)}`}
                  className="btn-hero-secondary"
                  style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                >
                  <ExternalLink size={16} />
                  <span>Ver Página Completa de Auditoria</span>
                </a>

                {valResult.details?.doacaoId && (
                  <a
                    href={`/api/certificados/download/${valResult.details.doacaoId}`}
                    className="btn-hero-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={16} />
                    <span>Baixar PDF Oficial</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {valError && (
            <div className="validation-result-box result-invalid">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={22} color="#f87171" />
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>{valError}</span>
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
              Iniciativa acadêmica de extensão para conectar a comunidade estudantil 
              à transformação social por meio de doações auditáveis e cursos extracurriculares.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navegação</h4>
            <ul>
              <li><a href="#inicio">Início</a></li>
              <li><a href="#impacto">Dados de Impacto</a></li>
              <li><a href="#projetos">Projetos & Cursos</a></li>
              <li><a href="#como-doar">Como Doar</a></li>
              <li><a href="#validar">Validar Documento</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portais</h4>
            <ul>
              <li><Link to="/login">Acesso ao Sistema</Link></li>
              <li><Link to="/impacto-social">Painel de Impacto ESG</Link></li>
              <li><Link to="/validar">Validação Pública</Link></li>
              <li><Link to="/meu-painel">Portal do Aluno</Link></li>
              <li><Link to="/dashboard">Coordenação COPER</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Instituição</h4>
            <ul>
              <li><a href="https://fmpsc.edu.br" target="_blank" rel="noreferrer">Portal FMP</a></li>
              <li><span>Palhoça - SC, Brasil</span></li>
              <li><span>coper@fmpsc.edu.br</span></li>
              <li><span>LGPD & Transparência Pública</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Faculdade Municipal de Palhoça (FMP) — Todos os direitos reservados.</span>
          <span>Desenvolvido com Clean Architecture & Proteção Criptográfica</span>
        </div>
      </footer>
    </div>
  );
}
