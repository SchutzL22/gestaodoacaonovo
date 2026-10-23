import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHandHoldingHeart, faEnvelope, faLock, faEye, faEyeSlash,
  faUser, faIdCard, faGraduationCap, faBook, faUserPlus, faKey,
  faUserCheck, faArrowLeft, faMagnifyingGlass, faRightToBracket
} from '@fortawesome/free-solid-svg-icons';
import { login, cadastrarAluno, listarAlunos, atualizarPerfil } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const PAINEL = { LOGIN: 'login', CADASTRO: 'cadastro', ESQUECI: 'esqueci' };

export default function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [painel, setPainel] = useState(PAINEL.LOGIN);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Cadastro
  const [cad, setCad] = useState({ nome: '', cpf: '', email: '', matricula: '', curso: '', senha: '', confirmarSenha: '' });

  // Esqueci Senha
  const [recEmail, setRecEmail] = useState('');
  const [recNovaSenha, setRecNovaSenha] = useState('');
  const [recUsuario, setRecUsuario] = useState(null);
  const [etapaRec, setEtapaRec] = useState(1); // 1: buscar email, 2: nova senha

  function limpar() { setErro(''); setSucesso(''); }

  // ── Login ──────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    limpar();
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      const usuario = await login(email, senha);
      entrar(usuario);
      navigate(usuario.role === 'COPER' || usuario.role === 'PROFESSOR' ? '/dashboard' : '/meu-painel', { replace: true });
    } catch (err) {
      setErro(err?.response?.data?.message || err?.response?.data?.erro || err.message || 'Credenciais inválidas.');
    } finally { setLoading(false); }
  }

  // ── Cadastro ───────────────────────────────────────────────
  async function handleCadastro(e) {
    e.preventDefault();
    limpar();
    const { nome, cpf, email: cEmail, matricula, curso, senha: cSenha, confirmarSenha } = cad;
    if (!nome || !cEmail || !matricula || !cSenha) { setErro('Preencha todos os campos obrigatórios.'); return; }
    if (cSenha !== confirmarSenha) { setErro('As senhas não coincidem.'); return; }
    if (cSenha.length < 6) { setErro('Senha deve ter no mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      await cadastrarAluno({ nome, cpf, email: cEmail, matricula, curso, senha: cSenha });
      setSucesso('Conta criada com sucesso! Faça login.');
      setPainel(PAINEL.LOGIN);
      setEmail(cEmail);
    } catch (err) {
      setErro(err?.response?.data?.erro || err.message || 'Erro ao cadastrar.');
    } finally { setLoading(false); }
  }

  // ── Esqueci Senha ──────────────────────────────────────────
  async function handleBuscarEmail(e) {
    e.preventDefault();
    limpar();
    if (!recEmail) { setErro('Informe o e-mail.'); return; }
    setLoading(true);
    try {
      const alunos = await listarAlunos();
      const encontrado = alunos.find(a => a.email?.toLowerCase() === recEmail.toLowerCase());
      if (!encontrado) { setErro('E-mail não encontrado.'); setLoading(false); return; }
      setRecUsuario(encontrado);
      setEtapaRec(2);
    } catch (err) { setErro('Erro ao buscar usuário.'); }
    finally { setLoading(false); }
  }

  async function handleRedefinirSenha(e) {
    e.preventDefault();
    limpar();
    if (!recNovaSenha || recNovaSenha.length < 6) { setErro('Senha deve ter no mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      await atualizarPerfil(recUsuario.id, recUsuario.nome, recNovaSenha);
      setSucesso('Senha redefinida com sucesso! Faça login.');
      setPainel(PAINEL.LOGIN);
      setRecEmail(''); setRecNovaSenha(''); setRecUsuario(null); setEtapaRec(1);
    } catch (err) { setErro('Erro ao redefinir senha.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-box">

        {/* ── LOGIN ── */}
        {painel === PAINEL.LOGIN && (
          <div className="login-panel">
            <div className="logo-area">
              <div className="logo-icon">
                <FontAwesomeIcon icon={faHandHoldingHeart} />
              </div>
              <h1>COPER - FMP</h1>
              <p>Acesso ao Sistema de Doações</p>
            </div>

            {erro && <div className="login-error">{erro}</div>}
            {sucesso && <div className="login-success">{sucesso}</div>}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input type="email" placeholder="E-mail Institucional" value={email}
                  onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="input-group">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input type={mostrarSenha ? 'text' : 'password'} placeholder="Senha" value={senha}
                  onChange={e => setSenha(e.target.value)} required />
                <button type="button" className="btn-toggle-senha" onClick={() => setMostrarSenha(v => !v)}>
                  <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} />
                </button>
              </div>
              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} /> : <FontAwesomeIcon icon={faRightToBracket} />}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="login-links">
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.ESQUECI); }}>
                Esqueci minha senha
              </button>
              <span className="link-sep">·</span>
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.CADASTRO); }}>
                Criar conta
              </button>
            </div>
          </div>
        )}

        {/* ── CADASTRO ── */}
        {painel === PAINEL.CADASTRO && (
          <div className="login-panel">
            <div className="logo-area">
              <div className="logo-icon" style={{background:'linear-gradient(135deg,#27AE60,#1e8449)'}}>
                <FontAwesomeIcon icon={faUserPlus} />
              </div>
              <h1>Criar Conta</h1>
              <p>Cadastro exclusivo para alunos FMP</p>
            </div>

            {erro && <div className="login-error">{erro}</div>}

            <form onSubmit={handleCadastro}>
              {[
                { icon: faUser, key: 'nome', placeholder: 'Nome completo', type: 'text' },
                { icon: faIdCard, key: 'cpf', placeholder: 'CPF (somente números)', type: 'text' },
                { icon: faEnvelope, key: 'email', placeholder: 'E-mail (@aluno.fmpsc.edu.br)', type: 'email' },
                { icon: faGraduationCap, key: 'matricula', placeholder: 'Matrícula', type: 'text' },
                { icon: faBook, key: 'curso', placeholder: 'Curso (ex: ADS)', type: 'text' },
                { icon: faLock, key: 'senha', placeholder: 'Senha (mín. 6 caracteres)', type: 'password' },
                { icon: faLock, key: 'confirmarSenha', placeholder: 'Confirmar senha', type: 'password' },
              ].map(f => (
                <div className="input-group" key={f.key}>
                  <FontAwesomeIcon icon={f.icon} className="input-icon" />
                  <input type={f.type} placeholder={f.placeholder} value={cad[f.key]}
                    onChange={e => setCad(v => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} /> : <FontAwesomeIcon icon={faUserCheck} />}
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>

            <div className="login-links">
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.LOGIN); }}>
                <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao login
              </button>
            </div>
          </div>
        )}

        {/* ── ESQUECI SENHA ── */}
        {painel === PAINEL.ESQUECI && (
          <div className="login-panel">
            <div className="logo-area">
              <div className="logo-icon" style={{background:'linear-gradient(135deg,#F2994A,#d68910)'}}>
                <FontAwesomeIcon icon={faKey} />
              </div>
              <h1>Recuperar Acesso</h1>
              <p>
                {etapaRec === 1
                  ? 'Informe seu e-mail institucional'
                  : `Encontramos a conta de ${recUsuario?.nome}`}
              </p>
            </div>

            {erro && <div className="login-error">{erro}</div>}
            {sucesso && <div className="login-success">{sucesso}</div>}

            {etapaRec === 1 ? (
              <form onSubmit={handleBuscarEmail}>
                <div className="input-group">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input type="email" placeholder="E-mail institucional" value={recEmail}
                    onChange={e => setRecEmail(e.target.value)} required />
                </div>
                <button className="btn-login" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} /> : <FontAwesomeIcon icon={faMagnifyingGlass} />}
                  {loading ? 'Buscando...' : 'Buscar conta'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRedefinirSenha}>
                <div className="input-group">
                  <FontAwesomeIcon icon={faLock} className="input-icon" />
                  <input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={recNovaSenha}
                    onChange={e => setRecNovaSenha(e.target.value)} minLength={6} required />
                </div>
                <button className="btn-login" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} /> : <FontAwesomeIcon icon={faKey} />}
                  {loading ? 'Salvando...' : 'Redefinir Senha'}
                </button>
              </form>
            )}

            <div className="login-links">
              <button className="link-btn" onClick={() => { limpar(); setPainel(PAINEL.LOGIN); setEtapaRec(1); setRecUsuario(null); }}>
                <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
