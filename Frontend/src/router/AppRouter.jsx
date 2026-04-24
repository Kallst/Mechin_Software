import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Páginas de autenticación
import RoleSelectionPage from '../pages/auth/RoleSelectionPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyCodePage from '../pages/auth/VerifyCodePage';

// Dashboards
import ClientDashboard from '../pages/dashboard/ClientDashboard';
import MechanicDashboard from '../pages/dashboard/MechanicDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

// Páginas de Pagos (NUEVO)
import PaymentPage from '../pages/payments/PaymentPage';

const AppRouter = () => {
  return (
    <Routes>

      {/* ── Rutas públicas ───────────────────────────── */}
      <Route path="/"                element={<RoleSelectionPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-code"     element={<VerifyCodePage />} />

      {/* ── Rutas protegidas por rol ─────────────────── */}
      <Route
        path="/dashboard/cliente"
        element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/mecanico"
        element={
          <ProtectedRoute allowedRoles={['mecanico']}>
            <MechanicDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── Rutas de Funcionalidades (NUEVO) ─────────── */}
      <Route
        path="/pagar"
        element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      {/* ── Ruta genérica /dashboard — redirige según rol ── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* ── Ruta 404 ─────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

// Redirige al dashboard correcto según el rol del usuario logueado
const DashboardRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" replace />;

  const destinos = {
    cliente:        '/dashboard/cliente',
    mecanico:       '/dashboard/mecanico',
    tienda:         '/dashboard/cliente',   // tienda usa vista de cliente por ahora (Sprint 6)
    administrador:  '/dashboard/admin',
  };

  return <Navigate to={destinos[user.role] || '/login'} replace />;
};

export default AppRouter;