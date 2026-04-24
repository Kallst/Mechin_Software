import React, { useState, useEffect, useCallback } from 'react';
import './MechanicDashboard.css';
import authService from '../../services/auth.service';
import MechanicProfileModal from './MechanicProfileModal';

const MechanicDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cargar usuario autenticado
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    // Para desarrollo si no hay token usamos uno fijo
    if (currentUser) {
      setUser(currentUser);
    } else {
      setUser({ id: 2, nombreCompleto: "Juan Pérez", role: "mecanico" });
    }
  }, []);

  // Cargar perfil del mecanico
  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:5000/api/mechanics/profile/${user.id}`);
      const data = await response.json();
      if (data.ok) {
        setProfile(data.profile);
        setIsAvailable(data.profile.disponible);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  }, [user]);

  // Obtener solicitudes pendientes
  const fetchPendingRequests = useCallback(async () => {
    if (!profile) return;
    try {
      const response = await fetch(`http://localhost:5000/api/services/mechanic/pending/${profile.id}`);
      const data = await response.json();
      if (data.ok) {
        setPendingRequests(data.requests);
      }
    } catch (error) {
      console.error("Error buscando solicitudes:", error);
    }
  }, [profile]);

  // Obtener servicio activo
  const fetchActiveService = useCallback(async () => {
    if (!profile) return;
    try {
      const response = await fetch(`http://localhost:5000/api/services/mechanic/active/${profile.id}`);
      const data = await response.json();
      if (data.ok && data.service) {
        setActiveService(data.service);
      } else {
        setActiveService(null);
      }
    } catch (error) {
      console.error("Error verificando servicio activo:", error);
    }
  }, [profile]);

  // Efectos de carga
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      fetchPendingRequests();
      fetchActiveService();
      // Polling cada 10 segundos
      const interval = setInterval(() => {
        fetchPendingRequests();
        fetchActiveService();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [profile, fetchPendingRequests, fetchActiveService]);

  // Acciones
  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    try {
      const response = await fetch(`http://localhost:5000/api/mechanics/availability/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: newStatus })
      });
      const data = await response.json();
      if (data.ok) {
        setIsAvailable(newStatus);
      }
    } catch (error) {
      console.error("Error actualizando disponibilidad:", error);
    }
  };

  const handleAcceptService = async (serviceId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/accept/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicId: profile.id })
      });
      const data = await response.json();
      if (data.ok) {
        fetchPendingRequests();
        fetchActiveService();
      }
    } catch (error) {
      console.error("Error aceptando servicio:", error);
    }
  };

  const handleRejectService = async (serviceId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/reject/${serviceId}`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.ok) {
        fetchPendingRequests();
      }
    } catch (error) {
      console.error("Error rechazando servicio:", error);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeService) return;
    try {
      const response = await fetch(`http://localhost:5000/api/services/status/${activeService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, mechanicUserId: user.id })
      });
      const data = await response.json();
      if (data.ok) {
        fetchActiveService();
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  return (
    <div className="shell">
      {/* SIDEBAR - IDENTIDAD CLÁSICA MECHIN */}
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
          <div className="sb-item" onClick={() => setIsProfileModalOpen(true)} style={{cursor: 'pointer'}}>Mi Perfil</div>
          <div className="sb-spacer"></div>
          <div className="sb-user">
              <div className="sb-avatar">{user?.nombreCompleto?.[0] || 'M'}</div>
              <div>
                  <div className="sb-uname">{user?.nombreCompleto || 'Mecánico'}</div>
                  <div className="sb-urole">Mecánico</div>
              </div>
          </div>
      </div>

      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
            <div className="search-box">
                <div style={{ color: 'white', fontWeight: 'bold' }}>Panel de Control Mecánico</div>
            </div>

            <div className="notif-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="availability-toggle" style={{ color: 'white' }}>
                  <span style={{ marginRight: '10px' }}>{isAvailable ? '✅ Disponible' : '❌ Ocupado'}</span>
                  <label className="switch">
                    <input type="checkbox" checked={isAvailable} onChange={handleToggleAvailability} />
                    <span className="slider round"></span>
                  </label>
                </div>
            </div>
        </div>

        <div className="content">
          <div className="dashboard-content">
            {/* SERVICIO ACTIVO */}
            {activeService && (
              <section className="active-service-section">
                <div className="greeting">
                    <div>
                        <div className="g-title">Servicio Activo 🚨</div>
                        <div className="g-sub">Tienes un servicio en curso. Por favor complétalo para recibir más solicitudes.</div>
                    </div>
                </div>
                
                <div className="active-service-card" style={{ marginTop: '20px' }}>
                  <div className="status-badge">{activeService.estado.replace('_', ' ')}</div>
                  <h3>{activeService.tipo_servicio}</h3>
                  <p><strong>Cliente:</strong> {activeService.cliente_nombre}</p>
                  <p><strong>Teléfono:</strong> {activeService.cliente_telefono}</p>
                  <p><strong>Dirección:</strong> {activeService.direccion_servicio}</p>
                  <p><strong>Descripción:</strong> {activeService.descripcion}</p>
                  
                  <div className="status-actions">
                    {activeService.estado === 'asignado' || activeService.estado === 'en_progreso' ? (
                      <button className="btn-status" onClick={() => handleUpdateStatus('en_camino')}>Marcar En Camino</button>
                    ) : null}
                    
                    {activeService.estado === 'en_camino' && (
                      <button className="btn-status" onClick={() => handleUpdateStatus('en_progreso')}>Marcar En Progreso (Llegué)</button>
                    )}

                    {(activeService.estado === 'en_progreso' || activeService.estado === 'en_camino') && (
                      <button className="btn-accept" onClick={() => handleUpdateStatus('finalizado')}>Terminar Servicio</button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SOLICITUDES PENDIENTES */}
            {!activeService && (
              <section className="pending-requests-section">
                <div className="greeting">
                    <div>
                        <div className="g-title">Solicitudes Pendientes ({pendingRequests.length})</div>
                        <div className="g-sub">Revisa las solicitudes de clientes cercanos y acepta la que prefieras.</div>
                    </div>
                </div>

                {pendingRequests.length === 0 ? (
                  <p className="no-data" style={{ marginTop: '20px' }}>No hay solicitudes pendientes en este momento.</p>
                ) : (
                  <div className="requests-grid" style={{ marginTop: '20px' }}>
                    {pendingRequests.map(req => (
                      <div key={req.id} className="request-card">
                        <div className="request-header">
                          <span className="request-type">{req.tipo_servicio}</span>
                          <span className="request-time">{new Date(req.fecha_solicitud).toLocaleTimeString()}</span>
                        </div>
                        <div className="request-details">
                          <p><strong>Cliente:</strong> {req.cliente_nombre}</p>
                          <p><strong>Dirección:</strong> {req.direccion_servicio}</p>
                          <p><strong>Problema:</strong> {req.descripcion}</p>
                        </div>
                        <div className="request-actions">
                          <button className="btn-accept" onClick={() => handleAcceptService(req.id)}>Aceptar</button>
                          <button className="btn-reject" onClick={() => handleRejectService(req.id)}>Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>



      <MechanicProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user} 
        initialProfile={profile} 
        onProfileUpdate={loadProfile} 
      />
    </div>
  );
};

export default MechanicDashboard;