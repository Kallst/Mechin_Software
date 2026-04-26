import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentHistory } from '../../services/payments.service';
import './PaymentHistoryPage.css';

const PaymentHistoryPage = () => {
    const navigate = useNavigate();
    const [pagos, setPagos]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getPaymentHistory();
                if (data.ok) {
                    setPagos(data.pagos);
                } else {
                    setError('No se pudo cargar el historial.');
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
                <div className="sb-section">Principal</div>
                <div className="sb-item" onClick={() => navigate('/dashboard/cliente')}>Inicio</div>
                <div className="sb-item" onClick={() => navigate('/catalogo')}>Catálogo de repuestos</div>
                <div className="sb-item active">Historial de pagos</div>
                <div className="sb-spacer"></div>
            </div>

            {/* ── MAIN ── */}
            <div className="main">
                <div className="topbar">
                    <button className="ph-back-btn" onClick={() => navigate('/dashboard/cliente')}>
                        ← Volver al inicio
                    </button>
                    <div style={{ flex: 1 }} />
                </div>

                <div className="content">
                    <div className="greeting">
                        <div>
                            <div className="g-title">Historial de pagos 💳</div>
                            <div className="g-sub">Todos tus pagos realizados en Mechin.</div>
                        </div>
                    </div>

                    {/* ── Stats resumen ── */}
                    {!loading && !error && (
                        <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                            <div className="stat">
                                <div className="stat-val or">{pagos.length}</div>
                                <div className="stat-label">Total pagos</div>
                            </div>
                            <div className="stat">
                                <div className="stat-val ok">
                                    {formatCOP(pagos.reduce((s, p) => s + parseFloat(p.monto_total || 0), 0))}
                                </div>
                                <div className="stat-label">Total pagado</div>
                            </div>
                            <div className="stat">
                                <div className="stat-val bl">
                                    {formatCOP(pagos.reduce((s, p) => s + parseFloat(p.comision_plataforma || 0), 0))}
                                </div>
                                <div className="stat-label">Comisiones Mechin</div>
                            </div>
                        </div>
                    )}

                    {/* ── Contenido ── */}
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
                            <div className="ph-empty-title">Sin pagos aún</div>
                            <div className="ph-empty-sub">
                                Cuando completes y pagues un servicio, aparecerá aquí.
                            </div>
                            <button
                                className="btn-solicitar"
                                onClick={() => navigate('/dashboard/cliente')}
                            >
                                Solicitar un servicio →
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
                                                    {pago.mecanico_nombre && (
                                                        <span>🧑‍🔧 {pago.mecanico_nombre} &nbsp;·&nbsp; </span>
                                                    )}
                                                    <span>{metodo.label}</span>
                                                    &nbsp;·&nbsp;
                                                    <span>{formatFecha(pago.fecha_pago)}</span>
                                                </div>
                                                <div className="ph-card-ref">
                                                    Ref: <span>{pago.referencia}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ph-card-right">
                                            <div className="ph-card-monto">{formatCOP(pago.monto_total)}</div>
                                            <div className="ph-card-comision">
                                                Comisión: {formatCOP(pago.comision_plataforma)}
                                            </div>
                                            <div className="ph-card-mecanico-monto">
                                                Al mecánico: {formatCOP(pago.monto_mecanico)}
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

export default PaymentHistoryPage;
