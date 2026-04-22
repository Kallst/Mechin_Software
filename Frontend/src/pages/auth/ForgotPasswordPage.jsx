import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import authService from '../../services/auth.service';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authService.forgotPassword(email);
      setMessage('Enlace enviado. Revisa tu correo.');
      setTimeout(() => navigate('/verify-code', { state: { email } }), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al procesar la solicitud');
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
          <Link to="/login" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
            <span>&lt;</span> Volver al inicio de sesión
          </Link>
          
          <div style={{width: '60px', height: '60px', backgroundColor: '#1E293B', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'}}>
            <Mail color="var(--accent-orange)" size={28} />
          </div>

          <p className="text-muted" style={{textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '0.5rem'}}>Recuperar acceso</p>
          <h2 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>¿Olvidaste tu contraseña?</h2>
          <p className="text-muted">Ingresa el correo electrónico asociado a tu cuenta y te<br/>enviaremos un enlace para restablecer tu contraseña.</p>
        </div>
        
        {error && <p className="text-error" style={{marginBottom: '1rem', fontSize: '1rem'}}>⚠ {error}</p>}
        {message && <p style={{color: 'var(--success-color)', marginBottom: '1rem'}}>{message}</p>}

        <form onSubmit={handleSubmit} style={{maxWidth: '450px'}}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              className="input-control" 
              placeholder="correo@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{marginBottom: '2rem'}}>
            ENVIAR ENLACE →
          </button>
          
          <div style={{backgroundColor: '#111827', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start'}}>
            <div style={{color: '#3B82F6'}}>ⓘ</div>
            <div>
              <h4 style={{fontSize: '0.9rem', marginBottom: '0.2rem'}}>¿No recibes el correo?</h4>
              <p className="text-muted" style={{fontSize: '0.8rem'}}>Revisa tu carpeta de spam. El enlace expira en 15 minutos. Si el problema persiste, contacta a soporte.</p>
            </div>
          </div>
          
          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p className="text-muted">¿Recordaste tu contraseña? <Link to="/login" className="text-accent" style={{color: '#3B82F6'}}>Iniciar sesión</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
