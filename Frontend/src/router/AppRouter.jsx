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
import StoreDashboard    from '../pages/dashboard/StoreDashboard'; // ← Sprint 6

// ── Sprint 6: Catálogo de Repuestos ──────────────────────────
import CatalogPage    from '../pages/catalog/CatalogPage';
import RepuestoDetail from '../pages/catalog/RepuestoDetail';

const AppRouter = () => {
  return (
    <Routes>

      {/* ── Rutas públicas ───────────────────────────── */}
      <Route path="/"                element={<RoleSelectionPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-code"     element={<VerifyCodePage />} />

      {/* ── Catálogo de repuestos (accesible para cliente y tienda) ── */}
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
        path="/dashboard/tienda"  // ← Sprint 6
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

  const rol = user.role;

  const destinos = {
    cliente:       '/dashboard/cliente',
    mecanico:      '/dashboard/mecanico',
    tienda:        '/dashboard/tienda',  // ← Sprint 6
    administrador: '/dashboard/admin',
  };

  const destino = destinos[rol];

  if (!destino) {
    console.warn(`[DashboardRedirect] Rol desconocido: "${rol}". Cerrando sesión.`);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={destino} replace />;
};

export default AppRouter;