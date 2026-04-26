import React, { useState, useEffect, useCallback } from 'react';
import './StoreDashboard.css';
import authService from '../../services/auth.service';
import catalogService from '../../services/catalog.service';

const StoreDashboard = () => {
    const [user, setUser]               = useState(null);
    const [repuestos, setRepuestos]     = useState([]);
    const [categorias, setCategorias]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState('');
    const [showForm, setShowForm]       = useState(false);
    const [activeTab, setActiveTab]     = useState('catalogo'); // 'catalogo' | 'agregar' | 'editar'

    // ── MECHIN-41: repuesto en edición ────────────────────────────
    const [repuestoEditar, setRepuestoEditar] = useState(null);

    const formInicial = {
        nombre: '', categoria_id: '', descripcion: '',
        marca: '', referencia: '', precio: '', stock: '', imagen_url: ''
    };
    const [formData, setFormData] = useState(formInicial);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
    });

    const getInitials = (name) => {
        if (!name) return 'TI';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const formatPrecio = (precio) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

    // ── Cargar usuario ────────────────────────────────────────────
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) setUser(currentUser);
    }, []);

    // ── Cargar categorías ─────────────────────────────────────────
    useEffect(() => {
        catalogService.getCategorias().then(data => {
            if (data.ok) setCategorias(data.categorias || []);
        });
    }, []);

    // ── Cargar repuestos de la tienda ─────────────────────────────
    const cargarRepuestos = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await catalogService.getCatalogo({ limit: 50 });
            if (data.ok) {
                setRepuestos(data.repuestos || []);
            }
        } catch {
            setError('Error cargando repuestos');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { cargarRepuestos(); }, [cargarRepuestos]);

    // ── Manejo del formulario ─────────────────────────────────────
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // ── Validación compartida (MECHIN-48) ─────────────────────────
    const validarForm = () => {
        if (!formData.nombre.trim() || formData.nombre.trim().length < 2)
            return 'El nombre es obligatorio (mínimo 2 caracteres)';
        if (!formData.categoria_id)
            return 'Selecciona una categoría';
        if (!formData.precio || isNaN(formData.precio) || parseFloat(formData.precio) < 0)
            return 'El precio debe ser un número mayor o igual a 0';
        return null;
    };

    // ── MECHIN-40: Registrar ──────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        const err = validarForm();
        if (err) return setFormError(err);

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                precio: parseFloat(formData.precio),
                stock:  parseInt(formData.stock) || 0,
                categoria_id: parseInt(formData.categoria_id)
            };

            const data = await catalogService.crearRepuesto(payload);

            if (data.ok) {
                setSuccess('✅ Repuesto registrado exitosamente');
                setFormData(formInicial);
                setActiveTab('catalogo');
                cargarRepuestos();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setFormError(data.message || 'Error al registrar el repuesto');
            }
        } catch {
            setFormError('Error de conexión con el servidor');
        } finally {
            setSubmitting(false);
        }
    };

    // ── MECHIN-41: Abrir formulario de edición ────────────────────
    const handleAbrirEditar = (rep) => {
        setRepuestoEditar(rep);
        setFormData({
            nombre:       rep.nombre              || '',
            categoria_id: String(rep.categoria_id) || '',
            descripcion:  rep.descripcion         || '',
            marca:        rep.marca               || '',
            referencia:   rep.referencia          || '',
            precio:       rep.precio              || '',
            stock:        rep.stock               || '',
            imagen_url:   rep.imagen_url          || ''
        });
        setFormError('');
        setActiveTab('editar');
    };

    // ── MECHIN-41: Guardar edición ────────────────────────────────
    const handleSubmitEditar = async (e) => {
        e.preventDefault();
        setFormError('');
        const err = validarForm();
        if (err) return setFormError(err);

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                precio:       parseFloat(formData.precio),
                stock:        parseInt(formData.stock) || 0,
                categoria_id: parseInt(formData.categoria_id)
            };

            const data = await catalogService.editarRepuesto(repuestoEditar.id, payload);

            if (data.ok) {
                setSuccess('✅ Repuesto actualizado exitosamente');
                setFormData(formInicial);
                setRepuestoEditar(null);
                setActiveTab('catalogo');
                cargarRepuestos();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setFormError(data.message || 'Error al actualizar el repuesto');
            }
        } catch {
            setFormError('Error de conexión con el servidor');
        } finally {
            setSubmitting(false);
        }
    };

    // ── MECHIN-42: Eliminar repuesto ──────────────────────────────
    const handleEliminar = async (rep) => {
        if (!window.confirm(`¿Eliminar "${rep.nombre}"? Esta acción no se puede deshacer.`)) return;
        try {
            const data = await catalogService.eliminarRepuesto(rep.id);
            if (data.ok) {
                setSuccess('✅ Repuesto eliminado correctamente');
                cargarRepuestos();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Error al eliminar');
            }
        } catch {
            setError('Error de conexión con el servidor');
        }
    };

    const handleCambiarEstado = async (id, estadoActual) => {
        const estados = ['disponible', 'agotado', 'descontinuado'];
        const siguiente = estados[(estados.indexOf(estadoActual) + 1) % estados.length];
        try {
            const data = await catalogService.cambiarEstado(id, siguiente);
            if (data.ok) cargarRepuestos();
        } catch {
            setError('Error actualizando estado');
        }
    };

    const estadoColor = {
        disponible:    { bg: '#0d3d2a', color: '#4ade80' },
        agotado:       { bg: '#3d1a0d', color: '#fb923c' },
        descontinuado: { bg: '#2a1a2e', color: '#a78bfa' }
    };

    // ── Formulario compartido (agregar y editar) ──────────────────
    const renderFormulario = (esEdicion) => (
        <div className="store-section">
            <div className="store-section-header">
                <h3>{esEdicion ? '✏️ Editar repuesto' : '➕ Registrar nuevo repuesto'}</h3>
                <button
                    className="btn-volver"
                    onClick={() => {
                        setActiveTab('catalogo');
                        setFormData(formInicial);
                        setRepuestoEditar(null);
                        setFormError('');
                    }}
                >
                    ← Volver
                </button>
            </div>

            {formError && <div className="store-alert store-alert-err">{formError}</div>}

            <form className="store-form" onSubmit={esEdicion ? handleSubmitEditar : handleSubmit}>
                <div className="form-grid-2">
                    <div className="fg-group">
                        <label>Nombre del repuesto *</label>
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Ej: Filtro de aceite Renault Logan"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="fg-input"
                            required
                        />
                    </div>
                    <div className="fg-group">
                        <label>Categoría *</label>
                        <select
                            name="categoria_id"
                            value={formData.categoria_id}
                            onChange={handleChange}
                            className="fg-input"
                            required
                        >
                            <option value="">Seleccionar categoría</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="fg-group">
                    <label>Descripción</label>
                    <textarea
                        name="descripcion"
                        placeholder="Describe el repuesto, compatibilidad, características..."
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="fg-input fg-textarea"
                        rows={3}
                    />
                </div>

                <div className="form-grid-3">
                    <div className="fg-group">
                        <label>Marca</label>
                        <input
                            type="text"
                            name="marca"
                            placeholder="Ej: Bosch, Gates, NGK"
                            value={formData.marca}
                            onChange={handleChange}
                            className="fg-input"
                        />
                    </div>
                    <div className="fg-group">
                        <label>Referencia</label>
                        <input
                            type="text"
                            name="referencia"
                            placeholder="Ej: OF-123"
                            value={formData.referencia}
                            onChange={handleChange}
                            className="fg-input"
                        />
                    </div>
                    <div className="fg-group">
                        <label>Stock</label>
                        <input
                            type="number"
                            name="stock"
                            placeholder="0"
                            min="0"
                            value={formData.stock}
                            onChange={handleChange}
                            className="fg-input"
                        />
                    </div>
                </div>

                <div className="form-grid-2">
                    <div className="fg-group">
                        <label>Precio (COP) *</label>
                        <input
                            type="number"
                            name="precio"
                            placeholder="Ej: 45000"
                            min="0"
                            step="100"
                            value={formData.precio}
                            onChange={handleChange}
                            className="fg-input"
                            required
                        />
                    </div>
                    <div className="fg-group">
                        <label>URL de imagen</label>
                        <input
                            type="url"
                            name="imagen_url"
                            placeholder="https://..."
                            value={formData.imagen_url}
                            onChange={handleChange}
                            className="fg-input"
                        />
                    </div>
                </div>

                {formData.precio && !isNaN(formData.precio) && (
                    <div className="precio-preview">
                        💰 Precio: <strong>{formatPrecio(formData.precio)}</strong>
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-cancelar"
                        onClick={() => {
                            setActiveTab('catalogo');
                            setFormData(formInicial);
                            setRepuestoEditar(null);
                            setFormError('');
                        }}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="btn-guardar" disabled={submitting}>
                        {submitting
                            ? (esEdicion ? 'Guardando...' : 'Registrando...')
                            : (esEdicion ? '✓ Guardar cambios' : '✓ Registrar repuesto')
                        }
                    </button>
                </div>
            </form>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────
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

                <div className="sb-section">Tienda</div>
                <div
                    className={`sb-item ${activeTab === 'catalogo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('catalogo')}
                >
                    📦 Mis repuestos
                </div>
                <div
                    className={`sb-item ${activeTab === 'agregar' ? 'active' : ''}`}
                    onClick={() => { setFormData(formInicial); setRepuestoEditar(null); setActiveTab('agregar'); }}
                >
                    ➕ Agregar repuesto
                </div>

                <div className="sb-spacer"></div>

                <div className="sb-user">
                    <div className="sb-avatar">
                        {getInitials(user?.nombreCompleto || user?.nombre_completo)}
                    </div>
                    <div>
                        <div className="sb-uname">
                            {user?.nombreCompleto || user?.nombre_completo || 'Tienda'}
                        </div>
                        <div className="sb-urole">Tienda de repuestos</div>
                    </div>
                </div>
            </div>

            {/* ── MAIN ─────────────────────────────────────── */}
            <div className="main">

                <div className="topbar">
                    <div className="search-box">
                        <span style={{ color: 'var(--muted2)', fontSize: '13px' }}>Panel de Control</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '13px', marginLeft: '8px' }}>
                            {activeTab === 'catalogo' ? `${repuestos.length} repuestos registrados`
                                : activeTab === 'editar' ? 'Editando repuesto'
                                : 'Nuevo repuesto'}
                        </span>
                    </div>
                </div>

                <div className="content">

                    {success && <div className="store-alert store-alert-ok">{success}</div>}
                    {error   && <div className="store-alert store-alert-err">{error}</div>}

                    {/* ── STATS ── */}
                    <div className="stats">
                        <div className="stat">
                            <div className="stat-val or">{repuestos.length}</div>
                            <div className="stat-label">Total repuestos</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val ok">
                                {repuestos.filter(r => r.estado === 'disponible').length}
                            </div>
                            <div className="stat-label">Disponibles</div>
                        </div>
                        <div className="stat">
                            <div className="stat-val bl">
                                {repuestos.filter(r => r.estado === 'agotado').length}
                            </div>
                            <div className="stat-label">Agotados</div>
                        </div>
                    </div>

                    {/* ── TAB: MIS REPUESTOS ── */}
                    {activeTab === 'catalogo' && (
                        <div className="store-section">
                            <div className="store-section-header">
                                <h3>📦 Mis repuestos</h3>
                                <button
                                    className="btn-agregar"
                                    onClick={() => { setFormData(formInicial); setActiveTab('agregar'); }}
                                >
                                    + Agregar repuesto
                                </button>
                            </div>

                            {loading ? (
                                <div className="store-loading">
                                    <div className="spinner"></div>
                                    <p>Cargando repuestos...</p>
                                </div>
                            ) : repuestos.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🔩</div>
                                    <div className="empty-title">Aún no tienes repuestos</div>
                                    <div className="empty-sub">
                                        Agrega tu primer repuesto para que los clientes puedan verlo.
                                    </div>
                                    <button
                                        className="btn-agregar"
                                        style={{ marginTop: '16px' }}
                                        onClick={() => setActiveTab('agregar')}
                                    >
                                        + Agregar primer repuesto
                                    </button>
                                </div>
                            ) : (
                                <div className="store-table-wrap">
                                    <table className="store-table">
                                        <thead>
                                            <tr>
                                                <th>Repuesto</th>
                                                <th>Categoría</th>
                                                <th>Marca / Ref</th>
                                                <th>Precio</th>
                                                <th>Stock</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {repuestos.map(rep => (
                                                <tr key={rep.id}>
                                                    <td>
                                                        <div className="st-nombre">{rep.nombre}</div>
                                                        {rep.descripcion && (
                                                            <div className="st-desc">
                                                                {rep.descripcion.substring(0, 50)}{rep.descripcion.length > 50 ? '...' : ''}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="st-categoria">{rep.categoria_nombre}</span>
                                                    </td>
                                                    <td>
                                                        <div>{rep.marca || '—'}</div>
                                                        <div className="st-ref">{rep.referencia || ''}</div>
                                                    </td>
                                                    <td>
                                                        <span className="st-precio">{formatPrecio(rep.precio)}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`st-stock ${rep.stock === 0 ? 'st-stock-zero' : ''}`}>
                                                            {rep.stock}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="st-estado-btn"
                                                            style={{
                                                                background: estadoColor[rep.estado]?.bg,
                                                                color: estadoColor[rep.estado]?.color
                                                            }}
                                                            onClick={() => handleCambiarEstado(rep.id, rep.estado)}
                                                            title="Clic para cambiar estado"
                                                        >
                                                            {rep.estado}
                                                        </button>
                                                    </td>
                                                    {/* ── MECHIN-41 y MECHIN-42 ── */}
                                                    <td>
                                                        <div className="st-acciones">
                                                            <button
                                                                className="btn-editar"
                                                                onClick={() => handleAbrirEditar(rep)}
                                                                title="Editar repuesto"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="btn-eliminar"
                                                                onClick={() => handleEliminar(rep)}
                                                                title="Eliminar repuesto"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB: AGREGAR (MECHIN-40) ── */}
                    {activeTab === 'agregar' && renderFormulario(false)}

                    {/* ── TAB: EDITAR (MECHIN-41) ── */}
                    {activeTab === 'editar' && renderFormulario(true)}

                </div>
            </div>
        </div>
    );
};

export default StoreDashboard;