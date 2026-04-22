import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authService.login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión');
    }
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
      </div>
      
      <div className="auth-content">
        <div style={{marginBottom: '2rem'}}>
          <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
            <span>&lt;</span> Volver al inicio
          </Link>
          <p className="text-muted" style={{textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '0.5rem'}}>Bienvenido de vuelta</p>
          <h2 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Iniciar sesión</h2>
          <p className="text-muted">Ingresa tus credenciales para acceder a tu cuenta.</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{maxWidth: '450px'}}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              name="email"
              className="input-control" 
              placeholder="usuario@mechin.co" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password"
              className="input-control" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
              required
              style={error ? { borderColor: 'var(--error-color)' } : {}}
            />
            {error && <p className="text-error">⚠ {error}</p>}
          </div>
          
          <div style={{textAlign: 'right', marginBottom: '1.5rem'}}>
            <Link to="/forgot-password" style={{fontSize: '0.9rem'}}>¿Olvidaste tu contraseña?</Link>
          </div>
          
          <button type="submit" className="btn-primary" style={{marginBottom: '2rem'}}>
            INGRESAR →
          </button>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
            <div style={{flex: 1, height: '1px', backgroundColor: 'var(--border-color)'}}></div>
            <span className="text-muted" style={{fontSize: '0.85rem'}}>O continúa con</span>
            <div style={{flex: 1, height: '1px', backgroundColor: 'var(--border-color)'}}></div>
          </div>
          
          <div className="form-grid" style={{marginBottom: '3rem'}}>
            <button type="button" className="btn-outline">
              Google
            </button>
            <button type="button" className="btn-outline">
              Teléfono
            </button>
          </div>
          
          <div style={{textAlign: 'center'}}>
            <p className="text-muted">¿No tienes cuenta? <Link to="/register" className="text-accent">Regístrate aquí</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
