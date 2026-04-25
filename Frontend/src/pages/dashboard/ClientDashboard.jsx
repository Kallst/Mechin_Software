import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ClientDashboard.css';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../../hooks/useGeolocation';
import SolicitarModal from '../../components/SolicitarModal/SolicitarModal';
import ChatWindow from '../../components/ChatWindow/ChatWindow'; // ✅ import agregado
import authService from '../../services/auth.service';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const carIcon = new L.DivIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 0 5px rgba(255,110,45,0.8));">🚗</div>`,
    className: 'custom-leaflet-icon-car',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const homeIcon = new L.DivIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));">🏠</div>`,
    className: 'custom-leaflet-icon-home',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const MapControls = ({ centerUser }) => {
    const map = useMap();
    return (
        <div className="map-custom-controls">
            <button onClick={() => map.zoomIn()} title="Acercar">+</button>
            <button onClick={() => map.zoomOut()} title="Alejar">−</button>
            <button onClick={centerUser} title="Mi ubicación" className="btn-locate">📍</button>
        </div>
    );
};

const ClientDashboard = () => {
    const { isSyncing } = useGeolocation();
    const navigate = useNavigate();
    const mapRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [userName, setUserName] = useState("Cargando...");
    const [mechanics, setMechanics] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMechanic, setSelectedMechanic] = useState(null);
    const [apiError, setApiError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [activeService, setActiveService] = useState(null);
    const [clientCoords] = useState({ lat: 5.067, lng: -75.517 });
    const [stats, setStats] = useState({
        activos: 0,
        mecanicosCerca: 0,
        completados: 12,
        rating: "4.8 ★"
    });

    const currentUser = authService.getCurrentUser();
    const clienteId = currentUser ? currentUser.id : null;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const loadNearbyMechanics = useCallback(async () => {
        try {
            const url = `http://localhost:5000/api/mechanics/nearby?lat=${clientCoords.lat}&lng=${clientCoords.lng}`;
            const response = await fetch(url, { headers: getAuthHeaders() });
            const data = await response.json();
            let mechanicArray = [];
            if (Array.isArray(data)) {
                mechanicArray = data;
            } else if (data.ok && Array.isArray(data.mechanics)) {
                mechanicArray = data.mechanics;
            }
            setMechanics(mechanicArray);
            setStats(prev => ({ ...prev, mecanicosCerca: mechanicArray.length }));
        } catch (error) {
            console.error("Error mecánicos:", error);
            setMechanics([]);
        }
    }, [clientCoords.lat, clientCoords.lng]);

    const checkActiveService = useCallback(async () => {
        if (!clienteId) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/active`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            if (data.ok && data.service) {
                setActiveService(data.service);
            } else {
                setActiveService(null);
                setShowChat(false);
            }
        } catch (error) {
            console.error("Error checking active service:", error);
        }
    }, [clienteId]);

    const filteredMechanics = mechanics.filter(mech => {
        const nombre = mech.nombre_completo || mech.nombre || mech.name || "";
        const especialidad = mech.especialidad || "";
        return nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
               especialidad.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const loadUserProfile = async () => {
        if (!clienteId) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/users/${clienteId}`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            if (data.ok && data.user) {
                setUserName(data.user.nombre_completo || data.user.nombre || "Usuario");
            }
        } catch (error) {
            setUserName("Usuario");
        }
    };

    const loadActiveCount = async () => {
        if (!clienteId) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/count`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            if (data.ok) setStats(prev => ({ ...prev, activos: data.count }));
        } catch (error) {
            console.error("Error stats:", error);
        }
    };

    const fetchNotifications = async () => {
        if (!clienteId) return;
        try {
            const res = await fetch(
                `http://localhost:5000/api/notifications/${clienteId}`,
                { headers: getAuthHeaders() }
            );
            const data = await res.json();
            if (data.ok) setNotifications(data.notifications);
        } catch (err) {
            console.error("Error notis:", err);
        }
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

    const handleCancelService = async (serviceId) => {
        if (!window.confirm("¿Deseas cancelar el servicio?")) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/cancel/${serviceId}`,
                { method: 'PUT', headers: getAuthHeaders() }
            );
            const result = await response.json();
            if (result.ok) {
                setActiveService(null);
                setShowChat(false);
                loadActiveCount();
            }
        } catch (error) {
            console.error("Error al cancelar:", error);
        }
    };

    const handleIrAPagar = () => {
        navigate('/pagar', { state: { servicio: activeService } });
    };

    useEffect(() => {
        loadUserProfile();
        loadActiveCount();
        loadNearbyMechanics();
        checkActiveService();
        fetchNotifications();

        const serviceInterval = setInterval(checkActiveService, 10000);
        const mechanicInterval = setInterval(loadNearbyMechanics, 6000);
        const notifInterval = setInterval(fetchNotifications, 20000);

        return () => {
            clearInterval(serviceInterval);
            clearInterval(mechanicInterval);
            clearInterval(notifInterval);
        };
    }, [loadNearbyMechanics, checkActiveService]);

    const handleFinalSubmit = async (datosSolicitud) => {
        setApiError('');
        const targetMecanicoId = selectedMechanic?.mecanico_id || null;

        const payload = {
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
                headers: getAuthHeaders(),
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
        } catch (error) {
            setApiError("Error de conexión.");
        }
    };

    const getInitials = (name) => {
        if (!name || name === "Cargando...") return "US";
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
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
                                    {activeService.estado === 'finalizado' && !activeService.pago_id && (
                                        <button className="btn-pagar-icon" onClick={handleIrAPagar} title="Pagar servicio">
                                            💳 Pagar
                                        </button>
                                    )}
                                    <button className="btn-chat-icon" onClick={() => setShowChat(!showChat)}>💬</button>
                                    {activeService.estado !== 'finalizado' && (
                                        <button className="btn-cancel-icon" onClick={() => handleCancelService(activeService.id)}>×</button>
                                    )}
                                </div>
                            </div>
                            <div className="as-progress-bar">
                                <div className={`progress-fill ${activeService.estado}`}></div>
                            </div>
                        </div>
                    )}

                    {/* ✅ ChatWindow — se monta solo si hay servicio activo y el usuario abrió el chat */}
                    {showChat && activeService && (
                        <ChatWindow
                            serviceId={activeService.id}
                            userId={currentUser?.id}
                            userName={userName}
                            onClose={() => setShowChat(false)}
                        />
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
                        <div className="map-card" style={{ flex: 2, position: 'relative', overflow: 'hidden' }}>
                            <div className="map-head">Mapa de servicio en tiempo real</div>
                            <div className="map-body" style={{ height: '400px', width: '100%', position: 'relative' }}>
                                <MapContainer
                                    center={[clientCoords.lat, clientCoords.lng]}
                                    zoom={14}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    scrollWheelZoom={true}
                                    ref={mapRef}
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; OpenStreetMap'
                                    />
                                    <MapControls centerUser={() => mapRef.current?.setView([clientCoords.lat, clientCoords.lng], 15)} />
                                    <Marker position={[clientCoords.lat, clientCoords.lng]} icon={homeIcon}>
                                        <Popup>Tu ubicación</Popup>
                                    </Marker>
                                    {filteredMechanics.map((mech) => (
                                        <Marker
                                            key={mech.mecanico_id || mech.id}
                                            position={[mech.latitud || mech.lat, mech.longitud || mech.lng]}
                                            icon={carIcon}
                                            eventHandlers={{ click: () => handleSelectMechanic(mech) }}
                                        >
                                            <Popup>
                                                <strong>{mech.nombre_completo || mech.nombre}</strong><br />
                                                {mech.especialidad}
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>

                                {showDetail && selectedMechanic && (
                                    <div className="mech-detail-panel" style={{ zIndex: 1000 }}>
                                        <button className="close-panel" onClick={() => setShowDetail(false)}>✕</button>
                                        <div className="detail-header">
                                            <div className="detail-avatar">
                                                {(selectedMechanic.nombre_completo || "M")[0].toUpperCase()}
                                            </div>
                                            <div className="detail-info">
                                                <h4>{selectedMechanic.nombre_completo || selectedMechanic.nombre}</h4>
                                                <p>{selectedMechanic.especialidad || 'Mecánico General'}</p>
                                            </div>
                                        </div>
                                        <div className="detail-stats">
                                            <span>⭐ {selectedMechanic.promedio_rating || "4.9"}</span>
                                            <span>📍 {selectedMechanic.distancia ? `${selectedMechanic.distancia} km` : 'Cerca'}</span>
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
                                    <div key={mech.mecanico_id || mech.id} className="mc-item" onClick={() => handleSelectMechanic(mech)}>
                                        <div className="mc-info">
                                            <div className="mc-name">{mech.nombre_completo || mech.nombre}</div>
                                            <div className="mc-spec">{mech.distancia ? `${mech.distancia} km • ` : ''}{mech.especialidad}</div>
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
