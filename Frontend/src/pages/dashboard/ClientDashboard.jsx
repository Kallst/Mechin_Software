import React, { useState, useEffect } from 'react';
import './ClientDashboard.css';
import useGeolocation from '../../hooks/useGeolocation';
import SolicitarModal from '../../components/SolicitarModal/SolicitarModal';

const ClientDashboard = () => {
    const { handleSyncLocation, isSyncing } = useGeolocation();
    
    // Estado para controlar la visibilidad del modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // NUEVO: Estado para manejar las estadísticas dinámicas
    const [stats, setStats] = useState({
        activos: 0,
        mecanicosCerca: 8, // Estos pueden ser estáticos o dinámicos después
        completados: 12,
        rating: "4.8 ★"
    });

    /**
     * Obtiene el conteo real de servicios activos desde el Backend
     */
    const loadActiveCount = async () => {
        try {
            // Usamos el ID 1 por defecto (Juan Pérez)
            const response = await fetch('http://localhost:5000/api/services/count/1');
            const data = await response.json();
            if (data.ok) {
                setStats(prev => ({ ...prev, activos: data.count }));
            }
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    };

    /**
     * Efecto para cargar los datos apenas entre al Dashboard
     */
    useEffect(() => {
        loadActiveCount();
    }, []);

    /**
     * Envía los datos al Backend y actualiza la interfaz
     */
    const handleFinalSubmit = async (datosSolicitud) => {
        try {
            const response = await fetch('http://localhost:5000/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosSolicitud),
            });

            const result = await response.json();

            if (result.ok) {
                setIsModalOpen(false); // Cerramos el modal
                
                // RECARGAR ESTADÍSTICAS: Para que el número cambie de inmediato en pantalla
                await loadActiveCount(); 

                alert("¡Solicitud enviada con éxito! Ya está registrada en el sistema.");
            } else {
                alert("Error al registrar: " + (result.message || "Intente más tarde"));
            }

        } catch (error) {
            console.error("Error al enviar solicitud:", error);
            alert("No se pudo conectar con el servidor. Verifica que el Backend esté encendido.");
        }
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
                    <div className="sb-avatar">JU</div>
                    <div>
                        <div className="sb-uname">Juan Pérez</div>
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
                            <div className="g-title">Hola, Juan 👋</div>
                            <div className="g-sub">¿Necesitas un mecánico hoy? Hay {stats.mecanicosCerca} disponibles cerca de ti.</div>
                        </div>
                        <button className="btn-solicitar" onClick={() => setIsModalOpen(true)}>
                            + Solicitar servicio
                        </button>
                    </div>

                    <div className="stats">
                        <div className="stat">
                            <div className="stat-val or">{stats.mecanicosCerca}</div>
                            <div className="stat-label">Mecánicos disponibles</div>
                        </div>
                        
                        {/* ESTADÍSTICA DINÁMICA CONECTADA AL BACKEND */}
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
                            <div className="map-body">
                                <div className="map-grid"></div>
                                <div className="map-you"></div>
                                <div className="map-pin" style={{top:'22%', left:'28%'}}>
                                    <span>Carlos · 0.8km</span>
                                </div>
                            </div>
                        </div>
                        <div className="mecanicos-card">
                            <div className="mc-head">Disponibles ahora</div>
                            <div className="mc-list">
                                <div className="mc-item">
                                    <div className="mc-avatar">CA</div>
                                    <div className="mc-info">
                                        <div className="mc-name">Carlos Ramírez</div>
                                        <div className="mc-spec">Mecánica general</div>
                                    </div>
                                    <div className="mc-btn">Solicitar</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL INTEGRADO Y CONECTADO AL BACKEND */}
            <SolicitarModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleFinalSubmit}
                isSyncing={isSyncing}
            />
        </div>
    );
};

export default ClientDashboard;