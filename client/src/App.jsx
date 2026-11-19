import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardAdminPage from './pages/admin/DashboardAdminPage';
import RegistrarDoacaoPage from './pages/admin/RegistrarDoacaoPage';
import ValidarDoacoesPage from './pages/admin/ValidarDoacoesPage';
import CampanhasAdminPage from './pages/admin/CampanhasAdminPage';
import ItensPrioritariosPage from './pages/admin/ItensPrioritariosPage';
import RelatoriosPage from './pages/admin/RelatoriosPage';
import DashboardAlunoPage from './pages/aluno/DashboardAlunoPage';
import CampanhasAlunoPage from './pages/aluno/CampanhasAlunoPage';
import HistoricoAlunoPage from './pages/aluno/HistoricoAlunoPage';
import EditarPerfilPage from './pages/shared/EditarPerfilPage';
import ValidateCertificatePage from './pages/ValidateCertificatePage';
import SocialImpactDashboard from './pages/SocialImpactDashboard';
import ChamadaPage from './pages/professor/ChamadaPage';
import GestaoCursosPage from './pages/admin/GestaoCursosPage';
import CursosAlunoPage from './pages/aluno/CursosAlunoPage';
import DiarioClassePage from './pages/professor/DiarioClassePage';

function PrivateRoute({ children, role }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (role && usuario.tipo !== role && usuario.role !== role) {
    const defaultRoute =
      usuario.role === 'PROFESSOR'
        ? '/diario-classe'
        : usuario.role === 'EMPRESARIO'
        ? '/painel-impacto'
        : usuario.tipo === 'admin' || usuario.role === 'COPER'
        ? '/dashboard'
        : '/meu-painel';
    return <Navigate to={defaultRoute} replace />;
  }
  return children;
}

function AppRoutes() {
  const { usuario } = useAuth();

  const getHomeRoute = () => {
    if (!usuario) return '/login';
    if (usuario.role === 'PROFESSOR') return '/diario-classe';
    if (usuario.role === 'EMPRESARIO') return '/painel-impacto';
    if (usuario.tipo === 'admin' || usuario.role === 'COPER') return '/dashboard';
    return '/meu-painel';
  };

  return (
    <Routes>
      {/* 🌐 Rota Pública Principal — Landing Page Institucional & Dados de Impacto */}
      <Route path="/" element={<LandingPage />} />

      {/* 🔍 Rota Pública de Validação por Hash / QR Code */}
      <Route path="/validar" element={<ValidateCertificatePage />} />

      {/* 📊 Dashboard Institucional de Impacto Social (Aberto / Empresas / Parceiros) */}
      <Route path="/impacto-social" element={<SocialImpactDashboard />} />

      {/* 🔐 Autenticação */}
      <Route
        path="/login"
        element={
          usuario ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />
        }
      />

      {/* 🛡️ Rotas Autenticadas no Layout Principal (AppLayout) */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        {/* Admin / COPER */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardAdminPage /></PrivateRoute>} />
        <Route path="/gestao-cursos" element={<PrivateRoute><GestaoCursosPage /></PrivateRoute>} />
        <Route path="/registrar-doacao" element={<PrivateRoute><RegistrarDoacaoPage /></PrivateRoute>} />
        <Route path="/validar-doacoes" element={<PrivateRoute><ValidarDoacoesPage /></PrivateRoute>} />
        <Route path="/campanhas" element={<PrivateRoute><CampanhasAdminPage /></PrivateRoute>} />
        <Route path="/itens-prioritarios" element={<PrivateRoute><ItensPrioritariosPage /></PrivateRoute>} />
        <Route path="/relatorios" element={<PrivateRoute><RelatoriosPage /></PrivateRoute>} />
        <Route path="/painel-impacto" element={<SocialImpactDashboard embedded />} />

        {/* Professor - Diário de Classe Digital (Chamada Online, Avaliações A1/A2/A3 e Certificação) */}
        <Route path="/diario-classe" element={<DiarioClassePage />} />
        <Route path="/chamada" element={<DiarioClassePage />} />
        <Route path="/professor/chamada" element={<DiarioClassePage />} />

        {/* Aluno - Portal Acadêmico & Catálogo de Vagas FIFO */}
        <Route path="/meu-painel" element={<DashboardAlunoPage />} />
        <Route path="/meus-cursos" element={<CursosAlunoPage />} />
        <Route path="/campanhas-ativas" element={<CampanhasAlunoPage />} />
        <Route path="/historico" element={<HistoricoAlunoPage />} />

        {/* Compartilhado */}
        <Route path="/editar-perfil" element={<PrivateRoute><EditarPerfilPage /></PrivateRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#06233B',
              color: '#f0f4f8',
              borderRadius: '12px',
              border: '1px solid #1A5282',
              boxShadow: '0 20px 25px -5px rgba(10, 58, 96, 0.4)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.88rem',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
