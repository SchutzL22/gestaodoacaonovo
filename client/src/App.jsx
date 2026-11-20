import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
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
import { paginaInicial, perfil } from './context/perfis';
import CursosAlunoPage from './pages/aluno/CursosAlunoPage';

const DiarioClassePage = lazy(() => import('./pages/professor/DiarioClassePage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SocialImpactDashboard = lazy(() => import('./pages/SocialImpactDashboard'));
const DashboardAdminPage = lazy(() => import('./pages/admin/DashboardAdminPage'));
const GestaoCursosPage = lazy(() => import('./pages/admin/GestaoCursosPage'));

function PrivateRoute({ children, roles }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(perfil(usuario))) return <Navigate to={paginaInicial(usuario)} replace />;
  return children || <Outlet />;
}

function AppRoutes() {
  const { usuario } = useAuth();
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
          usuario ? <Navigate to={paginaInicial(usuario)} replace /> : <LoginPage />
        }
      />

      {/* 🛡️ Rotas Autenticadas no Layout Principal (AppLayout) */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route element={<PrivateRoute roles={['COPER']} />}>
          <Route path="/dashboard" element={<DashboardAdminPage />} />
          <Route path="/gestao-cursos" element={<GestaoCursosPage />} />
          <Route path="/validar-doacoes" element={<ValidarDoacoesPage />} />
          <Route path="/campanhas" element={<CampanhasAdminPage />} />
          <Route path="/itens-prioritarios" element={<ItensPrioritariosPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Route>
        <Route element={<PrivateRoute roles={['EMPRESARIO', 'COPER']} />}>
          <Route path="/painel-impacto" element={<SocialImpactDashboard embedded />} />
        </Route>
        <Route element={<PrivateRoute roles={['PROFESSOR', 'COPER']} />}>
          <Route path="/diario-classe" element={<DiarioClassePage />} />
          <Route path="/chamada" element={<DiarioClassePage />} />
          <Route path="/professor/chamada" element={<DiarioClassePage />} />
        </Route>
        <Route element={<PrivateRoute roles={['ALUNO']} />}>
          <Route path="/meu-painel" element={<DashboardAlunoPage />} />
          <Route path="/meus-cursos" element={<CursosAlunoPage />} />
          <Route path="/historico" element={<HistoricoAlunoPage />} />
        </Route>
        <Route path="/campanhas-ativas" element={<CampanhasAlunoPage />} />
        <Route path="/registrar-doacao" element={<RegistrarDoacaoPage />} />
        <Route path="/editar-perfil" element={<EditarPerfilPage />} />
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
        <Suspense fallback={<p role="status">Carregando página…</p>}>
          <AppRoutes />
        </Suspense>
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
