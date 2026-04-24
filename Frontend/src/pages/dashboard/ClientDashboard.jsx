import React, { useState, useEffect, useCallback } from 'react';
import './ClientDashboard.css';
import useGeolocation from '../../hooks/useGeolocation';
import SolicitarModal from '../../components/SolicitarModal/SolicitarModal';

const ClientDashboard = () => {
    const { isSyncing } = useGeolocation();
    
    // Estados básicos
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [userName, setUserName] = useState("Cargando...");
    const [mechanics, setMechanics] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); 
    const [selectedMechanic, setSelectedMechanic] = useState(null);
    const [apiError, setApiError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    
    const clienteId = 1; // ID fijo para desarrollo, luego usar sesión

    // NUEVO: Estado para el servicio activo (Seguimiento)
    const [activeService, setActiveService] = useState(null);

    const clientCoords = { lat: 5.067, lng: -75.517 };

    const [stats, setStats] = useState({
        activos: 0,
        mecanicosCerca: 0, 
        completados: 12,
        rating: "4.8 ★"
    });

    // Cargar mecánicos cercanos
    const loadNearbyMechanics = useCallback(async () => {
        try {
            const url = `http://localhost:5000/api/mechanics/nearby?lat=${clientCoords.lat}&lng=${clientCoords.lng}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.ok) {
                setMechanics(data.mechanics);
                setStats(prev => ({ ...prev, mecanicosCerca: data.mechanics.length }));
            }
        } catch (error) { console.error("Error mecánicos:", error); }
    }, [clientCoords.lat, clientCoords.lng]);

    // NUEVO: Verificar si hay un servicio en curso
    const checkActiveService = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/services/active/${clienteId}`);
            const data = await response.json();
            if (data.ok && data.service) {
                setActiveService(data.service);
            } else {
                setActiveService(null);
            }
        } catch (error) { console.error("Error checking active service:", error); }
    }, [clienteId]);

    const filteredMechanics = mechanics.filter(mech => 
        mech.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mech.especialidad && mech.especialidad.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const loadUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${clienteId}`);
            const data = await response.json();
            if (data.ok) setUserName(data.user.nombre_completo);
        } catch (error) { setUserName("Mariana Barbosa"); }
    };

    const loadActiveCount = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/services/count/${clienteId}`);
            const data = await response.json();
            if (data.ok) setStats(prev => ({ ...prev, activos: data.count }));
        } catch (error) { console.error("Error stats:", error); }
    };

    // --- LÓGICA DE NOTIFICACIONES ---
    const fetchNotifications = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/notifications/${clienteId}`);
            const data = await res.json();
            if (data.ok) setNotifications(data.notifications);
        } catch (err) { console.error("Error notis:", err); }
    };

    const handleSelectMechanic = (mech) => {
        setSelectedMechanic(mech);
        setShowDetail(true);
    };

    const openSolicitarModal = () => {
        setShowDetail(false);
        setIsModalOpen(true);
    };

    const closeSolicitarModal = () => {
        setIsModalOpen(false);
        setSelectedMechanic(null); 
        setApiError(''); 
    };

    // NUEVO: Cancelar servicio
    const handleCancelService = async (serviceId) => {
        if (!window.confirm("¿Deseas cancelar el servicio?")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/services/cancel/${serviceId}`, { method: 'PUT' });
            const result = await response.json();
            if (result.ok) {
                setActiveService(null);
                loadActiveCount();
            }
        } catch (error) { console.error("Error al cancelar:", error); }
    };

    // Polling y carga inicial
    useEffect(() => {
        loadUserProfile();
        loadActiveCount();
        loadNearbyMechanics();
        checkActiveService();
        fetchNotifications();
        
        const serviceInterval = setInterval(checkActiveService, 20000);
        const notifInterval = setInterval(fetchNotifications, 30000);

        return () => {
            clearInterval(serviceInterval);
            clearInterval(notifInterval);
        };
    }, [loadNearbyMechanics, checkActiveService]);

    const handleFinalSubmit = async (datosSolicitud) => {
        setApiError(''); 
        const targetMecanicoId = selectedMechanic?.mecanico_id || selectedMechanic?.id || null;

        const payload = {
            cliente_id: clienteId, 
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
                await checkActiveService();
            } else {
                setApiError(result.message || "No se pudo procesar la solicitud.");
            }
        } catch (error) { setApiError("Error de conexión."); }
    };

    const getInitials = (name) => {
        if (!name || name === "Cargando...") return "MB";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className="shell">
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
                <div className="sb-spacer"></div>
                <div className="sb-user">
                    <div className="sb-avatar">{getInitials(userName)}</div>
                    <div>
                        <div className="sb-uname">{userName}</div>
                        <div className="sb-urole">Cliente</div>
                    </div>
                </div>
            </div>

            <div className="main">
                <div className="topbar">
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Buscar mecánicos o servicios..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                        />
                    </div>

                    {/* NUEVO: PANEL DE NOTIFICACIONES */}
                    <div className="notif-container">
                        <button className="notif-bell" onClick={() => setShowNotif(!showNotif)}>
                            🔔
                            {notifications.filter(n => !n.leida).length > 0 && (
                                <span className="notif-badge">{notifications.filter(n => !n.leida).length}</span>
                            )}
                        </button>
                        {showNotif && (
                            <div className="notif-dropdown">
                                <div className="notif-header">Notificaciones</div>
                                <div className="notif-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">Sin novedades</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`notif-item ${n.leida ? 'read' : 'unread'}`}>
                                                <p>{n.mensaje}</p>
                                                <span>{new Date(n.creado_en).toLocaleTimeString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="content">
                    {activeService && (
                        <div className="active-service-floating-card">
                            <div className="as-status-badge">
                                <span className="pulse-dot"></span>
                                {activeService.estado?.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="as-content">
                                <div className="as-info">
                                    <strong>{activeService.mecanico_nombre || "Buscando mecánico..."}</strong>
                                    <span>{activeService.tipo_servicio} • En Manizales</span>
                                </div>
                                <div className="as-actions">
                                    <button className="btn-chat-icon">💬</button>
                                    <button className="btn-cancel-icon" onClick={() => handleCancelService(activeService.id)}>×</button>
                                </div>
                            </div>
                            <div className="as-progress-bar">
                                <div className={`progress-fill ${activeService.estado}`}></div>
                            </div>
                        </div>
                    )}

                    <div className="greeting">
                        <div>
                            <div className="g-title">Hola, {userName} 👋</div>
                            <div className="g-sub">Hay {stats.mecanicosCerca} mecánicos en tu zona de Manizales.</div>
                        </div>
                        <button className="btn-solicitar" onClick={() => { setSelectedMechanic(null); setIsModalOpen(true); }}>
                            + Solicitar rápido
                        </button>
                    </div>

                    <div className="stats">
                        <div className="stat">
                            <div className="stat-val or">{stats.mecanicosCerca}</div>
                            <div className="stat-label">Disponibles</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val bl">{stats.activos}</div>
                            <div className="stat-label">Activos</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val ok">{stats.completados}</div>
                            <div className="stat-label">Completados</div>
                        </div>
                    </div>

                    <div className="map-row">
                        <div className="map-card" style={{ flex: 2, position: 'relative' }}>
                            <div className="map-head">Mapa de servicio en tiempo real</div>
                            <div className="map-body" style={{ position: 'relative', overflow: 'hidden', height: '400px' }}>
                                <div className="map-grid"></div>
                                
                                <div className="map-you" style={{ top: '50%', left: '50%', position: 'absolute', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                    <div className="user-marker-rappi">
                                        <div className="pulse"></div>
                                        <div className="icon">🏠</div>
                                    </div>
                                    {/* NUEVO: RADAR DE BÚSQUEDA */}
                                    {activeService && activeService.estado === 'pendiente' && (
                                        <div className="radar-container">
                                            <div className="radar-ring"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {filteredMechanics.map((mech) => (
                                    <div 
                                        key={mech.id} 
                                        className="map-pin-rappi" 
                                        style={{ 
                                            top: `${50 + (mech.lat - clientCoords.lat) * 2000}%`, 
                                            left: `${50 + (mech.lng - clientCoords.lng) * 2000}%`, 
                                            position: 'absolute', cursor: 'pointer', zIndex: 5 
                                        }}
                                        onClick={() => handleSelectMechanic(mech)}
                                    >
                                        <div className="car-icon">🚗</div>
                                        <span className="car-label">{mech.nombre_completo.split(' ')[0]}</span>
                                    </div>
                                ))}

                                {showDetail && selectedMechanic && (
                                    <div className="mech-detail-panel">
                                        <button className="close-panel" onClick={() => setShowDetail(false)}>×</button>
                                        <div className="detail-header">
                                            <div className="detail-avatar">{selectedMechanic.nombre_completo[0]}</div>
                                            <div className="detail-info">
                                                <h4>{selectedMechanic.nombre_completo}</h4>
                                                <p>{selectedMechanic.especialidad || 'Mecánico General'}</p>
                                            </div>
                                        </div>
                                        <div className="detail-stats">
                                            <span>⭐ 4.9</span>
                                            <span>📍 {selectedMechanic.distancia} km</span>
                                        </div>
                                        <button className="btn-confirm-mech" onClick={openSolicitarModal}>
                                            Solicitar Servicio
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mecanicos-card" style={{ flex: 1 }}>
                            <div className="mc-head">Resultados ({filteredMechanics.length})</div>
                            <div className="mc-list" style={{ overflowY: 'auto', maxHeight: '400px' }}>
                                {filteredMechanics.map((mech) => (
                                    <div key={mech.id} className="mc-item" onClick={() => handleSelectMechanic(mech)}>
                                        <div className="mc-info">
                                            <div className="mc-name">{mech.nombre_completo}</div>
                                            <div className="mc-spec">{mech.distancia} km • {mech.especialidad}</div>
                                        </div>
                                        <button className="mc-btn">Ver</button>
                                    </div>
                                ))}
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
                externalError={apiError} 
            />
        </div>
    );
};

export default ClientDashboard;