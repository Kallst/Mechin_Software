import React, { useState, useEffect, useCallback, useRef } from 'react';
import './MechanicDashboard.css';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import ChatWindow from '../../components/ChatWindow/ChatWindow';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const clienteIcon = new L.DivIcon({
    html: `<div style="font-size:24px;filter:drop-shadow(0 0 6px rgba(36,132,224,0.9));">👤</div>`,
    className: 'custom-leaflet-icon-client',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const MapControls = ({ centerPos, mapRef }) => {
    const map = useMap();
    return (
        <div className="map-custom-controls">
            <button onClick={() => map.zoomIn()} title="Acercar">+</button>
            <button onClick={() => map.zoomOut()} title="Alejar">−</button>
            <button onClick={() => mapRef.current?.setView(centerPos, 15)} title="Centrar" className="btn-locate">📍</button>
        </div>
    );
};

const MechanicDashboard = () => {
    const navigate = useNavigate();

    const [user, setUser]                       = useState(null);
    const [profile, setProfile]                 = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeService, setActiveService]     = useState(null);
    const [isAvailable, setIsAvailable]         = useState(false);
    const [showChat, setShowChat]               = useState(false);
    // --- NUEVO ESTADO PARA ESPECIALIDADES ---
    const [specialties, setSpecialties]         = useState([]); 
    const mapRef = useRef(null);

    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]       = useState('');
    const socketRef                       = useRef(null);
    const activeChatServiceId             = useRef(null);

    const defaultCoords = { lat: 5.067, lng: -75.517 };
    const clientCoords  = activeService?.latitud_servicio
        ? { lat: parseFloat(activeService.latitud_servicio), lng: parseFloat(activeService.longitud_servicio) }
        : defaultCoords;

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
    });

    const getInitials = (name) => {
        if (!name) return 'ME';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    // ── Socket ────────────────────────────────────────────────────
    useEffect(() => {
        socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });
        socketRef.current.on('receive_message', (data) => {
            setChatMessages((prev) => [...prev, data]);
        });
        return () => { socketRef.current.disconnect(); };
    }, []);

    useEffect(() => {
        if (!activeService || !socketRef.current) return;
        const newServiceId = activeService.id;
        if (activeChatServiceId.current === newServiceId) return;
        activeChatServiceId.current = newServiceId;
        if (socketRef.current.connected) {
            socketRef.current.emit('join_chat', newServiceId);
        } else {
            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_chat', newServiceId);
            });
        }
        setChatMessages([]);
        loadChatHistory(newServiceId);
    }, [activeService?.id]);

    const loadChatHistory = async (serviceId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/chat/${serviceId}`,
                { headers: authHeaders() }
            );
            const data = await response.json();
            if (data.ok && Array.isArray(data.messages)) {
                const formatted = data.messages.map((m) => ({
                    id:         m.id,
                    serviceId,
                    senderId:   m.emisor_id,
                    senderName: m.emisor_nombre,
                    text:       m.texto,
                    time:       new Date(m.enviado_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                }));
                setChatMessages(formatted);
            }
        } catch (err) {
            console.error("Error cargando historial de chat:", err);
        }
    };

    const sendChatMessage = () => {
        if (!chatInput.trim() || !socketRef.current?.connected || !activeService) return;
        const msgData = {
            serviceId:  activeService.id,
            senderId:   user?.id,
            senderName: user?.nombreCompleto || user?.nombre_completo || 'Mecánico',
            text:       chatInput,
            time:       new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        };
        socketRef.current.emit('send_message', msgData);
        setChatInput('');
    };

    // ── Carga de datos ────────────────────────────────────────────
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) setUser(currentUser);
    }, []);

    // --- CARGAR ESPECIALIDADES ---
    const loadSpecialties = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/mechanics/profile/${user.id}/specialties`,
                { headers: authHeaders() }
            );
            const data = await response.json();
            if (data.ok) setSpecialties(data.specialties);
        } catch (error) {
            console.error("Error cargando especialidades:", error);
        }
    }, [user]);

    const loadProfile = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/mechanics/profile/${user.id}`,
                { headers: authHeaders() }
            );
            const data = await response.json();
            if (data.ok) {
                setProfile(data.profile);
                setIsAvailable(data.profile.disponible);
                loadSpecialties(); // Cargar especialidades una vez tenemos el perfil
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
        }
    }, [user, loadSpecialties]);

    const fetchPendingRequests = useCallback(async () => {
        if (!profile) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/mechanic/pending/${profile.id}`,
                { headers: authHeaders() }
            );
            const data = await response.json();
            if (data.ok) setPendingRequests(data.requests);
        } catch (error) {
            console.error("Error buscando solicitudes:", error);
        }
    }, [profile]);

    const fetchActiveService = useCallback(async () => {
        if (!profile) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/mechanic/active/${profile.id}`,
                { headers: authHeaders() }
            );
            const data = await response.json();
            if (data.ok && data.service) {
                setActiveService(data.service);
            } else {
                setActiveService(null);
                setShowChat(false);
                activeChatServiceId.current = null;
            }
        } catch (error) {
            console.error("Error verificando servicio activo:", error);
        }
    }, [profile]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    useEffect(() => {
        if (profile) {
            fetchPendingRequests();
            fetchActiveService();
            const interval = setInterval(() => {
                fetchPendingRequests();
                fetchActiveService();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [profile, fetchPendingRequests, fetchActiveService]);

    // ── Acciones ──────────────────────────────────────────────────
    const handleToggleAvailability = async () => {
        const newStatus = !isAvailable;
        try {
            const response = await fetch(
                `http://localhost:5000/api/mechanics/availability/${user.id}`,
                { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ disponible: newStatus }) }
            );
            const data = await response.json();
            if (data.ok) setIsAvailable(newStatus);
        } catch (error) {
            console.error("Error actualizando disponibilidad:", error);
        }
    };

    const handleAcceptService = async (serviceId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/accept/${serviceId}`,
                { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ mechanicId: profile.id }) }
            );
            const data = await response.json();
            if (data.ok) { fetchPendingRequests(); fetchActiveService(); }
        } catch (error) {
            console.error("Error aceptando servicio:", error);
        }
    };

    const handleRejectService = async (serviceId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/reject/${serviceId}`,
                { method: 'PUT', headers: authHeaders() }
            );
            const data = await response.json();
            if (data.ok) fetchPendingRequests();
        } catch (error) {
            console.error("Error rechazando servicio:", error);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!activeService) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/services/status/${activeService.id}`,
                { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status, mechanicUserId: user.id }) }
            );
            const data = await response.json();
            if (data.ok) fetchActiveService();
        } catch (error) {
            console.error("Error actualizando estado:", error);
        }
    };

    const estadoLabel = (estado) => estado?.replace(/_/g, ' ').toUpperCase();

    return (
        <div className="shell">

            {/* ── SIDEBAR ───────────────────────────────────── */}
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

                <div className="sb-section">Mecánico</div>
                <div className="sb-item active">Panel de Solicitudes</div>
                <div className="sb-item" onClick={() => navigate('/historial-ingresos')} style={{ cursor: 'pointer' }}>
                    Historial de ingresos
                </div>

                <div className="sb-spacer"></div>

                <div className="sb-availability">
                    <span className="sb-avail-label">Disponibilidad</span>
                    <div
                        className={`avail-pill ${isAvailable ? 'avail-on' : 'avail-off'}`}
                        onClick={handleToggleAvailability}
                    >
                        <div className="avail-dot"></div>
                        <span>{isAvailable ? 'Disponible' : 'Ocupado'}</span>
                    </div>
                </div>

                {/* AQUÍ SE AGREGÓ EL ONCLICK Y EL CURSOR PARA IR AL PERFIL */}
                <div className="sb-user" onClick={() => navigate('/perfil-mecanico')} style={{ cursor: 'pointer' }}>
                    <div className="sb-avatar">
                        {getInitials(user?.nombreCompleto || user?.nombre_completo)}
                    </div>
                    <div>
                        <div className="sb-uname">
                            {user?.nombreCompleto || user?.nombre_completo || 'Mecánico'}
                        </div>
                        <div className="sb-urole">
                            Mecánico • {profile?.estado_validacion === 'aprobado' ? '✅ Verificado' : '⏳ Pendiente'}
                        </div>
                        {/* --- MUESTRA DE ESPECIALIDADES --- */}
                        <div className="sb-specialties" style={{ fontSize: '10px', color: 'var(--muted2)', marginTop: '4px' }}>
                            {specialties.length > 0 ? specialties.map(s => s.nombre).join(', ') : 'Sin especialidades'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN ─────────────────────────────────────── */}
            <div className="main">

                <div className="topbar">
                    <div className="search-box">
                        <span style={{ color: 'var(--muted2)', fontSize: '13px' }}>Panel de Control</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '13px', marginLeft: '8px' }}>
                            {activeService ? '🚨 Servicio en curso' : `${pendingRequests.length} solicitudes pendientes`}
                        </span>
                    </div>
                    <div className="topbar-status">
                        <div className={`status-indicator ${isAvailable ? 'status-on' : 'status-off'}`}>
                            <span className="status-dot"></span>
                            {isAvailable ? 'En línea' : 'Fuera de línea'}
                        </div>
                    </div>
                </div>

                <div className="content">

                    {/* MENSAJE DE VALIDACIÓN PENDIENTE */}
                    {profile?.estado_validacion === 'pendiente' && (
                        <div className="validation-alert" style={{ background: '#fff3cd', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba', fontSize: '14px', color: '#856404' }}>
                            <strong>Aviso:</strong> Tu perfil está en proceso de validación por Mechin. Podrás recibir solicitudes, pero mantén tus documentos al día.
                        </div>
                    )}

                    <div className="greeting">
                        <div>
                            <div className="g-title">
                                {activeService
                                    ? `Servicio en curso 🔧`
                                    : `Hola, ${user?.nombreCompleto?.split(' ')[0] || 'Mecánico'} 👋`}
                            </div>
                            <div className="g-sub">
                                {activeService
                                    ? `Atendiendo a ${activeService.cliente_nombre} — ${activeService.tipo_servicio}`
                                    : isAvailable
                                        ? 'Estás disponible. Las solicitudes aparecerán aquí en tiempo real.'
                                        : 'Estás marcado como ocupado. Activa tu disponibilidad para recibir solicitudes.'}
                            </div>
                        </div>
                    </div>

                    <div className="stats">
                        <div className="stat">
                            <div className={`stat-val ${isAvailable ? 'ok' : 'or'}`}>
                                {isAvailable ? 'Activo' : 'Inactivo'}
                            </div>
                            <div className="stat-label">Estado</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val bl">{pendingRequests.length}</div>
                            <div className="stat-label">Solicitudes</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val or">{activeService ? '1' : '0'}</div>
                            <div className="stat-label">En curso</div>
                        </div>
                    </div>

                    {activeService && (
                        <div className="map-row">
                            <div className="map-card" style={{ flex: 2, position: 'relative', overflow: 'hidden' }}>
                                <div className="map-head">📍 Ubicación del cliente</div>
                                <div style={{ height: '380px', width: '100%', position: 'relative' }}>
                                    <MapContainer
                                        center={[clientCoords.lat, clientCoords.lng]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                        zoomControl={false}
                                        scrollWheelZoom={true}
                                        ref={mapRef}
                                    >
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                            attribution='&copy; OpenStreetMap'
                                        />
                                        <MapControls centerPos={[clientCoords.lat, clientCoords.lng]} mapRef={mapRef} />
                                        <Marker position={[clientCoords.lat, clientCoords.lng]} icon={clienteIcon}>
                                            <Popup>
                                                <strong>{activeService.cliente_nombre}</strong><br />
                                                {activeService.direccion_servicio}
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            </div>

                            <div className="mecanicos-card" style={{ flex: 1 }}>
                                <div className="mc-head">Detalle del servicio</div>
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                    <div className="active-estado-badge">
                                        <span className="pulse-dot"></span>
                                        {estadoLabel(activeService.estado)}
                                    </div>
                                    <div className="service-detail-row">
                                        <span className="sd-label">Tipo</span>
                                        <span className="sd-val">{activeService.tipo_servicio}</span>
                                    </div>
                                    <div className="service-detail-row">
                                        <span className="sd-label">Cliente</span>
                                        <span className="sd-val">{activeService.cliente_nombre}</span>
                                    </div>
                                    <div className="service-detail-row">
                                        <span className="sd-label">Teléfono</span>
                                        <span className="sd-val">{activeService.cliente_telefono || '—'}</span>
                                    </div>
                                    <div className="service-detail-row">
                                        <span className="sd-label">Dirección</span>
                                        <span className="sd-val">{activeService.direccion_servicio}</span>
                                    </div>
                                    <div className="service-detail-row">
                                        <span className="sd-label">Descripción</span>
                                        <span className="sd-val">{activeService.descripcion}</span>
                                    </div>
                                    <div className="active-service-actions">
                                        {(activeService.estado === 'asignado' || activeService.estado === 'en_progreso') && (
                                            <button className="btn-action btn-camino" onClick={() => handleUpdateStatus('en_camino')}>
                                                🚗 En camino
                                            </button>
                                        )}
                                        {activeService.estado === 'en_camino' && (
                                            <button className="btn-action btn-progreso" onClick={() => handleUpdateStatus('en_progreso')}>
                                                🔧 Llegué — Iniciar
                                            </button>
                                        )}
                                        {(activeService.estado === 'en_progreso' || activeService.estado === 'en_camino') && (
                                            <button className="btn-action btn-finalizar" onClick={() => handleUpdateStatus('finalizado')}>
                                                ✅ Terminar servicio
                                            </button>
                                        )}
                                        <button className="btn-action btn-chat-mech" onClick={() => setShowChat(!showChat)}>
                                            💬 Chat con cliente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!activeService && (
                        <div className="map-row" style={{ display: 'flex', flexDirection: 'column' }}>
                            {pendingRequests.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🔍</div>
                                    <div className="empty-title">Sin solicitudes por ahora</div>
                                    <div className="empty-sub">
                                        {isAvailable
                                            ? 'Estás disponible. Las nuevas solicitudes aparecerán aquí automáticamente.'
                                            : 'Activa tu disponibilidad para empezar a recibir solicitudes.'}
                                    </div>
                                </div>
                            ) : (
                                <div className="requests-grid">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="request-card">
                                            <div className="request-header">
                                                <span className="request-type">{req.tipo_servicio}</span>
                                                <span className="request-time">
                                                    {new Date(req.fecha_solicitud).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="request-details">
                                                <div className="rd-row">
                                                    <span className="rd-label">Cliente</span>
                                                    <span className="rd-val">{req.cliente_nombre}</span>
                                                </div>
                                                <div className="rd-row">
                                                    <span className="rd-label">Dirección</span>
                                                    <span className="rd-val">{req.direccion_servicio}</span>
                                                </div>
                                                <div className="rd-row">
                                                    <span className="rd-label">Problema</span>
                                                    <span className="rd-val">{req.descripcion}</span>
                                                </div>
                                            </div>
                                            <div className="request-actions">
                                                <button className="btn-accept" onClick={() => handleAcceptService(req.id)}>✓ Aceptar</button>
                                                <button className="btn-reject" onClick={() => handleRejectService(req.id)}>✕ Rechazar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* ── CHAT ── */}
            {showChat && activeService && (
                <ChatWindow
                    messages={chatMessages}
                    message={chatInput}
                    onMessageChange={setChatInput}
                    onSend={sendChatMessage}
                    userId={user?.id}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
};

export default MechanicDashboard;