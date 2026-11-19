import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHandHoldingHeart, faChartPie, faPlusCircle, faClipboardCheck,
  faBullhorn, faStar, faChartBar, faUserGear, faUserGraduate,
  faClockRotateLeft, faBars, faBell, faUser, faRightFromBracket,
  faMagnifyingGlass, faUserCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { listarNotificacoes, pesquisaGlobal } from '../../services/api';
import fmpLogo from '../../assets/fmplogo.png';
import './AppLayout.css';

const ADMIN_MENU = [
  { to: '/dashboard',          icon: faChartPie,         label: 'Dashboard'         },
  { to: '/gestao-cursos',      icon: faUserGraduate,     label: 'Gestão de Cursos'  },
  { to: '/registrar-doacao',   icon: faPlusCircle,       label: 'Registrar Doação'  },
  { to: '/validar-doacoes',    icon: faClipboardCheck,   label: 'Validar Doações'   },
  { to: '/campanhas',          icon: faBullhorn,         label: 'Campanhas'         },
  { to: '/itens-prioritarios', icon: faStar,             label: 'Itens Prioritários'},
  { to: '/relatorios',         icon: faChartBar,         label: 'Relatórios'        },
  { to: '/editar-perfil',      icon: faUserGear,         label: 'Editar Perfil'     },
];

const PROFESSOR_MENU = [
  { to: '/diario-classe',      icon: faClipboardCheck,   label: 'Diário de Classe'  },
  { to: '/registrar-doacao',   icon: faPlusCircle,       label: 'Doar para Campanha'},
  { to: '/campanhas-ativas',   icon: faBullhorn,         label: 'Campanhas'         },
  { to: '/editar-perfil',      icon: faUserGear,         label: 'Editar Perfil'     },
];

const EMPRESARIO_MENU = [
  { to: '/painel-impacto',     icon: faChartBar,         label: 'Painel ESG & Impacto' },
  { to: '/registrar-doacao',   icon: faPlusCircle,       label: 'Patrocinar / Doar'   },
  { to: '/campanhas-ativas',   icon: faBullhorn,         label: 'Campanhas Ativas'     },
  { to: '/editar-perfil',      icon: faUserGear,         label: 'Editar Perfil'        },
];

const ALUNO_MENU = [
  { to: '/meu-painel',         icon: faUserGraduate,     label: 'Meu Painel'        },
  { to: '/meus-cursos',        icon: faClipboardCheck,   label: 'Meus Cursos & Vagas'},
  { to: '/campanhas-ativas',   icon: faBullhorn,         label: 'Campanhas Ativas'  },
  { to: '/historico',          icon: faClockRotateLeft,  label: 'Meu Histórico'     },
  { to: '/editar-perfil',      icon: faUserGear,         label: 'Editar Perfil'     },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Geral (COPER)',
  '/painel-impacto': 'Dashboard Executivo de Impacto ESG',
  '/gestao-cursos': 'Gestão de Cursos & Turmas (COPER)',
  '/diario-classe': 'Diário de Classe Digital (Chamada & Avaliações)',
  '/chamada': 'Chamada Online',
  '/professor/chamada': 'Chamada Online',
  '/meus-cursos': 'Meus Cursos Extracurriculares',
  '/registrar-doacao': 'Registrar Doação',
  '/validar-doacoes': 'Validar Doações',
  '/campanhas': 'Campanhas',
  '/itens-prioritarios': 'Itens Prioritários',
  '/relatorios': 'Relatórios de Impacto',
  '/meu-painel': 'Painel do Estudante',
  '/campanhas-ativas': 'Campanhas Ativas',
  '/historico': 'Meu Histórico & Certificados',
  '/editar-perfil': 'Editar Perfil',
};

export default function AppLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ students: [], campaigns: [], donations: [] });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const userRole = (usuario?.role || usuario?.tipo || '').toUpperCase();
  let menu = ALUNO_MENU;
  if (userRole === 'COPER' || userRole === 'ADMIN') {
    menu = ADMIN_MENU;
  } else if (userRole === 'PROFESSOR') {
    menu = PROFESSOR_MENU;
  } else if (userRole === 'EMPRESARIO') {
    menu = EMPRESARIO_MENU;
  }

  // Carrega notificações para o usuário logado
  useEffect(() => {
    if (usuario?.id) {
      listarNotificacoes(usuario.id)
        .then(setNotificacoes)
        .catch(() => {});
    }
  }, [usuario]);

  // Barra de Pesquisa Global com Debounce de 300ms
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults({ students: [], campaigns: [], donations: [] });
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await pesquisaGlobal(searchQuery.trim());
        setSearchResults(data || { students: [], campaigns: [], donations: [] });
        setSearchOpen(true);
      } catch (err) {
        console.error('Erro na pesquisa global:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    sair();
    navigate('/login', { replace: true });
  }

  // Determina título da página atual
  const currentPath = window.location.pathname;
  const pageTitle = PAGE_TITLES[currentPath] || 'COPER FMP';

  return (
    <div className="app-layout">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <NavLink to="/" className="sidebar-brand" title="Ir para a Página Inicial / Institucional">
          <img src={fmpLogo} alt="Logo FMP" className="sidebar-fmp-logo" />
          <div className="sidebar-brand-texts">
            <span className="sidebar-brand-title">COPER 3.0</span>
            <span className="sidebar-brand-sub">FMP • Palhoça</span>
          </div>
        </NavLink>

        <ul className="sidebar-menu">
          {menu.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <li>
                <FontAwesomeIcon icon={item.icon} />
                {item.label}
              </li>
            </NavLink>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-menu-toggle" onClick={() => setSidebarOpen(v => !v)}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h2>{pageTitle}</h2>
          </div>

          <div className="topbar-search" ref={searchRef} style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="text"
              placeholder="Pesquisar Alunos, Campanhas ou Doações..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setSearchOpen(true);
              }}
            />
            {searchLoading && (
              <span style={{ position: 'absolute', right: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Buscando...
              </span>
            )}

            {/* Dropdown de Resultados da Pesquisa Global */}
            {searchOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  background: 'linear-gradient(180deg, #06192d 0%, #031020 100%)',
                  border: '1px solid #1A5282',
                  borderRadius: '12px',
                  boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(33, 150, 243, 0.2)',
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '10px 0',
                }}
              >
                {/* Alunos */}
                {searchResults.students?.length > 0 && (
                  <div style={{ padding: '4px 12px 8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🎓 Estudantes ({searchResults.students.length})
                    </span>
                    {searchResults.students.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          if (userRole === 'COPER' || userRole === 'ADMIN') {
                            navigate('/validar-doacoes');
                          }
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          transition: 'background 0.2s',
                          marginTop: '4px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#f8fafc', display: 'block' }}>{s.name}</strong>
                          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Matrícula: {s.matricula || 'Sem matrícula'} • {s.email}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          {s.totalHoursEarned || 0}h
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campanhas */}
                {searchResults.campaigns?.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: searchResults.students?.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📢 Campanhas ({searchResults.campaigns.length})
                    </span>
                    {searchResults.campaigns.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          navigate(userRole === 'COPER' || userRole === 'ADMIN' ? '/campanhas' : '/campanhas-ativas');
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{c.title}</strong>
                        {c.isUrgent && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            URGENTE
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Doações */}
                {searchResults.donations?.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🎁 Doações Recentes ({searchResults.donations.length})
                    </span>
                    {searchResults.donations.map(d => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          navigate(`/validar?code=${d.authHash}`);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#f8fafc', display: 'block' }}>{d.donorName}</strong>
                          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{d.item} • Hash: {d.authHash.substring(0, 8)}...</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: d.status === 'APPROVED' ? '#34d399' : '#f59e0b' }}>
                          {d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sem resultados */}
                {searchResults.students?.length === 0 && searchResults.campaigns?.length === 0 && searchResults.donations?.length === 0 && !searchLoading && (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Nenhum aluno, campanha ou doação encontrado para "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-right">
            {/* Notificações in-app (Sino com badge de novidades) */}
            {usuario?.id && (
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button className="notification-btn" onClick={() => setNotifOpen(v => !v)} title="Notificações">
                  <FontAwesomeIcon icon={faBell} />
                  {notificacoes.length > 0 && (
                    <span className="notif-badge">{notificacoes.length}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      🔔 Notificações ({notificacoes.length})
                    </div>
                    {notificacoes.length === 0 ? (
                      <div className="notif-item" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                        Sem novas notificações.
                      </div>
                    ) : (
                      notificacoes.map((n) => (
                        <div
                          key={n.id}
                          className="notif-item"
                          onClick={() => {
                            if (n.link) {
                              navigate(n.link);
                              setNotifOpen(false);
                            }
                          }}
                          style={{ cursor: n.link ? 'pointer' : 'default', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}
                        >
                          {n.titulo && <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '2px', color: 'var(--primary)' }}>{n.titulo}</strong>}
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{n.mensagem}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="user-profile">
              <div className="user-avatar">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <span className="user-name">{usuario?.nome}</span>
              <span className="role-badge">{usuario?.role}</span>
            </div>

            <button className="topbar-logout" onClick={handleLogout} title="Sair do sistema">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
