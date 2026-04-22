import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import authService from '../../services/auth.service';

const VerifyCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1]; // only 1 char
    if (!/^[0-9]*$/.test(value)) return; // only numbers
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus bi next
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fullCode = code.join('');
    if (fullCode.length < 6) return setError('Ingresa el código completo');
    if (!newPassword || newPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres');

    try {
      await authService.verifyCode(email, fullCode, newPassword);
      alert('Contraseña actualizada correctamente. Inicia sesión.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al verificar código');
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
          <Link to="/forgot-password" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
            <span>&lt;</span> Volver
          </Link>
          
          <div style={{width: '60px', height: '60px', backgroundColor: '#064E3B', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'}}>
            <MailCheck color="var(--success-color)" size={28} />
          </div>

          <p className="text-muted" style={{textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '0.5rem'}}>Verificación</p>
          <h2 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Revisa tu correo</h2>
          <p className="text-muted">Enviamos un código de 6 dígitos a:<br/>
            <span style={{color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'}}>
              ✓ {email}
            </span>
          </p>
        </div>
        
        {error && <p className="text-error" style={{marginBottom: '1rem', fontSize: '1rem'}}>⚠ {error}</p>}

        <form onSubmit={handleSubmit} style={{maxWidth: '450px'}}>
          <label style={{display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem'}}>Código de Verificación</label>
          <div className="code-inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                className={`code-input ${digit ? 'active' : ''}`}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoComplete="off"
              />
            ))}
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
            <p className="text-muted" style={{fontSize: '0.8rem'}}>¿No recibiste el código? <span style={{color: '#3B82F6', cursor: 'pointer'}}>Reenviar</span></p>
            <p className="text-muted" style={{fontSize: '0.8rem'}}>Expira en 15:00</p>
          </div>

          <div className="input-group">
            <label>Nueva Contraseña</label>
            <input 
              type="password" 
              className="input-control" 
              placeholder="••••••••" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{marginBottom: '1rem'}}>
            VERIFICAR CÓDIGO →
          </button>
          
          <button type="button" className="btn-outline" onClick={() => navigate('/forgot-password')}>
            Cambiar correo electrónico
          </button>
          
          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p className="text-muted">¿Recordaste tu contraseña? <Link to="/login" className="text-accent" style={{color: '#3B82F6'}}>Iniciar sesión</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyCodePage;
