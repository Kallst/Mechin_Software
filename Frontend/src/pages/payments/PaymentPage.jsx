// src/pages/payments/PaymentPage.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { processPayment } from '../../services/payments.service';
import './PaymentPage.css';

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Recibimos los datos del servicio a pagar por navegación.
    // Si no hay datos (entró por URL directa), ponemos un fallback de prueba.
    const serviceData = location.state?.service || {
        id: 1, // Servicio de prueba
        tipo_servicio: 'Mantenimiento General',
        mecanico_nombre: 'Mecánico Asignado',
        precio_estimado: 85000 
    };

    const [selectedMethod, setSelectedMethod] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const methods = [
        { id: 'tarjeta', name: 'Tarjeta de Crédito / Débito', icon: '💳', desc: 'Visa, Mastercard, Amex' },
        { id: 'nequi', name: 'Nequi', icon: '📱', desc: 'Pago rápido con número de celular' },
        { id: 'efectivo', name: 'Efectivo', icon: '💵', desc: 'Paga al mecánico al finalizar' },
    ];

    const handlePayment = async () => {
        if (!selectedMethod) {
            setError('Por favor selecciona un método de pago.');
            return;
        }

        setIsLoading(true);
        setError('');

        const payload = {
            servicio_id: serviceData.id,
            monto: serviceData.precio_estimado,
            metodo_pago: selectedMethod
        };

        const result = await processPayment(payload);

        setIsLoading(false);

        if (result.ok) {
            setIsSuccess(true);
            // Redirigir al historial después de 3 segundos
            setTimeout(() => {
                navigate('/dashboard'); // O a '/payments/history' cuando exista
            }, 3000);
        } else {
            setError(result.message || result.error || 'Ocurrió un error al procesar el pago.');
        }
    };

    if (isSuccess) {
        return (
            <div className="payment-shell">
                <div className="payment-container" style={{ display: 'block' }}>
                    <div className="pay-success">
                        <h2>✅ ¡Pago Exitoso!</h2>
                        <p>Tu transacción se ha registrado correctamente y el servicio ha finalizado.</p>
                        <p style={{ color: 'var(--muted)', marginTop: '20px' }}>Redirigiendo al inicio...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-shell">
            <div className="payment-container">
                <div className="payment-header">
                    <h1>Confirmar Pago</h1>
                    <button className="btn-back" onClick={() => navigate(-1)}>Volver</button>
                </div>

                {/* Columna Izquierda: Resumen */}
                <div className="summary-section">
                    <div className="summary-title">Resumen del Servicio</div>
                    
                    <div className="summary-item">
                        <span>Servicio</span>
                        <strong>{serviceData.tipo_servicio}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Mecánico</span>
                        <span>{serviceData.mecanico_nombre}</span>
                    </div>
                    <div className="summary-item">
                        <span>Ubicación</span>
                        <span>Manizales, Caldas</span>
                    </div>
                    
                    <div className="summary-item total">
                        <span>Total a Pagar</span>
                        <span>$ {serviceData.precio_estimado.toLocaleString('es-CO')}</span>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '20px', lineHeight: '1.4' }}>
                        * Al hacer clic en pagar, aceptas los términos de Mechin. El pago es procesado de forma segura y garantizada.
                    </p>
                </div>

                {/* Columna Derecha: Métodos */}
                <div className="methods-section">
                    <div className="summary-title">Método de Pago</div>

                    {error && <div className="pay-error">⚠️ {error}</div>}

                    {methods.map(method => (
                        <div 
                            key={method.id} 
                            className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                            onClick={() => setSelectedMethod(method.id)}
                        >
                            <div className="method-icon">{method.icon}</div>
                            <div className="method-info">
                                <h4>{method.name}</h4>
                                <p>{method.desc}</p>
                            </div>
                        </div>
                    ))}

                    <button 
                        className="btn-pay" 
                        onClick={handlePayment} 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : `Pagar $${serviceData.precio_estimado.toLocaleString('es-CO')}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;