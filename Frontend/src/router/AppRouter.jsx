import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Páginas de autenticación
import RoleSelectionPage  from '../pages/auth/RoleSelectionPage';
import LoginPage          from '../pages/auth/LoginPage';
import RegisterPage       from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyCodePage     from '../pages/auth/VerifyCodePage';

// Dashboards
import ClientDashboard   from '../pages/dashboard/ClientDashboard';
import MechanicDashboard from '../pages/dashboard/MechanicDashboard';
import AdminDashboard    from '../pages/dashboard/AdminDashboard';
import StoreDashboard    from '../pages/dashboard/StoreDashboard';

// Perfil de Usuario
import ProfilePage         from '../pages/profile/ProfilePage';
import EditProfilePage     from '../pages/profile/EditProfilePage';
import MechanicProfilePage from '../pages/profile/MechanicProfilePage';// <--- Nueva Importación

// Catálogo de Repuestos
import CatalogPage    from '../pages/catalog/CatalogPage';
import RepuestoDetail from '../pages/catalog/RepuestoDetail';

// Pagos
import PaymentPage                from '../pages/payments/PaymentPage';
import PaymentHistoryPage         from '../pages/payments/PaymentHistoryPage';
import MechanicPaymentHistoryPage from '../pages/payments/MechanicPaymentHistoryPage';

const AppRouter = () => {
  return (
    <Routes>

      {/* ── Rutas públicas ───────────────────────────── */}
      <Route path="/"                element={<RoleSelectionPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-code"     element={<VerifyCodePage />} />

      {/* ── Catálogo de repuestos ─────────────────────── */}
      <Route
        path="/catalogo"
        element={
          <ProtectedRoute allowedRoles={['cliente', 'tienda', 'administrador']}>
            <CatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalogo/:id"
        element={
          <ProtectedRoute allowedRoles={['cliente', 'tienda', 'administrador']}>
            <RepuestoDetail />
          </ProtectedRoute>
        }
      />

      {/* ── Dashboards por rol ───────────────────────── */}
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
        path="/dashboard/tienda"
        element={
          <ProtectedRoute allowedRoles={['tienda']}>
            <StoreDashboard />
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

      {/* ── Pagos ────────────────────────────────────── */}
      <Route
        path="/pagar"
        element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial-pagos"
        element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <PaymentHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial-ingresos"
        element={
          <ProtectedRoute allowedRoles={['mecanico']}>
            <MechanicPaymentHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* ── Perfil de Usuario ────────────────────────── */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil/editar"
        element={
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />
      {/* RUTA NUEVA PARA EL PERFIL DEL MECÁNICO */}
      <Route
        path="/perfil-mecanico"
        element={
          <ProtectedRoute allowedRoles={['mecanico']}>
            <MechanicProfilePage />
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

const DashboardRedirect = () => {
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (!user) return <Navigate to="/login" replace />;

  const destinos = {
    cliente:       '/dashboard/cliente',
    mecanico:      '/dashboard/mecanico',
    tienda:        '/dashboard/tienda',
    administrador: '/dashboard/admin',
  };

  const destino = destinos[user.role];
  if (!destino) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destino} replace />;
};

export default AppRouter;