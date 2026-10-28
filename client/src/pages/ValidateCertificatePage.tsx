import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  Search,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  Building2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Lock,
  BarChart3,
  LogIn,
} from 'lucide-react';
import fmpLogo from '../assets/fmplogo.png';
import './ValidateCertificatePage.css';

interface CertificateData {
  isValid: boolean;
  status: string;
  authHash: string;
  beneficiaryName: string;
  beneficiaryCpfMasked: string;
  documentType: string;
  documentTypeName: string;
  title: string;
  description?: string;
  hoursCompleted: number;
  issuedAt: string;
  details?: {
    courseTitle?: string;
    classroomCode?: string;
    donationItemsCount?: number;
  };
}

export default function ValidateCertificatePage() {
  const [searchParams] = useSearchParams();
  const [hashInput, setHashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-busca se vier via query param do QR Code (/validar?code=HASH)
  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('hash');
    if (code) {
      setHashInput(code);
      handleValidate(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async (codeToVerify?: string) => {
    const code = (codeToVerify || hashInput).trim();
    if (!code) {
      setError('Por favor, informe o código verificador (Hash) do documento.');
      return;
    }

    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const response = await axios.get(`/api/v1/certificates/validate/${encodeURIComponent(code)}`);
      if (response.data?.data) {
        setCertificate(response.data.data);
      } else {
        throw new Error('Formato de resposta inesperado.');
      }
    } catch (err: any) {
      console.error('Erro na validação do certificado:', err);
      if (err.response?.status === 404) {
        setError('Documento não localizado. O código verificador informado não corresponde a nenhum registro oficial do Sistema COPER 3.0.');
      } else {
        setError(err.response?.data?.message || 'Falha ao consultar a autenticidade do documento. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="validate-page">
      {/* Background ambient glows */}
      <div className="validate-bg-glow vglow-top-right" />
      <div className="validate-bg-glow vglow-bottom-left" />

      {/* ── HEADER INSTITUCIONAL ──────────────────────────── */}
      <header className="validate-header">
        <div className="validate-header-inner">
          {/* Brand */}
          <Link to="/" className="validate-brand">
            <img src={fmpLogo} alt="Logo FMP" className="validate-brand-logo" />
            <div className="validate-brand-texts">
              <span className="validate-brand-title">COPER 3.0</span>
              <span className="validate-brand-sub">Portal de Autenticidade de Documentos</span>
            </div>
          </Link>

          {/* Nav direita */}
          <nav className="validate-header-nav">
            <div className="validate-header-badge" style={{ display: 'none' } as React.CSSProperties}>
              <Building2 size={13} />
              <span>FMP • Palhoça</span>
            </div>
            <Link to="/impacto-social" className="validate-header-link" style={{ display: 'none' } as React.CSSProperties}>
              <BarChart3 size={14} />
              <span>Impacto Social</span>
            </Link>
            {/* Badge institution */}
            <div className="validate-header-badge">
              <Building2 size={13} />
              <span>FMP • Palhoça</span>
            </div>
            <Link to="/login" className="btn-header-login">
              <LogIn size={14} />
              <span>Acessar</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ────────────────────────────── */}
      <main className="validate-main">

        {/* Hero */}
        <div className="validate-hero">
          <div className="validate-hero-badge">
            <ShieldCheck size={14} />
            <span>Auditoria Criptográfica de Autenticidade Digital</span>
          </div>
          <h1>
            Valide <span>Certificados e Declarações</span> Oficiais
          </h1>
          <p>
            Insira o código verificador (Hash) impresso no rodapé do documento oficial ou escaneie o QR Code para
            auditar sua veracidade em tempo real, diretamente na base de dados da FMP.
          </p>
        </div>

        {/* Formulário de busca */}
        <div className="validate-search-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidate();
            }}
            className="validate-search-form"
          >
            <div className="validate-search-input-wrap">
              <span className="validate-search-icon">
                <Search size={16} />
              </span>
              <input
                id="hash-input"
                type="text"
                className="validate-input"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Insira o código verificador (UUID / Hash)..."
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="btn-validate"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <span>Verificar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="validate-error">
            <XCircle size={20} />
            <div>
              <h4>Documento Não Validado</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ── RESULTADO DA VALIDAÇÃO ─────────────────────── */}
        {certificate && (
          <div className="validate-result-card">
            {/* Faixa topo decorativa */}
            <div className="validate-result-topbar" />

            {/* Cabeçalho do resultado */}
            <div className="validate-result-header">
              <div className="validate-status-valid">
                <div className="validate-status-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="validate-status-label">DOCUMENTO AUTÊNTICO E VÁLIDO</span>
                  <h3 className="validate-status-title">{certificate.documentTypeName}</h3>
                </div>
              </div>

              <div className="validate-authentic-badge">
                <Lock size={13} />
                <span>Autenticidade Garantida — Em conformidade com o regimento</span>
              </div>
            </div>

            {/* Grid de dados */}
            <div className="validate-fields-grid">
              {/* Beneficiário */}
              <div className="validate-field">
                <div className="validate-field-label">
                  <User size={13} />
                  Beneficiário / Titular
                </div>
                <p className="validate-field-value">{certificate.beneficiaryName}</p>
                <p className="validate-field-sub">CPF: {certificate.beneficiaryCpfMasked}</p>
              </div>

              {/* Título */}
              <div className="validate-field">
                <div className="validate-field-label">
                  <Award size={13} />
                  Título do Documento
                </div>
                <p className="validate-field-value accent">{certificate.title}</p>
                {certificate.description && (
                  <p className="validate-field-sub">{certificate.description}</p>
                )}
              </div>

              {/* Horas */}
              <div className="validate-field">
                <div className="validate-field-label">
                  <Clock size={13} />
                  Horas Complementares Computadas
                </div>
                <p className="validate-hours-big">
                  {certificate.hoursCompleted}
                  <span className="validate-hours-unit"> horas registradas</span>
                </p>
              </div>

              {/* Data de emissão */}
              <div className="validate-field">
                <div className="validate-field-label">
                  <Calendar size={13} />
                  Data e Hora da Emissão
                </div>
                <p className="validate-field-value">{formatDate(certificate.issuedAt)}</p>
                <p className="validate-field-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={11} style={{ color: '#0A3A60' }} />
                  Assinatura digital institucional registrada
                </p>
              </div>

              {/* Detalhes extras se houver */}
              {certificate.details?.courseTitle && (
                <div className="validate-field">
                  <div className="validate-field-label">
                    <FileText size={13} />
                    Curso / Projeto Associado
                  </div>
                  <p className="validate-field-value">{certificate.details.courseTitle}</p>
                  {certificate.details.classroomCode && (
                    <p className="validate-field-sub">Turma: {certificate.details.classroomCode}</p>
                  )}
                </div>
              )}

              {certificate.details?.donationItemsCount != null && (
                <div className="validate-field">
                  <div className="validate-field-label">
                    <Award size={13} />
                    Itens Doados Vinculados
                  </div>
                  <p className="validate-hours-big">
                    {certificate.details.donationItemsCount}
                    <span className="validate-hours-unit"> itens</span>
                  </p>
                </div>
              )}
            </div>

            {/* Hash e botão PDF */}
            <div className="validate-hash-area">
              <div className="validate-hash-info">
                <span className="validate-hash-label">Código Verificador Oficial (Hash)</span>
                <div className="validate-hash-row">
                  <span className="validate-hash-code">{certificate.authHash}</span>
                  <button
                    className={`btn-copy ${copied ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(certificate.authHash)}
                    title="Copiar código verificador"
                    type="button"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="validate-btn-row">
                <a
                  href={`/api/v1/certificates/${certificate.authHash}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-open-pdf"
                >
                  <FileText size={14} />
                  <span>Abrir PDF Oficial</span>
                  <ExternalLink size={12} style={{ opacity: 0.7 }} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── ESTADO INICIAL (sem busca) ─────────────────── */}
        {!certificate && !loading && !error && (
          <>
            <div className="validate-empty-card">
              <div className="validate-empty-icon">
                <QrCode size={24} />
              </div>
              <p className="validate-empty-title">Como funciona a validação?</p>
              <p className="validate-empty-desc">
                Todos os certificados e declarações de doação emitidos pelo COPER 3.0 possuem um identificador
                criptográfico único (Hash UUID) e um QR Code. Ao escanear o QR Code ou inserir o código acima,
                a autenticidade e as horas são conferidas instantaneamente na base de dados oficial da FMP.
              </p>
            </div>

            {/* Passos */}
            <div className="validate-steps">
              <div className="validate-step-card">
                <div className="validate-step-num">1</div>
                <p className="validate-step-title">Localize o Código</p>
                <p className="validate-step-desc">
                  Encontre o código verificador (Hash) no rodapé do certificado ou declaração oficial.
                </p>
              </div>
              <div className="validate-step-card">
                <div className="validate-step-num">2</div>
                <p className="validate-step-title">Insira ou Escaneie</p>
                <p className="validate-step-desc">
                  Cole o código no campo acima ou escaneie o QR Code com seu celular para preenchimento automático.
                </p>
              </div>
              <div className="validate-step-card">
                <div className="validate-step-num">3</div>
                <p className="validate-step-title">Resultado Imediato</p>
                <p className="validate-step-desc">
                  O sistema retorna autenticidade, dados do titular e horas computadas em tempo real.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER INSTITUCIONAL ──────────────────────────── */}
      <footer className="validate-footer">
        <p>
          © 2026 <strong>Sistema COPER 3.0</strong> • Faculdade Municipal de Palhoça (FMP) •
          Verificação Criptográfica de Documentos Oficiais.
        </p>
      </footer>
    </div>
  );
}
