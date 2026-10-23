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
  const [searchParams, setSearchParams] = useSearchParams();
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
  }, [searchParams]);

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
      // Chama o endpoint público de validação estilo Unisul
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Background radial ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-b from-teal-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Banner Institucional */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-extrabold text-lg tracking-wider">
              C3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg leading-tight tracking-tight text-white">
                  COPER 3.0
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
                  Portal de Autenticidade
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Verificação Pública e Criptográfica de Documentos Oficiais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <Link
              to="/impacto-social"
              className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 font-medium transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Impacto Social</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden md:block" />
            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-none">FMP • Palhoça</span>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700/80 font-medium transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acessar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auditoria Criptográfica de Autenticidade Digital</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Consulte a Autenticidade de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Certificados e Declarações</span>
          </h2>
          <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
            Insira o código verificador (hash) impresso no rodapé do documento oficial ou escaneie o QR Code para auditar sua veracidade em tempo real.
          </p>
        </div>

        {/* Formulário de Busca */}
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800/90 p-2 sm:p-2.5 rounded-2xl shadow-2xl shadow-black/60 mb-8 backdrop-blur-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidate();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Insira o código verificador (UUID/Hash)..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all font-mono shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <span>Verificar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="w-full max-w-2xl bg-red-950/40 border border-red-800/60 p-5 rounded-2xl text-red-200 flex items-start gap-4 mb-8 backdrop-blur-md">
            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-red-300">Documento Não Validado</h4>
              <p className="text-xs text-red-200/80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Cartão de Resultado da Validação */}
        {certificate && (
          <div className="w-full max-w-2xl bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 relative overflow-hidden backdrop-blur-xl">
            {/* Faixa decorativa superior com gradiente de alta segurança */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

            {/* Cabeçalho do Certificado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      DOCUMENTO AUTÊNTICO E VÁLIDO
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {certificate.documentTypeName}
                  </h3>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Autenticidade Garantida</span>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">Em conformidade com o regimento</span>
              </div>
            </div>

            {/* Dados do Titular e Curso/Doação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Beneficiário / Titular</span>
                </div>
                <p className="text-base font-bold text-white">{certificate.beneficiaryName}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">CPF: {certificate.beneficiaryCpfMasked}</p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Título do Documento</span>
                </div>
                <p className="text-base font-bold text-emerald-300">{certificate.title}</p>
                {certificate.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{certificate.description}</p>
                )}
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Horas Complementares Computadas</span>
                </div>
                <p className="text-2xl font-extrabold text-white">
                  {certificate.hoursCompleted}{' '}
                  <span className="text-sm font-normal text-slate-400">horas registradas</span>
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Data e Hora da Emissão</span>
                </div>
                <p className="text-sm font-semibold text-slate-200">{formatDate(certificate.issuedAt)}</p>
                <p className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Assinatura digital institucional registrada</span>
                </p>
              </div>
            </div>

            {/* Rodapé de Hash Verificador */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px] block mb-1">
                  Código Verificador Oficial (Hash)
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-xs sm:text-sm select-all break-all">
                    {certificate.authHash}
                  </span>
                  <button
                    onClick={() => copyToClipboard(certificate.authHash)}
                    title="Copiar código verificador"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`/api/v1/certificates/${certificate.authHash}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>Abrir PDF Oficial</span>
                  <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Card informativo de instruções quando nenhum certificado foi buscado ainda */}
        {!certificate && !loading && !error && (
          <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl text-center text-xs text-slate-400 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <p className="font-medium text-slate-300">Como funciona a validação?</p>
            <p className="mt-1 max-w-md mx-auto leading-relaxed">
              Todos os certificados e declarações de doação emitidos pelo COPER 3.0 possuem um identificador criptográfico único (Hash UUID) e um QR Code. Ao escanear o QR Code, a autenticidade e as horas são conferidas instantaneamente na base de dados oficial.
            </p>
          </div>
        )}
      </main>

      {/* Footer Institucional */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4">
          <p>© 2026 Sistema COPER 3.0 • Faculdade Municipal de Palhoça (FMP) • Todos os direitos reservados.</p>
          <p className="mt-1 text-slate-400">
            Ambiente de Verificação Criptográfica de Documentos Oficiais e Extensão Universitária.
          </p>
        </div>
      </footer>
    </div>
  );
}
