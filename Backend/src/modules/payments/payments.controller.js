// ============================================================
// MECHIN — payments.controller.js
// Capa HTTP: recibe requests, llama al service, responde
// ============================================================

const paymentsService = require('./payments.service');

// ============================================================
// POST /api/payments/process
// ============================================================
const processPayment = async (req, res) => {
    const { servicio_id, monto, metodo_pago } = req.body;
    const clienteId = req.user.id;

    if (!servicio_id || !monto || !metodo_pago) {
        return res.status(400).json({
            ok: false,
            message: 'Faltan campos obligatorios: servicio_id, monto, metodo_pago'
        });
    }

    try {
        const pago = await paymentsService.procesarPago({
            servicio_id,
            monto,
            metodo_pago,
            clienteId
        });

        res.status(201).json({
            ok: true,
            message: 'Pago procesado exitosamente',
            pago
        });

    } catch (error) {
        console.error('❌ Error al procesar pago:', error);
        res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'Error interno del servidor'
        });
    }
};

// ============================================================
// GET /api/payments/history
// ============================================================
const getPaymentHistory = async (req, res) => {
    const clienteId = req.user.id;

    try {
        const pagos = await paymentsService.obtenerHistorialPagos(clienteId);

        res.json({
            ok: true,
            pagos
        });

    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================================
// GET /api/payments/:pagoId/breakdown
// ============================================================
const getPaymentBreakdown = async (req, res) => {
    const { pagoId } = req.params;
    const clienteId = req.user.id;

    try {
        const resultado = await paymentsService.obtenerDesglosePago({
            pagoId,
            clienteId
        });

        res.json({
            ok: true,
            ...resultado
        });

    } catch (error) {
        console.error('❌ Error al obtener desglose:', error);
        res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'Error interno del servidor'
        });
    }
};

module.exports = {
    processPayment,
    getPaymentHistory,
    getPaymentBreakdown
};