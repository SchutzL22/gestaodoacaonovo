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
import './AppLayout.css';

const ADMIN_MENU = [
  { to: '/dashboard',          icon: faChartPie,         label: 'Dashboard'         },
  { to: '/registrar-doacao',   icon: faPlusCircle,       label: 'Registrar Doação'  },
  { to: '/validar-doacoes',    icon: faClipboardCheck,   label: 'Validar Doações'   },
  { to: '/campanhas',          icon: faBullhorn,         label: 'Campanhas'         },
  { to: '/itens-prioritarios', icon: faStar,             label: 'Itens Prioritários'},
  { to: '/relatorios',         icon: faChartBar,         label: 'Relatórios'        },
  { to: '/editar-perfil',      icon: faUserGear,         label: 'Editar Perfil'     },
];

const ALUNO_MENU = [
  { to: '/meu-painel',     icon: faUserGraduate,     label: 'Meu Painel'      },
  { to: '/campanhas-ativas', icon: faBullhorn,        label: 'Campanhas Ativas'},
  { to: '/historico',      icon: faClockRotateLeft,  label: 'Meu Histórico'   },
  { to: '/editar-perfil',  icon: faUserGear,         label: 'Editar Perfil'   },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
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

  const menu = usuario?.tipo === 'admin' ? ADMIN_MENU : ALUNO_MENU;

  // Carrega notificações para alunos
  useEffect(() => {
    if (usuario?.tipo === 'aluno' && usuario?.id) {
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
        <div className="sidebar-brand">
          <div className="brand-icon">
            <FontAwesomeIcon icon={faHandHoldingHeart} />
          </div>
          <span>COPER FMP</span>
        </div>

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
            {/* Notificações (apenas aluno) */}
            {usuario?.tipo === 'aluno' && (
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button className="notification-btn" onClick={() => setNotifOpen(v => !v)}>
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
                      notificacoes.map(n => (
                        <div key={n.id} className="notif-item">{n.mensagem}</div>
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
