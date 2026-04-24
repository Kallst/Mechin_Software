// src/services/payments.service.js

const API_URL = 'http://localhost:5000/api';

// Función auxiliar para obtener los headers con el token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

/**
 * Procesa un pago enviando los datos al backend
 * @param {Object} paymentData - { servicio_id, monto, metodo_pago }
 */
export const processPayment = async (paymentData) => {
    try {
        const response = await fetch(`${API_URL}/payments/process`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentData),
        });
        return await response.json();
    } catch (error) {
        console.error("Error en processPayment (Frontend):", error);
        return { ok: false, message: "Error de conexión con el servidor." };
    }
};

/**
 * Obtiene el historial de pagos del usuario logueado
 */
export const getPaymentHistory = async () => {
    try {
        const response = await fetch(`${API_URL}/payments/history`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return await response.json();
    } catch (error) {
        console.error("Error en getPaymentHistory (Frontend):", error);
        return { ok: false, message: "Error de conexión con el servidor." };
    }
};