import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { processPayment } from '../../services/payments.service';
import './PaymentPage.css';

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // El servicio a pagar llega por navegación: navigate('/pagar', { state: { servicio } })
    const servicio = location.state?.servicio || null;

    const currentUser = authService.getCurrentUser();

    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [monto, setMonto] = useState(servicio?.precio_estimado || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pagoExitoso, setPagoExitoso] = useState(null);

    // Si no hay servicio en el state, regresar al dashboard
    useEffect(() => {
        if (!servicio) {
            navigate('/dashboard/cliente', { replace: true });
        }
    }, [servicio, navigate]);

    if (!servicio) return null;

    // Cálculo en tiempo real según el monto ingresado
    const montoNum = parseFloat(monto) || 0;
    const comision = parseFloat((montoNum * 0.15).toFixed(2));
    const montoMecanico = parseFloat((montoNum - comision).toFixed(2));

    const metodos = [
        {
            id: 'tarjeta',
            label: 'Tarjeta de crédito / débito',
            icon: '💳',
            desc: 'Visa, Mastercard, American Express'
        },
        {
            id: 'nequi',
            label: 'Nequi',
            icon: '📱',
            desc: 'Pago inmediato desde tu app'
        },
        {
            id: 'daviplata',
            label: 'Daviplata',
            icon: '🏦',
            desc: 'Transferencia desde Daviplata'
        },
        {
            id: 'efectivo',
            label: 'Efectivo',
            icon: '💵',
            desc: 'Pago al mecánico al finalizar'
        },
    ];

    const handlePagar = async () => {
        setError('');

        if (!monto || montoNum <= 0) {
            setError('Ingresa un monto válido para continuar.');
            return;
        }

        setLoading(true);
        try {
            const result = await processPayment({
                servicio_id: servicio.id,
                monto: montoNum,
                metodo_pago: metodoPago,
            });

            if (result.ok) {
                setPagoExitoso(result.pago);
            } else {
                setError(result.message || 'No se pudo procesar el pago.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    // ── Pantalla de éxito ────────────────────────────────────
    if (pagoExitoso) {
        return (
            <div className="pay-shell">
                <div className="pay-success-card">
                    <div className="pay-success-icon">✅</div>
                    <h2 className="pay-success-title">¡Pago exitoso!</h2>
                    <p className="pay-success-sub">
                        Tu pago fue procesado correctamente.
                    </p>

                    <div className="pay-receipt">
                        <div className="receipt-row">
                            <span>Referencia</span>
                            <span className="receipt-val accent">{pagoExitoso.referencia}</span>
                        </div>
                        <div className="receipt-row">
                            <span>Método de pago</span>
                            <span className="receipt-val">{pagoExitoso.metodo_pago}</span>
                        </div>
                        <div className="receipt-row">
                            <span>Monto total</span>
                            <span className="receipt-val">${pagoExitoso.monto_total.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="receipt-row">
                            <span>Comisión Mechin (15%)</span>
                            <span className="receipt-val muted">${pagoExitoso.comision_plataforma.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="receipt-row">
                            <span>Pago al mecánico</span>
                            <span className="receipt-val ok">${pagoExitoso.monto_mecanico.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="receipt-row">
                            <span>Estado</span>
                            <span className="receipt-val ok">Confirmado ✓</span>
                        </div>
                    </div>

                    <button
                        className="pay-btn-primary"
                        onClick={() => navigate('/dashboard/cliente')}
                    >
                        Volver al inicio →
                    </button>
                </div>
            </div>
        );
    }

    // ── Pantalla principal de pago ───────────────────────────
    return (
        <div className="pay-shell">
            <div className="pay-layout">

                {/* ──Columna izquierda: Resumen del servicio ── */}
                <div className="pay-summary-col">
                    <button className="pay-back-btn" onClick={() => navigate(-1)}>
                        ← Volver
                    </button>

                    <p className="pay-eyebrow">Resumen del servicio</p>
                    <h2 className="pay-title">Confirmar pago</h2>
                    <p className="pay-sub">Revisa los detalles antes de proceder.</p>

                    <div className="pay-service-card">
                        <div className="psc-header">
                            <div className="psc-icon">🔧</div>
                            <div>
                                <div className="psc-tipo">{servicio.tipo_servicio}</div>
                                <div className="psc-estado">
                                    <span className="estado-dot"></span>
                                    {servicio.estado?.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="psc-rows">
                            <div className="psc-row">
                                <span>📍 Dirección</span>
                                <span>{servicio.direccion_servicio}</span>
                            </div>
                            {servicio.mecanico_nombre && (
                                <div className="psc-row">
                                    <span>🧑‍🔧 Mecánico</span>
                                    <span>{servicio.mecanico_nombre}</span>
                                </div>
                            )}
                            <div className="psc-row">
                                <span>📋 Descripción</span>
                                <span className="psc-desc">{servicio.descripcion}</span>
                            </div>
                        </div>
                    </div>

                    {/* Desglose del costo */}
                    <div className="pay-breakdown">
                        <div className="breakdown-title">Desglose del pago</div>
                        <div className="breakdown-row">
                            <span>Subtotal del servicio</span>
                            <span>${montoNum.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="breakdown-row muted">
                            <span>Comisión plataforma (15%)</span>
                            <span>−${comision.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="breakdown-row ok">
                            <span>Pago al mecánico (85%)</span>
                            <span>${montoMecanico.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="breakdown-divider"></div>
                        <div className="breakdown-row total">
                            <span>Total a pagar</span>
                            <span>${montoNum.toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                </div>

                {/* ── Columna derecha: Formulario de pago ── */}
                <div className="pay-form-col">
                    <div className="pay-form-card">
                        <div className="pfc-header">
                            <div className="pfc-logo-box">
                                <svg viewBox="0 0 18 18" fill="none">
                                    <circle cx="9" cy="6" r="3.5" fill="#ff6e2d" opacity=".9"/>
                                    <path d="M1 17c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#ff6e2d" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div>
                                <div className="pfc-brand">ME<em>CH</em>IN</div>
                                <div className="pfc-sub">Pago seguro</div>
                            </div>
                        </div>

                        {/* Monto */}
                        <div className="pf-group">
                            <label className="pf-label">Monto del servicio (COP)</label>
                            <div className="pf-amount-wrap">
                                <span className="pf-currency">$</span>
                                <input
                                    type="number"
                                    className="pf-amount-input"
                                    placeholder="0"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Método de pago */}
                        <div className="pf-group">
                            <label className="pf-label">Método de pago</label>
                            <div className="pf-metodos">
                                {metodos.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`pf-metodo ${metodoPago === m.id ? 'selected' : ''}`}
                                        onClick={() => setMetodoPago(m.id)}
                                    >
                                        <span className="pm-icon">{m.icon}</span>
                                        <div className="pm-info">
                                            <div className="pm-label">{m.label}</div>
                                            <div className="pm-desc">{m.desc}</div>
                                        </div>
                                        <div className="pm-check">
                                            {metodoPago === m.id ? '●' : '○'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="pf-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Info de seguridad */}
                        <div className="pf-security-note">
                            <span>🔒</span>
                            <span>Tus datos están protegidos. Este es un pago simulado dentro de Mechin.</span>
                        </div>

                        {/* Botón de pago */}
                        <button
                            className="pay-btn-primary"
                            onClick={handlePagar}
                            disabled={loading}
                        >
                            {loading
                                ? 'Procesando...'
                                : `Pagar $${montoNum.toLocaleString('es-CO')} →`}
                        </button>

                        <button
                            className="pay-btn-outline"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentPage;
