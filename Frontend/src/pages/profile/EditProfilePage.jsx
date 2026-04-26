import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import usersService from '../../services/users.service';
import '../dashboard/ClientDashboard.css'; 
import './EditProfilePage.css';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const currentUserId = authService.getCurrentUser()?.id;
    
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        correo: ''
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    
    // Estados para la eliminación de cuenta
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
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
    }, [currentUserId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await usersService.updateProfile(currentUserId, {
                nombre_completo: formData.nombre_completo,
                correo: formData.correo, // <-- ¡Mantenemos el correo para que el backend no falle!
                telefono: formData.telefono
            });

            if (!response.error) { 
                setStatusMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
                
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

    // Función para eliminar la cuenta
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await usersService.deleteAccount(currentUserId);
            if (!response.error) {
                // Si se elimina correctamente, borramos la sesión y lo mandamos al login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                setStatusMessage({ type: 'error', text: response.message || 'Error al eliminar la cuenta.' });
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error("Error al eliminar cuenta:", error);
            setStatusMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
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

                            {/* ZONA DE PELIGRO */}
                            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                                <h3 style={{ color: '#d32f2f', fontSize: '16px', marginBottom: '10px' }}>Zona de Peligro</h3>
                                <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                    Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de estar seguro.
                                </p>
                                <button 
                                    type="button" 
                                    onClick={() => setShowDeleteModal(true)}
                                    style={{ background: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Eliminar mi cuenta
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>¿Estás absolutamente seguro?</h2>
                        <p style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                            Esta acción eliminará permanentemente tu cuenta y todos los datos asociados a ella. Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                onClick={() => setShowDeleteModal(false)} 
                                disabled={isDeleting}
                                style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer', color: '#333' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDeleteAccount} 
                                disabled={isDeleting}
                                style={{ padding: '8px 16px', border: 'none', background: '#d32f2f', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                            >
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar cuenta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProfilePage;