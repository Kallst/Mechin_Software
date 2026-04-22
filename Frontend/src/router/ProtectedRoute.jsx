import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

// ============================================================
// ProtectedRoute — Guarda rutas que requieren autenticación
//
// Uso básico (solo verifica que haya sesión):
//   <Route path="/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
//
// Uso con rol específico:
//   <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrador']}><AdminDashboard /></ProtectedRoute>} />
//
// Roles disponibles: 'cliente', 'mecanico', 'tienda', 'administrador'
// ============================================================

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = authService.getToken();
  const user = authService.getCurrentUser();

  // Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles requeridos, verificar que el usuario tenga el rol permitido
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      // Tiene sesión pero no el rol correcto — redirige al inicio
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
