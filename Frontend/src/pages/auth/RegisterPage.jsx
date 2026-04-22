import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Wrench, Store } from 'lucide-react';
import authService from '../../services/auth.service';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('client');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', city: '', password: '', confirmPassword: ''
  });
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState('');

  const specialtiesList = ['Mecánica general', 'Eléctrica', 'Diagnóstico', 'Frenos', 'Motor', 'Transmisión', 'Aire acondicionado'];

  useEffect(() => {
    if (location.state?.selectedRole) {
      setRole(location.state.selectedRole);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSpecialty = (spec) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(s => s !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    try {
      const payload = { ...formData, role, specialties: role === 'mechanic' ? specialties : [] };
      await authService.register(payload);
      // Auto login after register or redirect to login ,..
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Error al registrar');
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
      
      <div className="auth-content" style={{padding: '2rem 6rem'}}>
        <div style={{marginBottom: '1.5rem'}}>
          <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
            <span>&lt;</span> Volver al inicio
          </Link>
          <p className="text-muted" style={{textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '0.5rem'}}>Crear cuenta</p>
          <h2 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Registrarse</h2>
          <p className="text-muted">Selecciona tu rol y completa tus datos.</p>
        </div>
        
        <div className="tabs-container">
          <div className={`tab-btn ${role === 'client' ? 'active' : ''}`} onClick={() => setRole('client')}>
            <User size={20} />
            <span>Cliente</span>
          </div>
          <div className={`tab-btn ${role === 'mechanic' ? 'active' : ''}`} onClick={() => setRole('mechanic')}>
            <Wrench size={20} />
            <span>Mecánico</span>
          </div>
          <div className={`tab-btn ${role === 'store' ? 'active' : ''}`} onClick={() => setRole('store')}>
            <Store size={20} />
            <span>Tienda</span>
          </div>
        </div>

        {error && <p className="text-error" style={{marginBottom: '1rem', fontSize: '1rem'}}>⚠ {error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Nombre</label>
              <input type="text" name="firstName" className="input-control" placeholder="Juan" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Apellido</label>
              <input type="text" name="lastName" className="input-control" placeholder="Pérez" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input type="email" name="email" className="input-control" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="form-grid">
            <div className="input-group">
              <label>Teléfono</label>
              <input type="text" name="phone" className="input-control" placeholder="+57 300 000 0000" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Ciudad</label>
              <select name="city" className="input-control" value={formData.city} onChange={handleChange} required style={{appearance: 'none'}}>
                <option value="">Seleccionar ciudad</option>
                <option value="Manizales">Manizales</option>
                <option value="Bogotá">Bogotá</option>
                <option value="Medellín">Medellín</option>
              </select>
            </div>
          </div>
          
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" name="password" className="input-control" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>
          
          <div className="input-group">
            <label>Confirmar Contraseña</label>
            <input type="password" name="confirmPassword" className="input-control" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          {role === 'mechanic' && (
            <div className="input-group" style={{border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', backgroundColor: 'var(--input-bg)'}}>
              <label style={{marginBottom: '1rem'}}>Especialidades (Solo mecánicos)</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                {specialtiesList.map(spec => (
                  <div 
                    key={spec} 
                    onClick={() => toggleSpecialty(spec)}
                    style={{
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      border: `1px solid ${specialties.includes(spec) ? 'var(--success-color)' : 'var(--border-color)'}`,
                      color: specialties.includes(spec) ? 'var(--success-color)' : 'var(--text-muted)'
                    }}
                  >
                    {spec}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button type="submit" className="btn-primary" style={{marginTop: '1rem', marginBottom: '1.5rem'}}>
            CREAR CUENTA →
          </button>
          
          <div style={{textAlign: 'center', fontSize: '0.85rem'}}>
            <p className="text-muted" style={{marginBottom: '0.5rem'}}>Al registrarte aceptas los <span style={{color: '#3B82F6'}}>Términos de uso</span> y la <span style={{color: '#3B82F6'}}>Política de privacidad</span></p>
            <p className="text-muted">¿Ya tienes cuenta? <Link to="/login" className="text-accent" style={{color: '#3B82F6'}}>Iniciar sesión</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
