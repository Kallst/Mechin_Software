import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import '../dashboard/ClientDashboard.css'; 
import './MechanicProfilePage.css'; // Apuntamos al nuevo CSS

const MechanicProfilePage = () => {
    const navigate = useNavigate();
    const currentUserId = authService.getCurrentUser()?.id;
    const token = authService.getToken(); // Necesario para las peticiones
    
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        telefono: '',
        direccion: '',
        biografia: ''
    });
    
    const [allSpecialties, setAllSpecialties] = useState([]);
    const [selectedSpecialties, setSelectedSpecialties] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!currentUserId) return;

        const loadMechanicData = async () => {
            try {
                // 1. Cargar Perfil Básico y Biografía
                const profileRes = await fetch(`http://localhost:5000/api/mechanics/profile/${currentUserId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const profileData = await profileRes.json();

                // 2. Cargar Catálogo Total de Especialidades
                const catRes = await fetch(`http://localhost:5000/api/mechanics/specialties`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const catData = await catRes.json();

                // 3. Cargar Especialidades Actuales del Mecánico
                const mechSpecRes = await fetch(`http://localhost:5000/api/mechanics/profile/${currentUserId}/specialties`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const mechSpecData = await mechSpecRes.json();

                if (profileData.ok) {
                    setFormData({
                        nombre_completo: profileData.profile.nombre_completo || '',
                        correo: profileData.profile.correo || '',
                        telefono: profileData.profile.telefono || '',
                        direccion: profileData.profile.direccion || '',
                        biografia: profileData.profile.biografia || ''
                    });
                }

                if (catData.ok) setAllSpecialties(catData.specialties);
                
                if (mechSpecData.ok) {
                    // Extraemos solo los IDs para el array de seleccionados
                    const currentIds = mechSpecData.specialties.map(s => s.id);
                    setSelectedSpecialties(currentIds);
                }

            } catch (error) {
                console.error("Error al cargar datos del mecánico:", error);
                setStatusMessage({ type: 'error', text: 'No se pudo cargar la información.' });
            } finally {
                setIsLoading(false);
            }
        };

        loadMechanicData();
    }, [currentUserId, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSpecialtyToggle = (specialtyId) => {
        setSelectedSpecialties(prev => {
            if (prev.includes(specialtyId)) {
                return prev.filter(id => id !== specialtyId); // Quitar si ya está
            } else {
                return [...prev, specialtyId]; // Agregar si no está
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await fetch(`http://localhost:5000/api/mechanics/profile/${currentUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    telefono: formData.telefono,
                    direccion: formData.direccion,
                    biografia: formData.biografia,
                    especialidades: selectedSpecialties // Enviamos el array de IDs
                })
            });

            const data = await response.json();

            if (data.ok) { 
                setStatusMessage({ type: 'success', text: '¡Perfil profesional actualizado!' });
                
                // Actualizar info básica en localStorage por si acaso
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (currentUser) {
                    currentUser.telefono = formData.telefono;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }

                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'Error al actualizar.' });
            }
        } catch (error) {
            console.error("Error en la actualización:", error);
            setStatusMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (isLoading) return <div className="shell"><div className="main"><div className="content">Cargando perfil profesional...</div></div></div>;

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
                <div className="sb-section">Opciones</div>
                <div className="sb-item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</div>
                <div className="sb-item active">Mi Perfil Profesional</div>
                
                <div className="sb-spacer"></div>
                
                <div className="sb-logout-wrapper">
                    <button className="btn-logout-sidebar" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="main">
                <div className="topbar">
                    <div className="g-title" style={{ fontSize: '18px' }}>Configuración Profesional</div>
                </div>

                <div className="content">
                    <div className="edit-profile-container">
                        <div className="edit-profile-card">
                            <div className="edit-form-header">
                                <h2>Perfil de Mecánico</h2>
                                <p>Actualiza tus datos y especialidades</p>
                            </div>

                            {statusMessage.text && (
                                <div className={`alert-message alert-${statusMessage.type}`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <form className="edit-form" onSubmit={handleSubmit}>
                                {/* SECCIÓN DATOS BÁSICOS */}
                                <div className="form-group">
                                    <label className="form-label">Correo Electrónico</label>
                                    <input 
                                        type="email" className="form-input" name="correo"
                                        value={formData.correo} disabled 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nombre Completo</label>
                                    <input 
                                        type="text" className="form-input" name="nombre_completo"
                                        value={formData.nombre_completo} disabled 
                                        title="Para cambiar tu nombre contacta a soporte"
                                    />
                                </div>

                                <div className="form-row-double">
                                    <div className="form-group">
                                        <label className="form-label">Teléfono</label>
                                        <input 
                                            type="text" className="form-input" name="telefono"
                                            value={formData.telefono} onChange={handleChange} required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dirección / Taller</label>
                                        <input 
                                            type="text" className="form-input" name="direccion"
                                            value={formData.direccion} onChange={handleChange}
                                            placeholder="Ej: Calle 20 #15-30" required
                                        />
                                    </div>
                                </div>

                                {/* SECCIÓN BIOGRAFÍA */}
                                <div className="form-group">
                                    <label className="form-label">Biografía / Experiencia</label>
                                    <textarea 
                                        className="form-input textarea-input" 
                                        name="biografia"
                                        value={formData.biografia} 
                                        onChange={handleChange}
                                        placeholder="Describe tu experiencia, certificaciones o servicios que ofreces..."
                                        rows="4"
                                    />
                                </div>

                                {/* SECCIÓN ESPECIALIDADES */}
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label className="form-label">Tus Especialidades</label>
                                    <div className="specialties-grid">
                                        {allSpecialties.map(spec => (
                                            <label key={spec.id} className={`specialty-checkbox ${selectedSpecialties.includes(spec.id) ? 'selected' : ''}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedSpecialties.includes(spec.id)}
                                                    onChange={() => handleSpecialtyToggle(spec.id)}
                                                />
                                                <span className="spec-name">{spec.nombre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="edit-actions" style={{ marginTop: '20px' }}>
                                    <button type="button" className="btn-cancel" onClick={() => navigate('/dashboard')} disabled={isSaving}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-save" disabled={isSaving}>
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MechanicProfilePage;