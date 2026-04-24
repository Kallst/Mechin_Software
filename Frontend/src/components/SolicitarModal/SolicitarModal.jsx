import React, { useState, useEffect } from 'react';
import './SolicitarModal.css';

// Agregamos externalError a las props recibidas
const SolicitarModal = ({ isOpen, onClose, onSubmit, isSyncing, selectedMechanic, externalError }) => {
    // Estados para los campos del formulario
    const [tipo, setTipo] = useState('Mecánica general');
    const [descripcion, setDescripcion] = useState('');
    const [vehiculo, setVehiculo] = useState('');
    const [urgencia, setUrgencia] = useState('Normal');
    
    // Estado para manejar el error visual de validación local
    const [error, setError] = useState('');

    // Resetear campos y errores cuando el modal se abre
    useEffect(() => {
        if (isOpen) {
            setTipo('Mecánica general');
            setDescripcion('');
            setVehiculo('');
            setUrgencia('Normal');
            setError(''); 
        }
    }, [isOpen]);

    if (!isOpen) return null;

    /**
     * Maneja el envío del formulario
     */
    const handleSubmit = () => {
        // 1. Validación: Descripción obligatoria
        if (!descripcion.trim()) {
            setError("Por favor, describe el problema para que el mecánico pueda ayudarte.");
            return;
        }

        // 2. Validación: Vehículo obligatorio (Criterio MECHIN-23)
        if (!vehiculo) {
            setError("Por favor, selecciona un vehículo para continuar.");
            return;
        }
        
        setError('');
        const targetId = selectedMechanic ? (selectedMechanic.mecanico_id || selectedMechanic.id) : null;

        const payload = {
            cliente_id: 1, 
            mecanico_id: targetId, 
            tipo_servicio: tipo,
            // Guardamos vehículo y urgencia dentro de la descripción para la DB
            descripcion: `VEHÍCULO: ${vehiculo} | URGENCIA: ${urgencia} | DETALLE: ${descripcion}`,
            direccion_servicio: "Cra. 23 #64-15, Manizales",
            latitud_servicio: 5.067, 
            longitud_servicio: -75.517
        };

        onSubmit(payload);
    };

    const getInitials = (name) => {
        if (!name) return "??";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const servicios = [
        { id: 'Mecánica general', color: 'or', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M3 8l2-4h6l2 4" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="8" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg> },
        { id: 'Eléctrica', color: 'bl', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/></svg> },
        { id: 'Diagnóstico', color: 'gr', icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2"/></svg> },
        { id: 'Frenos', color: 'bl', icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg> },
        { id: 'Motor', color: 'or', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M3 5h10v6H3z" stroke="currentColor" strokeWidth="1.2"/><path d="M6 5V4a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1.2"/></svg> },
        { id: 'Otro', color: 'gr', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="currentColor" strokeWidth="1.3"/></svg> }
    ];

    return (
        <div className="overlay-modal" onClick={onClose}>
            <div className="modal-container-mech" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-mech">
                    <div className="mh-left-mech">
                        <div className="mh-icon-mech">
                            <svg viewBox="0 0 18 18" fill="none"><path d="M4 9l2-4h6l2 4" stroke="#ff6e2d" strokeWidth="1.4"/><rect x="3" y="9" width="12" height="5" rx="1.2" stroke="#ff6e2d" strokeWidth="1.3"/><circle cx="6.5" cy="14" r="1.5" fill="#ff6e2d"/><circle cx="11.5" cy="14" r="1.5" fill="#ff6e2d"/></svg>
                        </div>
                        <div>
                            <div className="mh-title-mech">
                                {selectedMechanic ? `Solicitar a ${selectedMechanic.nombre_completo.split(' ')[0]}` : "Solicitar servicio"}
                            </div>
                            <div className="mh-sub-mech">
                                {selectedMechanic ? "Estás enviando una solicitud directa" : "Te asignaremos un mecánico cercano"}
                            </div>
                        </div>
                    </div>
                    <div className="close-btn-mech" onClick={onClose} title="Cerrar">✕</div>
                </div>

                <div className="modal-body-mech">
                    {selectedMechanic && (
                        <div className="selected-mech-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 110, 45, 0.05)', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed rgba(255, 110, 45, 0.2)' }}>
                            <div className="mc-avatar" style={{ width: '45px', height: '45px', fontSize: '14px', background: 'var(--orange2)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {getInitials(selectedMechanic.nombre_completo)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{selectedMechanic.nombre_completo}</div>
                                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{selectedMechanic.especialidad || 'Mecánico General'}</div>
                            </div>
                        </div>
                    )}

                    <span className="sec-label-mech">Tipo de servicio</span>
                    <div className="tipo-grid-mech">
                        {servicios.map((s) => (
                            <div key={s.id} className={`tipo-card-mech ${tipo === s.id ? 'on' : ''}`} onClick={() => setTipo(s.id)}>
                                <div className={`tc-icon-mech ${s.color}`}>{s.icon}</div>
                                <div className="tc-label-mech">{s.id}</div>
                            </div>
                        ))}
                    </div>

                    <div className="field-mech">
                        <label>Descripción del problema</label>
                        <textarea 
                            className={`fin-mech ${error && !descripcion ? 'input-error' : ''}`} 
                            placeholder="Describe qué le sucede a tu vehículo..."
                            value={descripcion}
                            onChange={(e) => {
                                setDescripcion(e.target.value);
                                if(error) setError('');
                            }}
                        />
                    </div>

                    {/* Banner de error dual (Local o del Servidor) */}
                    {(error || externalError) && (
                        <div className="error-banner-mech">
                            <span>⚠️</span> {error || externalError}
                        </div>
                    )}

                    <div className="form-row-mech">
                        <div className="field-mech">
                            <label>Vehículo</label>
                            <select 
                                className={`fin-mech select-mech ${error && !vehiculo ? 'input-error' : ''}`} 
                                value={vehiculo} 
                                onChange={(e) => {
                                    setVehiculo(e.target.value);
                                    if(error) setError('');
                                }}
                            >
                                <option value="">Seleccionar vehículo...</option>
                                <option value="Toyota Corolla 2018">Toyota Corolla 2018</option>
                                <option value="Mazda 3 2020">Mazda 3 2020</option>
                            </select>
                        </div>
                        <div className="field-mech">
                            <label>Urgencia</label>
                            <select className="fin-mech select-mech" value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
                                <option value="Baja">Baja</option>
                                <option value="Normal">Normal</option>
                                <option value="Alta">Alta / Emergencia</option>
                            </select>
                        </div>
                    </div>

                    <div className="field-mech">
                        <label>Ubicación del servicio</label>
                        <div className="ubic-box-mech">
                            <div className="ubic-icon-mech">
                                <svg viewBox="0 0 16 16" fill="none"><path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="#2484e0" opacity=".7"/></svg>
                            </div>
                            <div className="ubic-text-mech">
                                <div className="ubic-label-mech">Cra. 23 #64-15, Manizales</div>
                                <div className="ubic-sub-mech">Ubicación registrada en tu perfil</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer-mech">
                    <button className="btn-cancel-mech" onClick={onClose}>Cancelar</button>
                    <button className="btn-send-mech" onClick={handleSubmit} disabled={isSyncing}>
                        {isSyncing ? 'Enviando...' : `Confirmar Solicitud ${selectedMechanic ? 'Directa' : ''} →`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SolicitarModal;