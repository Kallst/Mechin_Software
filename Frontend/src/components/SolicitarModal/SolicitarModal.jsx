import React, { useState } from 'react';
import './SolicitarModal.css';

const SolicitarModal = ({ isOpen, onClose, onSubmit, isSyncing }) => {
    const [tipo, setTipo] = useState('Mecánica general');
    const [descripcion, setDescripcion] = useState('');
    const [vehiculo, setVehiculo] = useState('');
    const [urgencia, setUrgencia] = useState('Normal');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!descripcion.trim()) return alert("Por favor, describe el problema");
        
        // Empaquetamos todo para que quepa en tu esquema actual de DB
        const payload = {
            cliente_id: 1, // Esto debería venir de tu context de usuario
            tipo_servicio: tipo,
            // Concatenamos Vehículo y Urgencia en el campo descripción
            descripcion: `VEHÍCULO: ${vehiculo || 'No especificado'} | URGENCIA: ${urgencia} | DETALLE: ${descripcion}`,
            direccion_servicio: "Cra. 23 #64-15, Manizales", // Dirección por defecto o de perfil
            latitud_servicio: 5.067, 
            longitud_servicio: -75.517
        };

        onSubmit(payload);
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
                            <div className="mh-title-mech">Solicitar servicio</div>
                            <div className="mh-sub-mech">Cuéntanos qué necesitas y te asignamos un mecánico</div>
                        </div>
                    </div>
                    <div className="close-btn-mech" onClick={onClose} title="Cerrar">✕</div>
                </div>

                <div className="modal-body-mech">
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
                            className="fin-mech" 
                            placeholder="Describe brevemente qué le pasa a tu vehículo..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>

                    <div className="form-row-mech">
                        <div className="field-mech">
                            <label>Vehículo</label>
                            <select className="fin-mech select-mech" value={vehiculo} onChange={(e) => setVehiculo(e.target.value)}>
                                <option value="">Seleccionar vehículo...</option>
                                <option value="Toyota Corolla">Toyota Corolla 2018</option>
                                <option value="Mazda 3">Mazda 3 2020</option>
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
                            <div className="ubic-change-mech">Cambiar</div>
                        </div>
                    </div>

                    <div className="estado-row-mech">
                        <div className="estado-dot-mech"></div>
                        <div className="estado-text-mech">Estado inicial</div>
                        <div className="estado-badge-mech">PENDIENTE</div>
                    </div>
                </div>

                <div className="modal-footer-mech">
                    <button className="btn-cancel-mech" onClick={onClose}>Cancelar</button>
                    <button className="btn-send-mech" onClick={handleSubmit} disabled={isSyncing}>
                        {isSyncing ? 'Enviando...' : 'Confirmar Solicitud →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SolicitarModal;