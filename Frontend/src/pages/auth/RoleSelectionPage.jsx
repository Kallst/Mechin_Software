import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Wrench, Store } from 'lucide-react';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    navigate('/register', { state: { selectedRole: role } });
  };

  return (
    <div className="auth-layout">
      <div className="auth-sidebar">
        <div className="auth-logo">
          <div style={{ background: '#1A2130', borderRadius: '16px', padding: '1rem', display: 'inline-block', marginBottom: '1rem' }}>
            <span style={{color: '#fff', fontWeight: 'bold', fontSize: '1.5rem'}}>M<span style={{color: 'var(--accent-orange)'}}>-</span></span>
          </div>
          <h1>MECH<span style={{color: 'var(--accent-orange)'}}>I</span>N</h1>
          <p>Tu mecánico de confianza,<br/>donde lo necesites</p>
        </div>
        
        <div className="auth-features">
          <div className="feature-item">
            <div className="feature-icon">📍</div>
            <div className="feature-text">
              <h4>Mecánicos a domicilio</h4>
              <p>Solicita servicio desde donde estés</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔒</div>
            <div className="feature-text">
              <h4>Pagos seguros</h4>
              <p>Transacciones dentro de la plataforma</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⭐</div>
            <div className="feature-text">
              <h4>Sistema de reputación</h4>
              <p>Calificaciones verificadas y confiables</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-content">
        <p className="text-muted" style={{textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '1rem'}}>Bienvenido</p>
        <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>¿Cómo quieres usar Mechin?</h2>
        <p className="text-muted" style={{marginBottom: '2rem'}}>Selecciona tu tipo de cuenta para continuar.<br/>Cada perfil tiene funcionalidades únicas.</p>
        
        <div className="role-card" onClick={() => handleRoleSelect('client')}>
          <div className="role-icon" style={{color: 'var(--accent-orange)'}}>
            <User size={24} />
          </div>
          <div className="role-info">
            <h3>Soy cliente</h3>
            <p>Busco mecánicos, solicito servicios y compro repuestos</p>
          </div>
        </div>
        
        <div className="role-card" onClick={() => handleRoleSelect('mechanic')}>
          <div className="role-icon" style={{color: '#3B82F6'}}>
            <Wrench size={24} />
          </div>
          <div className="role-info">
            <h3>Soy mecánico</h3>
            <p>Ofrezco mis servicios y gestiono mis solicitudes</p>
          </div>
        </div>
        
        <div className="role-card" onClick={() => handleRoleSelect('store')}>
          <div className="role-icon" style={{color: '#10B981'}}>
            <Store size={24} />
          </div>
          <div className="role-info">
            <h3>Soy tienda de repuestos</h3>
            <p>Publico mi catálogo y gestiono ventas de partes</p>
          </div>
        </div>
        
        <div style={{marginTop: '3rem', textAlign: 'center'}}>
          <p className="text-muted">¿Ya tienes una cuenta? <Link to="/login" className="text-accent">Iniciar sesión</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
