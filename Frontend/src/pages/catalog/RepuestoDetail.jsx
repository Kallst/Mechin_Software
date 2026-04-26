import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import catalogService from '../../services/catalog.service';
import './RepuestoDetail.css';

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
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 700
        }}>
            {c.label}
        </span>
    );
};

const RepuestoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [repuesto, setRepuesto] = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await catalogService.getRepuestoById(id);
                if (data.ok) {
                    setRepuesto(data.repuesto);
                } else {
                    setError(data.message || 'Repuesto no encontrado');
                }
            } catch {
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, [id]);

    const formatPrecio = (precio) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

    if (loading) return (
        <div className="detail-loading">
            <div className="spinner"></div>
            <p>Cargando repuesto...</p>
        </div>
    );

    if (error) return (
        <div className="detail-error-page">
            <div>🔩</div>
            <h3>{error}</h3>
            <button onClick={() => navigate('/catalogo')}>← Volver al catálogo</button>
        </div>
    );

    return (
        <div className="detail-shell">
            <div className="detail-topbar">
                <button className="btn-back" onClick={() => navigate('/catalogo')}>
                    ← Volver al catálogo
                </button>
                <div className="detail-breadcrumb">
                    Catálogo / {repuesto.categoria_nombre} / {repuesto.nombre}
                </div>
            </div>

            <div className="detail-body">
                {/* Imagen */}
                <div className="detail-image-col">
                    <div className="detail-image-box">
                        {repuesto.imagen_url
                            ? <img src={repuesto.imagen_url} alt={repuesto.nombre} />
                            : <div className="detail-img-placeholder">🔧</div>
                        }
                    </div>
                </div>

                {/* Info */}
                <div className="detail-info-col">
                    <div className="detail-categoria">{repuesto.categoria_nombre}</div>
                    <h1 className="detail-nombre">{repuesto.nombre}</h1>

                    <div className="detail-estado-row">
                        <EstadoBadge estado={repuesto.estado} />
                        {repuesto.stock > 0
                            ? <span className="detail-stock-ok">✓ {repuesto.stock} unidades disponibles</span>
                            : <span className="detail-stock-no">✕ Sin stock</span>
                        }
                    </div>

                    <div className="detail-precio">{formatPrecio(repuesto.precio)}</div>

                    {repuesto.descripcion && (
                        <div className="detail-descripcion">
                            <h4>Descripción</h4>
                            <p>{repuesto.descripcion}</p>
                        </div>
                    )}

                    <div className="detail-specs">
                        {repuesto.marca && (
                            <div className="spec-row">
                                <span className="spec-label">Marca</span>
                                <span className="spec-value">{repuesto.marca}</span>
                            </div>
                        )}
                        {repuesto.referencia && (
                            <div className="spec-row">
                                <span className="spec-label">Referencia</span>
                                <span className="spec-value">{repuesto.referencia}</span>
                            </div>
                        )}
                        <div className="spec-row">
                            <span className="spec-label">Categoría</span>
                            <span className="spec-value">{repuesto.categoria_nombre}</span>
                        </div>
                    </div>

                    {/* Tienda */}
                    <div className="detail-tienda-card">
                        <div className="tienda-icon">🏪</div>
                        <div className="tienda-info">
                            <div className="tienda-nombre">{repuesto.tienda_nombre}</div>
                            {repuesto.tienda_direccion && (
                                <div className="tienda-dir">📍 {repuesto.tienda_direccion}</div>
                            )}
                            {repuesto.tienda_telefono && (
                                <div className="tienda-tel">📞 {repuesto.tienda_telefono}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepuestoDetail;