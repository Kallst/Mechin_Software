import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import usersService from '../../services/users.service';
import '../dashboard/ClientDashboard.css'; 
import './EditProfilePage.css';

const EditProfilePage = () => {
    const navigate = useNavigate();
    
    // SOLUCIÓN AL INPUT: Extraemos solo el ID para que React no se confunda
    const currentUserId = authService.getCurrentUser()?.id;
    
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        correo: ''
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        // Ahora solo vigila el ID, evitando peticiones infinitas al escribir
        if (currentUserId) {
            usersService.getUserProfile(currentUserId)
                .then(data => {
                    if (data.ok) {
                        setFormData({
                            nombre_completo: data.user.nombre_completo || '',
                            telefono: data.user.telefono || '',
                            correo: data.user.correo || ''
                        });
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error al cargar perfil:", err);
                    setStatusMessage({ type: 'error', text: 'No se pudo cargar la información.' });
                    setIsLoading(false);
                });
        }
    }, [currentUserId]); // <-- El cambio clave está aquí

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });

        try {
            // Dentro de handleSubmit en EditProfilePage.jsx
            const response = await usersService.updateProfile(currentUserId, {
                nombre_completo: formData.nombre_completo,
                correo: formData.correo, // <-- ¡Agrega esta línea vital!
                telefono: formData.telefono
            });

            // Revisa si tu backend devuelve algo como { ok: true } o simplemente { id, nombre... }
            // Si devuelve 'ok' usamos la primera condición. Si no, ajusta esto según lo que devuelva tu API.
            // Para mantener compatibilidad con lo que veníamos haciendo, asumimos que devuelve un objeto.
            // Si la respuesta tiene error o mensaje, lo atrapamos. Si no, es éxito.
            if (!response.error) { // Asumiendo que tu backend NO envía un campo 'error' cuando es exitoso
                setStatusMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
                
                // Actualizamos también los datos en el localStorage
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (currentUser) {
                    currentUser.nombre_completo = formData.nombre_completo;
                    currentUser.telefono = formData.telefono;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }

                setTimeout(() => navigate('/perfil'), 2000);
            } else {
                setStatusMessage({ type: 'error', text: response.message || 'Error al actualizar.' });
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

    if (isLoading) return <div className="shell"><div className="main"><div className="content">Cargando...</div></div></div>;

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
                <div className="sb-item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Volver al Dashboard</div>
                <div className="sb-item" onClick={() => navigate('/perfil')} style={{ cursor: 'pointer' }}>Mi Perfil</div>
                <div className="sb-item active">Editar Perfil</div>
                
                <div className="sb-spacer"></div>
                
                {/* NUEVO BOTÓN DE CERRAR SESIÓN */}
                <div className="sb-logout-wrapper">
                    <button className="btn-logout-sidebar" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="main">
                <div className="topbar">
                    <div className="g-title" style={{ fontSize: '18px' }}>Configuración de Cuenta</div>
                </div>

                <div className="content">
                    <div className="edit-profile-container">
                        <div className="edit-profile-card">
                            <div className="edit-form-header">
                                <h2>Editar Información</h2>
                                <p>Actualiza tus datos de contacto</p>
                            </div>

                            {statusMessage.text && (
                                <div className={`alert-message alert-${statusMessage.type}`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <form className="edit-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        className="form-input" 
                                        name="correo"
                                        value={formData.correo} 
                                        disabled 
                                        title="El correo no se puede cambiar"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        name="nombre_completo"
                                        value={formData.nombre_completo} 
                                        onChange={handleChange}
                                        placeholder="Ingresa tu nombre"
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        name="telefono"
                                        value={formData.telefono} 
                                        onChange={handleChange}
                                        placeholder="Tu número de contacto"
                                    />
                                </div>

                                <div className="edit-actions">
                                    <button type="button" className="btn-cancel" onClick={() => navigate('/perfil')} disabled={isSaving}>
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

export default EditProfilePage;