import React, { useState, useEffect } from 'react';

const MechanicProfileModal = ({ isOpen, onClose, user, initialProfile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    telefono: '',
    direccion: '',
    biografia: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        telefono: initialProfile.telefono || '',
        direccion: initialProfile.direccion || '',
        biografia: initialProfile.biografia || ''
      });
    }
  }, [initialProfile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/mechanics/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.ok) {
        setMessage('Perfil actualizado con éxito');
        if (onProfileUpdate) onProfileUpdate();
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage('Error al actualizar: ' + data.message);
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Mi Perfil Profesional</h2>
        {message && <div style={{ color: message.includes('Error') ? 'red' : 'green', marginBottom: '1rem' }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <input 
              type="text" 
              name="telefono" 
              value={formData.telefono} 
              onChange={handleChange} 
              placeholder="Ej: 300 123 4567" 
            />
          </div>
          
          <div className="form-group">
            <label>Dirección del Taller / Residencia</label>
            <input 
              type="text" 
              name="direccion" 
              value={formData.direccion} 
              onChange={handleChange} 
              placeholder="Ej: Calle 123 # 45-67, Manizales" 
            />
          </div>

          <div className="form-group">
            <label>Carta de Presentación / Biografía</label>
            <textarea 
              name="biografia" 
              value={formData.biografia} 
              onChange={handleChange} 
              rows="4"
              placeholder="Describe tu experiencia, certificaciones y especialidades..." 
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MechanicProfileModal;
