import React, { useState, useEffect, useCallback } from 'react';
import './ClientDashboard.css';
import useGeolocation from '../../hooks/useGeolocation';
import SolicitarModal from '../../components/SolicitarModal/SolicitarModal';

const ClientDashboard = () => {
    const { isSyncing } = useGeolocation();
    
    // Estados básicos
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userName, setUserName] = useState("Cargando...");
    const [mechanics, setMechanics] = useState([]);
    const [selectedMechanic, setSelectedMechanic] = useState(null);
    const [apiError, setApiError] = useState(''); // <--- NUEVO: Estado para errores del servidor

    // Ubicación fija de Mariana (Simulada para MECHIN-71)
    const clientCoords = { lat: 5.067, lng: -75.517 };

    const [stats, setStats] = useState({
        activos: 0,
        mecanicosCerca: 0, 
        completados: 12,
        rating: "4.8 ★"
    });

    /**
     * MECHIN-71: Carga los mecánicos enviando coordenadas para recibir la lista ordenada
     */
    const loadNearbyMechanics = useCallback(async () => {
        try {
            const url = `http://localhost:5000/api/mechanics/nearby?lat=${clientCoords.lat}&lng=${clientCoords.lng}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.ok) {
                setMechanics(data.mechanics);
                setStats(prev => ({ ...prev, mecanicosCerca: data.mechanics.length }));
            }
        } catch (error) {
            console.error("Error al cargar mecánicos cercanos:", error);
        }
    }, []);

    const loadUserProfile = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users/1');
            const data = await response.json();
            if (data.ok) {
                setUserName(data.user.nombre_completo);
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error);
            setUserName("Usuario");
        }
    };

    const loadActiveCount = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/services/count/1');
            const data = await response.json();
            if (data.ok) {
                setStats(prev => ({ ...prev, activos: data.count }));
            }
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    };

    const openSolicitarModal = (mech = null) => {
        setSelectedMechanic(mech);
        setApiError(''); // Limpiar errores previos al abrir
        setIsModalOpen(true);
    };

    const closeSolicitarModal = () => {
        setIsModalOpen(false);
        setSelectedMechanic(null); 
        setApiError(''); // Limpiar errores al cerrar
    };

    useEffect(() => {
        loadUserProfile();
        loadActiveCount();
        loadNearbyMechanics();
    }, [loadNearbyMechanics]);

    const handleFinalSubmit = async (datosSolicitud) => {
        setApiError(''); // Reiniciar error antes de intentar
        const targetMecanicoId = selectedMechanic?.mecanico_id || selectedMechanic?.id || null;

        const payload = {
            cliente_id: 1, 
            mecanico_id: targetMecanicoId,
            tipo_servicio: datosSolicitud.tipo_servicio,
            descripcion: datosSolicitud.descripcion,
            direccion_servicio: datosSolicitud.direccion_servicio,
            latitud_servicio: clientCoords.lat,
            longitud_servicio: clientCoords.lng
        };

        try {
            const response = await fetch('http://localhost:5000/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            
            if (result.ok) {
                closeSolicitarModal();
                await loadActiveCount(); 
                // Aquí podrías añadir un toast de éxito si quisieras
            } else {
                // MODIFICADO: En lugar de alert, mandamos el mensaje al estado apiError
                setApiError(result.message || "No se pudo procesar la solicitud.");
            }
        } catch (error) {
            console.error("Error al enviar solicitud:", error);
            setApiError("Error de conexión con el servidor.");
        }
    };

    const getInitials = (name) => {
        if (!name || name === "Cargando...") return "??";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className="shell">
            {/* SIDEBAR */}
            <div className="sidebar">
                <div className="sb-logo">
                    <div className="sb-logo-box">
                        <svg viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="6" r="3.5" fill="#ff6e2d" opacity=".9"/>
                            <path d="M1 17c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#ff6e2d" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div className="sb-brand">ME<em>CH</em>IN</div>
                </div>

                <div className="sb-section">Principal</div>
                <div className="sb-item active">Inicio</div>
                <div className="sb-item">Buscar mecánicos</div>
                <div className="sb-item">Repuestos</div>
                <div className="sb-item">Mis pagos</div>

                <div className="sb-section">Cuenta</div>
                <div className="sb-item">Mi perfil</div>
                <div className="sb-item">Configuración</div>

                <div className="sb-spacer"></div>
                <div className="sb-user">
                    <div className="sb-avatar">{getInitials(userName)}</div>
                    <div>
                        <div className="sb-uname">{userName}</div>
                        <div className="sb-urole">Cliente</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="main">
                <div className="topbar">
                    <div className="search-box">
                        <span>Buscar mecánicos, servicios o repuestos...</span>
                    </div>
                    <div className="tb-btn notif-dot">
                        <svg viewBox="0 0 16 16" fill="none">
                            <path d="M8 2a4 4 0 0 1 4 4v3l1 2H3l1-2V6a4 4 0 0 1 4-4z" stroke="#6b85a0" strokeWidth="1.3"/>
                            <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="#6b85a0" strokeWidth="1.3"/>
                        </svg>
                    </div>
                    <div className="tb-btn">
                        <svg viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="6" r="2.5" stroke="#6b85a0" strokeWidth="1.3"/>
                            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#6b85a0" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>

                <div className="content">
                    <div className="greeting">
                        <div>
                            <div className="g-title">Hola, {userName} 👋</div>
                            <div className="g-sub">¿Necesitas un mecánico hoy? Hay {stats.mecanicosCerca} disponibles cerca de ti.</div>
                        </div>
                        <button className="btn-solicitar" onClick={() => openSolicitarModal(null)}>
                            + Solicitar servicio
                        </button>
                    </div>

                    <div className="stats">
                        <div className="stat">
                            <div className="stat-val or">{stats.mecanicosCerca}</div>
                            <div className="stat-label">Mecánicos disponibles</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val bl">{stats.activos}</div>
                            <div className="stat-label">Servicios activos</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val ok">{stats.completados}</div>
                            <div className="stat-label">Servicios completados</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val">{stats.rating}</div>
                            <div className="stat-label">Calificación</div>
                        </div>
                    </div>

                    <div className="map-row">
                        <div className="map-card">
                            <div className="map-head">Mecánicos cercanos</div>
                            <div className="map-body" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div className="map-grid"></div>
                                <div className="map-you" style={{ 
                                    top: '50%', left: '50%', 
                                    position: 'absolute', transform: 'translate(-50%, -50%)',
                                    zIndex: 2
                                }}></div>
                                
                                {mechanics.map((mech) => {
                                    const visualTop = 50 + (mech.lat - clientCoords.lat) * 2000;
                                    const visualLeft = 50 + (mech.lng - clientCoords.lng) * 2000;

                                    return (
                                        <div 
                                            key={mech.mecanico_id || mech.id} 
                                            className="map-pin" 
                                            style={{ 
                                                top: `${visualTop}%`, 
                                                left: `${visualLeft}%`,
                                                position: 'absolute',
                                                cursor: 'pointer',
                                                zIndex: 3
                                            }}
                                            onClick={() => openSolicitarModal(mech)}
                                        >
                                            <span style={{ 
                                                whiteSpace: 'nowrap', 
                                                fontSize: '10px', 
                                                background: 'rgba(0,0,0,0.6)', 
                                                padding: '2px 5px', 
                                                borderRadius: '4px' 
                                            }}>
                                                {mech.nombre_completo.split(' ')[0]} · {mech.distancia}km
                                            </span>
                                            <div style={{
                                                width:'12px', height:'12px', borderRadius:'50%', 
                                                background:'var(--orange2)', border:'2px solid var(--bg)',
                                                boxShadow: '0 0 10px var(--orange2)', margin: '0 auto'
                                            }}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mecanicos-card">
                            <div className="mc-head">Disponibles ahora (Más cercanos)</div>
                            <div className="mc-list" style={{ overflowY: 'auto', maxHeight: '300px' }}>
                                {mechanics.length > 0 ? (
                                    mechanics.map((mech) => (
                                        <div key={mech.mecanico_id || mech.id} className="mc-item">
                                            <div className="mc-avatar">{getInitials(mech.nombre_completo)}</div>
                                            <div className="mc-info">
                                                <div className="mc-name">
                                                    {mech.nombre_completo} 
                                                    <span style={{ fontSize: '10px', color: 'var(--orange2)', marginLeft: '8px' }}>
                                                        {mech.distancia} km
                                                    </span>
                                                </div>
                                                <div className="mc-spec">{mech.especialidad || 'Mecánica general'}</div>
                                            </div>
                                            <div className="mc-btn" onClick={() => openSolicitarModal(mech)}>
                                                Solicitar
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="mc-item" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        No hay mecánicos disponibles.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SolicitarModal 
                isOpen={isModalOpen} 
                onClose={closeSolicitarModal} 
                onSubmit={handleFinalSubmit}
                isSyncing={isSyncing}
                selectedMechanic={selectedMechanic} 
                externalError={apiError} // <--- MODIFICADO: Conectado al estado
            />
        </div>
    );
};

export default ClientDashboard;