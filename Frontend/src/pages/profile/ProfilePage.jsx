import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import usersService from '../../services/users.service';
import '../dashboard/ClientDashboard.css'; // Mantenemos el cascarón (shell, sidebar, topbar)
import './ProfilePage.css'; // Importamos los nuevos estilos específicos

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        if (currentUser?.id) {
            usersService.getUserProfile(currentUser.id)
                .then(data => {
                    if (data.ok) setUser(data.user);
                })
                .catch(err => console.error("Error al cargar perfil:", err));
        }
    }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return <div className="shell"><div className="main"><div className="content">Cargando...</div></div></div>;

    const initials = user.nombre_completo ? user.nombre_completo.substring(0, 2).toUpperCase() : 'US';

    return (
        <div className="shell">
            {/* Sidebar minimalista para el perfil */}
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
                <div className="sb-section">Opciones</div>
                <div className="sb-item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Volver al Dashboard</div>
                <div className="sb-item active">Mi Perfil</div>
                <div className="sb-spacer"></div>
                <div className="sb-item" onClick={handleLogout} style={{ color: 'var(--orange2)', cursor: 'pointer' }}>
                    Cerrar Sesión
                </div>
            </div>

            <div className="main">
                <div className="topbar">
                    <div className="g-title" style={{ fontSize: '18px' }}>Mi Cuenta</div>
                </div>

                <div className="content">
                    <div className="profile-container">
                        <div className="profile-card">
                            <div className="profile-avatar-wrapper">
                                <div className="profile-avatar">
                                    {initials}
                                </div>
                            </div>
                            
                            <div className="profile-info">
                                <h2 className="profile-name">{user.nombre_completo}</h2>
                                <div className="profile-email">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                    {user.correo}
                                </div>

                                <div className="profile-details-grid">
                                    <div className="detail-item">
                                        <div className="detail-label">Teléfono</div>
                                        <div className="detail-value">{user.telefono || 'No registrado'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="detail-label">Rol</div>
                                        <div className="detail-value" style={{ textTransform: 'capitalize' }}>
                                            {user.rol || 'Cliente'}
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button className="btn-profile-edit" onClick={() => navigate('/perfil/editar')}>
                                        Editar Información
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;