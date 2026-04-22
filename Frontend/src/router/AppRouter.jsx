import { Routes, Route } from 'react-router-dom';
import RoleSelectionPage from '../pages/auth/RoleSelectionPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyCodePage from '../pages/auth/VerifyCodePage';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectionPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-code" element={<VerifyCodePage />} />
      {/* Protected Routes would go here using a <ProtectedRoute> component, pronto lo creo.*/}
      <Route path="/dashboard" element={<div style={{padding: '2rem'}}><h1>Dashboard</h1><button className="btn-primary" style={{width: '200px', marginTop: '1rem'}} onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }}>Cerrar Sesión</button></div>} />
    </Routes>
  );
};

export default AppRouter;
