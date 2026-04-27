import { useState } from 'react';
import reputationService from '../../services/reputation.service';
import './RatingModal.css';

const estrellas = [1, 2, 3, 4, 5];

export default function RatingModal({ servicioId, mecanicoId, onCalificado, onCerrar }) {
  const [puntaje, setPuntaje] = useState(0);
  const [hover, setHover] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    if (puntaje === 0) return setError('Selecciona una calificación');
    
    setCargando(true);
    setError('');
    
    try {
      // Enviamos los datos tal cual los espera tu controlador y el service del backend
      await reputationService.calificar({
        servicio_id: servicioId,
        mecanico_id: mecanicoId,
        puntaje: puntaje,
        contenido: "" // Se envía vacío para evitar el error de desestructuración en el backend
      });
      
      // Notificamos al componente padre enviando el ID del servicio
      // Esto servirá para ocultar el botón en la lista inmediatamente
      onCalificado(servicioId);
      
    } catch (err) {
      console.error("Error al calificar:", err);
      // Si el error es de duplicidad (23505), el backend enviará el mensaje correspondiente
      setError(err.response?.data?.mensaje || 'No se pudo procesar la calificación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rating-overlay">
      <div className="rating-card">
        <h2 className="rating-title">¿Cómo fue el servicio?</h2>
        <p className="rating-subtitle">Tu calificación ayuda a otros clientes</p>

        <div className="stars-container">
          {estrellas.map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setPuntaje(n)}
              className="star-button"
              type="button"
            >
              <span className={n <= (hover || puntaje) ? 'star-active' : 'star-inactive'}>
                ★
              </span>
            </button>
          ))}
        </div>

        <p className="rating-desc">
          {['', 'Muy malo 😠', 'Malo ☹️', 'Regular 😐', 'Bueno 🙂', '¡Excelente! 🤩'][puntaje]}
        </p>

        {error && <p className="rating-error">{error}</p>}

        <div className="rating-actions">
          <button 
            onClick={onCerrar} 
            className="btn-cancel" 
            disabled={cargando}
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={cargando || puntaje === 0}
            className="btn-submit"
            type="button"
          >
            {cargando ? 'Enviando...' : 'Confirmar Calificación'}
          </button>
        </div>
      </div>
    </div>
  );
}