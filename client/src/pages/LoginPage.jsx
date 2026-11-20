import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faLock, faEye, faEyeSlash,
  faUser, faIdCard, faGraduationCap, faUserPlus, faKey,
  faUserCheck, faArrowLeft, faMagnifyingGlass, faRightToBracket,
  faChalkboardTeacher, faBriefcase, faUsers, faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { login, cadastrarAluno, solicitarRecuperacao, redefinirSenha } from '../services/api';
import { useAuth } from '../context/useAuth';
import { paginaInicial } from '../context/perfis';
import fmpLogo from '../assets/fmplogo.png';
import './LoginPage.css';

const PAINEL = { LOGIN: 'login', CADASTRO: 'cadastro', ESQUECI: 'esqueci' };

// Perfis RBAC suportados
const PERFIS = [
  { id: 'ALUNO', label: 'Aluno', icon: faGraduationCap, hint: 'Acesso a horas e campanhas', defaultEmail: 'lucas.schutz@aluno.fmpsc.edu.br', defaultPass: 'Aluno@2026' },
  { id: 'PROFESSOR', label: 'Professor', icon: faChalkboardTeacher, hint: 'Chamada e turmas', defaultEmail: 'prof.libras@fmpsc.edu.br', defaultPass: 'Prof@2026' },
  { id: 'COPER', label: 'COPER / Admin', icon: faShieldHalved, hint: 'Gestão completa', defaultEmail: 'coper@fmpsc.edu.br', defaultPass: 'Coper@2026' },
  { id: 'EMPRESARIO', label: 'Empresário', icon: faBriefcase, hint: 'Painel ESG e impacto', defaultEmail: 'parceiro@empresa.com.br', defaultPass: 'Empresa@2026' },
  { id: 'CIVIL', label: 'Civil', icon: faUsers, hint: 'Comunidade e doador', defaultEmail: 'civil@gmail.com', defaultPass: 'Civil@2026' }
];

export default function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [painel, setPainel] = useState(PAINEL.LOGIN);
  const [perfilSelecionado, setPerfilSelecionado] = useState('COPER');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Login
  const [email, setEmail] = useState(import.meta.env.DEV ? 'coper@fmpsc.edu.br' : '');
  const [senha, setSenha] = useState(import.meta.env.DEV ? 'Coper@2026' : '');

  // Cadastro
  const [cad, setCad] = useState({ nome: '', cpf: '', email: '', matricula: '', senha: '', confirmarSenha: '' });

  // Esqueci Senha
  const [recEmail, setRecEmail] = useState('');
  const [recNovaSenha, setRecNovaSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapaRec, setEtapaRec] = useState(1);

  function limpar() { setErro(''); setSucesso(''); }

  // Seleção rápida de perfil
  const handleSelectPerfil = (p) => {
    setPerfilSelecionado(p.id);
    setEmail(p.defaultEmail);
    setSenha(p.defaultPass);
    limpar();
  };

  // ── Login com RBAC ──────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    limpar();
    if (!email || !senha) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);
    try {
      const usuario = await login(email, senha);
      entrar(usuario);
      toast.success(`Bem-vindo(a), ${usuario.nome || 'Usuário'}!`);

      navigate(paginaInicial(usuario), { replace: true });
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.message || err?.response?.data?.erro || err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      toast.error('Erro ao efetuar login.');
    } finally {
      setLoading(false);
    }
  }

  // ── Cadastro ───────────────────────────────────────────────
  async function handleCadastro(e) {
    e.preventDefault();
    limpar();
    const { nome, cpf, email: cEmail, matricula, senha: cSenha, confirmarSenha } = cad;
    if (!nome || !cpf || !cEmail || !matricula || !cSenha) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    if (cSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (cSenha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await cadastrarAluno({ nome, cpf, email: cEmail, matricula, senha: cSenha });
      setSucesso('Conta de estudante criada com sucesso! Você já pode fazer login.');
      toast.success('Cadastro realizado com sucesso!');
      setPainel(PAINEL.LOGIN);
      setEmail(cEmail);
      setSenha('');
    } catch (err) {
      setErro(err?.response?.data?.details?.[0]?.message || err?.response?.data?.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  // ── Esqueci Senha ──────────────────────────────────────────
  async function handleBuscarEmail(e) {
    e.preventDefault();
    limpar();
    if (!recEmail) { setErro('Informe o e-mail cadastrado.'); return; }
    setLoading(true);
    try {
      const resposta = await solicitarRecuperacao(recEmail.trim());
      setSucesso(resposta.message);
      setEtapaRec(2);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao solicitar recuperação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRedefinirSenha(e) {
    e.preventDefault();
    limpar();
    if (!recNovaSenha || recNovaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await redefinirSenha(codigo.trim(), recNovaSenha);
      setSucesso('Senha redefinida com sucesso! Faça login com a nova senha.');
      toast.success('Senha atualizada com sucesso!');
      setPainel(PAINEL.LOGIN);
      setEmail(recEmail.trim());
      setSenha('');
      setRecEmail(''); setRecNovaSenha(''); setCodigo(''); setEtapaRec(1);
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Botão de Retorno à Landing Page */}
      <Link to="/" className="btn-back-landing" title="Voltar para a Página Inicial">
        <FontAwesomeIcon icon={faArrowLeft} />
        <span>Página Inicial / Institucional</span>
      </Link>

      <div className="login-box">

        {/* ── PAINEL LOGIN ── */}
        {painel === PAINEL.LOGIN && (
          <div className="login-panel">
            <div className="logo-area">
              <img src={fmpLogo} alt="Logo FMP" className="login-fmp-logo" />
              <h1>SISTEMA COPER 3.0</h1>
              <p>Autenticação Unificada • Faculdade Municipal de Palhoça</p>
            </div>

            {/* Seletor Dinâmico de Perfil RBAC */}
            {import.meta.env.DEV && <div className="profile-selector-area">
              <span className="profile-selector-title">Contas de demonstração</span>
              <div className="profile-pills-row">
                {PERFIS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`profile-pill ${perfilSelecionado === p.id ? 'active' : ''}`}
                    onClick={() => handleSelectPerfil(p)}
                  >
                    <FontAwesomeIcon icon={p.icon} />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>}

            {erro && <div className="login-error">{erro}</div>}
            {sucesso && <div className="login-success">{sucesso}</div>}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input
                  type="email"
                  placeholder="E-mail de acesso"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-senha"
                  onClick={() => setMostrarSenha(v => !v)}
                  tabIndex={-1}
                >
                  <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} />
                </button>
              </div>

              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <FontAwesomeIcon icon={faRightToBracket} />
                )}
                <span>{loading ? 'Validando Acesso...' : 'Entrar no Sistema'}</span>
              </button>
            </form>

            <div className="login-links">
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.ESQUECI); }}>
                Esqueci minha senha
              </button>
              <span className="link-sep">·</span>
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.CADASTRO); }}>
                Criar conta de Aluno
              </button>
            </div>
          </div>
        )}

        {/* ── PAINEL CADASTRO ── */}
        {painel === PAINEL.CADASTRO && (
          <div className="login-panel">
            <div className="logo-area">
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                <FontAwesomeIcon icon={faUserPlus} />
              </div>
              <h1>Novo Cadastro de Aluno</h1>
              <p>Exclusivo para estudantes vinculados à FMP</p>
            </div>

            {erro && <div className="login-error">{erro}</div>}

            <form onSubmit={handleCadastro}>
              {[
                { icon: faUser, key: 'nome', placeholder: 'Nome completo', type: 'text' },
                { icon: faIdCard, key: 'cpf', placeholder: 'CPF (somente números)', type: 'text' },
                { icon: faEnvelope, key: 'email', placeholder: 'E-mail institucional (@aluno.fmpsc.edu.br)', type: 'email' },
                { icon: faGraduationCap, key: 'matricula', placeholder: 'Número de Matrícula FMP', type: 'text' },
                { icon: faLock, key: 'senha', placeholder: 'Senha de acesso (mín. 6 dígitos)', type: 'password' },
                { icon: faLock, key: 'confirmarSenha', placeholder: 'Confirme a senha', type: 'password' },
              ].map(f => (
                <div className="input-group" key={f.key}>
                  <FontAwesomeIcon icon={f.icon} className="input-icon" />
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={cad[f.key]}
                    onChange={e => setCad(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                </div>
              ))}

              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <FontAwesomeIcon icon={faUserCheck} />}
                <span>{loading ? 'Cadastrando...' : 'Finalizar Cadastro'}</span>
              </button>
            </form>

            <div className="login-links">
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.LOGIN); }}>
                <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao login
              </button>
            </div>
          </div>
        )}

        {/* ── PAINEL ESQUECI SENHA ── */}
        {painel === PAINEL.ESQUECI && (
          <div className="login-panel">
            <div className="logo-area">
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                <FontAwesomeIcon icon={faKey} />
              </div>
              <h1>Recuperação de Senha</h1>
              <p>
                {etapaRec === 1
                  ? 'Informe o e-mail cadastrado.'
                  : 'Informe o código recebido por e-mail e a nova senha.'}
              </p>
            </div>

            {erro && <div className="login-error">{erro}</div>}
            {sucesso && <div className="login-success">{sucesso}</div>}

            {etapaRec === 1 ? (
              <form onSubmit={handleBuscarEmail}>
                <div className="input-group">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input
                    type="email"
                    placeholder="E-mail cadastrado"
                    value={recEmail}
                    onChange={e => setRecEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="btn-login" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <FontAwesomeIcon icon={faMagnifyingGlass} />}
                  <span>{loading ? 'Enviando...' : 'Enviar código'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRedefinirSenha}>
                <div className="input-group">
                  <FontAwesomeIcon icon={faKey} className="input-icon" />
                  <input aria-label="Código de recuperação" placeholder="Código recebido por e-mail"
                    value={codigo} onChange={e => setCodigo(e.target.value)} required autoComplete="one-time-code" />
                </div>
                <div className="input-group">
                  <FontAwesomeIcon icon={faLock} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    value={recNovaSenha}
                    onChange={e => setRecNovaSenha(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <button className="btn-login" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <FontAwesomeIcon icon={faKey} />}
                  <span>{loading ? 'Atualizando...' : 'Definir Nova Senha'}</span>
                </button>
              </form>
            )}

            <div className="login-links">
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.LOGIN); setEtapaRec(1); setCodigo(''); }}>
                <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
