import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import './PaymentHistoryPage.css';

const MechanicPaymentHistoryPage = () => {
    const navigate = useNavigate();
    const [pagos, setPagos]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = authService.getToken();
                const response = await fetch('http://localhost:5000/api/payments/mechanic-history', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.ok) {
                    setPagos(data.pagos);
                } else {
                    setError('No se pudo cargar el historial de ingresos.');
                }
            } catch (err) {
                setError('Error de conexión con el servidor.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatCOP = (val) =>
        `$${parseFloat(val || 0).toLocaleString('es-CO')}`;

    const formatFecha = (fecha) =>
        new Date(fecha).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const metodoBadge = (metodo) => {
        const map = {
            tarjeta:   { icon: '💳', label: 'Tarjeta' },
            nequi:     { icon: '📱', label: 'Nequi' },
            daviplata: { icon: '🏦', label: 'Daviplata' },
            efectivo:  { icon: '💵', label: 'Efectivo' },
        };
        return map[metodo] || { icon: '💰', label: metodo };
    };

    const totalIngresos   = pagos.reduce((s, p) => s + parseFloat(p.monto_mecanico || 0), 0);
    const totalComisiones = pagos.reduce((s, p) => s + parseFloat(p.comision_plataforma || 0), 0);

    return (
        <div className="shell">

            {/* ── SIDEBAR ── */}
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
                <div className="sb-item" onClick={() => navigate('/dashboard/mecanico')}>Panel de Solicitudes</div>
                <div className="sb-item active">Historial de ingresos</div>
                <div className="sb-spacer"></div>
            </div>

            {/* ── MAIN ── */}
            <div className="main">
                <div className="topbar">
                    <button className="ph-back-btn" onClick={() => navigate('/dashboard/mecanico')}>
                        ← Volver al panel
                    </button>
                    <div style={{ flex: 1 }} />
                </div>

                <div className="content">
                    <div className="greeting">
                        <div>
                            <div className="g-title">Historial de ingresos 💰</div>
                            <div className="g-sub">Todos los pagos recibidos por servicios completados.</div>
                        </div>
                    </div>

                    {/* ── Stats ── */}
                    {!loading && !error && (
                        <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                            <div className="stat">
                                <div className="stat-val or">{pagos.length}</div>
                                <div className="stat-label">Servicios pagados</div>
                            </div>
                            <div className="stat">
                                <div className="stat-val ok">{formatCOP(totalIngresos)}</div>
                                <div className="stat-label">Total recibido</div>
                            </div>
                            <div className="stat">
                                <div className="stat-val bl">{formatCOP(totalComisiones)}</div>
                                <div className="stat-label">Comisiones Mechin</div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="ph-empty">
                            <div className="ph-empty-icon">⏳</div>
                            <div className="ph-empty-title">Cargando historial...</div>
                        </div>
                    )}

                    {error && (
                        <div className="ph-empty">
                            <div className="ph-empty-icon">⚠️</div>
                            <div className="ph-empty-title">{error}</div>
                        </div>
                    )}

                    {!loading && !error && pagos.length === 0 && (
                        <div className="ph-empty">
                            <div className="ph-empty-icon">📭</div>
                            <div className="ph-empty-title">Sin ingresos aún</div>
                            <div className="ph-empty-sub">
                                Cuando completes servicios y los clientes paguen, aparecerán aquí.
                            </div>
                            <button
                                className="btn-solicitar"
                                onClick={() => navigate('/dashboard/mecanico')}
                            >
                                Ver solicitudes →
                            </button>
                        </div>
                    )}

                    {!loading && !error && pagos.length > 0 && (
                        <div className="ph-list">
                            {pagos.map((pago) => {
                                const metodo = metodoBadge(pago.metodo_pago);
                                return (
                                    <div key={pago.id} className="ph-card">
                                        <div className="ph-card-left">
                                            <div className="ph-card-icon">{metodo.icon}</div>
                                            <div className="ph-card-info">
                                                <div className="ph-card-tipo">{pago.tipo_servicio}</div>
                                                <div className="ph-card-meta">
                                                    {pago.cliente_nombre && (
                                                        <span>👤 {pago.cliente_nombre} &nbsp;·&nbsp;</span>
                                                    )}
                                                    <span>{metodo.label}</span>
                                                    &nbsp;·&nbsp;
                                                    <span>{formatFecha(pago.fecha_pago)}</span>
                                                </div>
                                                <div className="ph-card-ref">
                                                    Ref: <span>{pago.referencia}</span>
                                                </div>
                                                <div className="ph-card-meta" style={{ marginTop: '4px' }}>
                                                    📍 {pago.direccion_servicio}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ph-card-right">
                                            <div className="ph-card-monto">{formatCOP(pago.monto_mecanico)}</div>
                                            <div className="ph-card-comision">
                                                Total servicio: {formatCOP(pago.monto_total)}
                                            </div>
                                            <div className="ph-card-comision">
                                                Comisión Mechin: {formatCOP(pago.comision_plataforma)}
                                            </div>
                                            <div className="ph-card-estado">✓ Confirmado</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MechanicPaymentHistoryPage;
