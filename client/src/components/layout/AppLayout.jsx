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
import { listarNotificacoes } from '../../services/api';
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

const ALUNO_MENU = [
  { to: '/meu-painel',         icon: faUserGraduate,     label: 'Meu Painel'        },
  { to: '/meus-cursos',        icon: faClipboardCheck,   label: 'Meus Cursos & Vagas'},
  { to: '/campanhas-ativas',   icon: faBullhorn,         label: 'Campanhas Ativas'  },
  { to: '/historico',          icon: faClockRotateLeft,  label: 'Meu Histórico'     },
  { to: '/editar-perfil',      icon: faUserGear,         label: 'Editar Perfil'     },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/gestao-cursos': 'Gestão de Cursos & Turmas (COPER)',
  '/diario-classe': 'Diário de Classe Digital (Chamada & Avaliações)',
  '/chamada': 'Chamada Online',
  '/professor/chamada': 'Chamada Online',
  '/meus-cursos': 'Meus Cursos Extracurriculares',
  '/registrar-doacao': 'Registrar Doação',
  '/validar-doacoes': 'Validar Doações',
  '/campanhas': 'Campanhas',
  '/itens-prioritarios': 'Itens Prioritários',
  '/relatorios': 'Relatórios',
  '/meu-painel': 'Meu Painel',
  '/campanhas-ativas': 'Campanhas Ativas',
  '/historico': 'Meu Histórico',
  '/editar-perfil': 'Editar Perfil',
};

export default function AppLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const notifRef = useRef(null);

  const userRole = (usuario?.role || usuario?.tipo || '').toUpperCase();
  let menu = ALUNO_MENU;
  if (userRole === 'COPER' || userRole === 'ADMIN') {
    menu = ADMIN_MENU;
  } else if (userRole === 'PROFESSOR') {
    menu = PROFESSOR_MENU;
  }

  // Carrega notificações para o usuário logado
  useEffect(() => {
    if (usuario?.id) {
      listarNotificacoes(usuario.id)
        .then(setNotificacoes)
        .catch(() => {});
    }
  }, [usuario]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
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

          <div className="topbar-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="text"
              placeholder="Pesquisar nesta página..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
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
