import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import catalogService from '../../services/catalog.service';
import './CatalogPage.css';

const ESTADOS = [
    { value: '', label: 'Todos los estados' },
    { value: 'disponible', label: 'Disponible' },
    { value: 'agotado', label: 'Agotado' },
    { value: 'descontinuado', label: 'Descontinuado' }
];

const EstadoBadge = ({ estado }) => {
    const colores = {
        disponible:    { bg: '#0d3d2a', color: '#4ade80', label: 'Disponible' },
        agotado:       { bg: '#3d1a0d', color: '#fb923c', label: 'Agotado' },
        descontinuado: { bg: '#2a1a2e', color: '#a78bfa', label: 'Descontinuado' }
    };
    const c = colores[estado] || colores.disponible;
    return (
        <span style={{
            background: c.bg, color: c.color,
            padding: '2px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px'
        }}>
            {c.label}
        </span>
    );
};

const CatalogPage = () => {
    const navigate = useNavigate();
    const [repuestos, setRepuestos]       = useState([]);
    const [categorias, setCategorias]     = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [totalPages, setTotalPages]     = useState(1);
    const [total, setTotal]               = useState(0);

    // Filtros
    const [filtros, setFiltros] = useState({
        nombre: '', categoria_id: '', marca: '', estado: '', page: 1, limit: 12
    });

    const cargarCatalogo = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await catalogService.getCatalogo(filtros);
            if (data.ok) {
                setRepuestos(data.repuestos || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            } else {
                setError(data.message || 'Error al cargar el catálogo');
            }
        } catch {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        cargarCatalogo();
    }, [cargarCatalogo]);

    useEffect(() => {
        catalogService.getCategorias().then(data => {
            if (data.ok) setCategorias(data.categorias || []);
        });
    }, []);

    const handleFiltro = (key, value) => {
        setFiltros(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleBuscar = (e) => {
        e.preventDefault();
        cargarCatalogo();
    };

    const formatPrecio = (precio) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

    return (
        <div className="catalog-shell">
            {/* ── Sidebar ── */}
            <div className="catalog-sidebar">
                <div className="cs-logo" onClick={() => navigate('/dashboard/cliente')} style={{ cursor: 'pointer' }}>
                    <div className="cs-logo-box">
                        <svg viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="6" r="3.5" fill="#ff6e2d" opacity=".9"/>
                            <path d="M1 17c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#ff6e2d" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div className="cs-brand">ME<em>CH</em>IN</div>
                </div>

                <div className="cs-section">Navegación</div>
                <div className="cs-item" onClick={() => navigate('/dashboard/cliente')}>🏠 Inicio</div>
                <div className="cs-item active">🔧 Catálogo</div>

                <div className="cs-section">Filtrar por categoría</div>
                <div
                    className={`cs-item ${filtros.categoria_id === '' ? 'active' : ''}`}
                    onClick={() => handleFiltro('categoria_id', '')}
                >
                    Todas las categorías
                </div>
                {categorias.map(cat => (
                    <div
                        key={cat.id}
                        className={`cs-item ${filtros.categoria_id === String(cat.id) ? 'active' : ''}`}
                        onClick={() => handleFiltro('categoria_id', String(cat.id))}
                    >
                        {cat.nombre}
                    </div>
                ))}

                <div className="cs-section">Estado</div>
                {ESTADOS.map(e => (
                    <div
                        key={e.value}
                        className={`cs-item ${filtros.estado === e.value ? 'active' : ''}`}
                        onClick={() => handleFiltro('estado', e.value)}
                    >
                        {e.label}
                    </div>
                ))}
            </div>

            {/* ── Main ── */}
            <div className="catalog-main">
                {/* Topbar */}
                <div className="catalog-topbar">
                    <form className="catalog-search-box" onSubmit={handleBuscar}>
                        <input
                            type="text"
                            placeholder="Buscar repuesto o marca..."
                            value={filtros.nombre}
                            onChange={e => handleFiltro('nombre', e.target.value)}
                        />
                        <button type="submit">Buscar</button>
                    </form>
                    <div className="catalog-total">{total} repuestos encontrados</div>
                </div>

                {/* Contenido */}
                <div className="catalog-content">
                    {error && <div className="catalog-error">{error}</div>}

                    {loading ? (
                        <div className="catalog-loading">
                            <div className="spinner"></div>
                            <p>Cargando catálogo...</p>
                        </div>
                    ) : repuestos.length === 0 ? (
                        <div className="catalog-empty">
                            <div className="empty-icon">🔩</div>
                            <h3>No se encontraron repuestos</h3>
                            <p>Intenta con otros filtros o términos de búsqueda</p>
                        </div>
                    ) : (
                        <div className="catalog-grid">
                            {repuestos.map(rep => (
                                <div
                                    key={rep.id}
                                    className="repuesto-card"
                                    onClick={() => navigate(`/catalogo/${rep.id}`)}
                                >
                                    <div className="rc-image">
                                        {rep.imagen_url
                                            ? <img src={rep.imagen_url} alt={rep.nombre} />
                                            : <div className="rc-placeholder">🔧</div>
                                        }
                                        <div className="rc-badge-estado">
                                            <EstadoBadge estado={rep.estado} />
                                        </div>
                                    </div>
                                    <div className="rc-body">
                                        <div className="rc-categoria">{rep.categoria_nombre}</div>
                                        <div className="rc-nombre">{rep.nombre}</div>
                                        {rep.marca && <div className="rc-marca">{rep.marca} {rep.referencia ? `• ${rep.referencia}` : ''}</div>}
                                        <div className="rc-tienda">🏪 {rep.tienda_nombre}</div>
                                        <div className="rc-footer">
                                            <div className="rc-precio">{formatPrecio(rep.precio)}</div>
                                            <div className="rc-stock">
                                                {rep.stock > 0 ? `${rep.stock} en stock` : 'Sin stock'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="catalog-pagination">
                            <button
                                disabled={filtros.page <= 1}
                                onClick={() => handleFiltro('page', filtros.page - 1)}
                            >
                                ← Anterior
                            </button>
                            <span>Página {filtros.page} de {totalPages}</span>
                            <button
                                disabled={filtros.page >= totalPages}
                                onClick={() => handleFiltro('page', filtros.page + 1)}
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CatalogPage;