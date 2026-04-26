// ============================================================
// MECHIN — Rutas del módulo de Pagos
// ============================================================

const express = require('express');
const router  = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const {
    processPayment,
    getPaymentHistory,
    getMechanicPaymentHistory,
    getPaymentBreakdown
} = require('./payments.controller');

// POST /api/payments/process — Procesar un pago
router.post('/process', authMiddleware, processPayment);

// GET /api/payments/history — Historial de pagos del cliente (MECHIN-61)
router.get('/history', authMiddleware, getPaymentHistory);

// GET /api/payments/mechanic-history — Historial de ingresos del mecánico (MECHIN-62)
router.get('/mechanic-history', authMiddleware, getMechanicPaymentHistory);

// GET /api/payments/:pagoId/breakdown — Desglose de un pago específico
router.get('/:pagoId/breakdown', authMiddleware, getPaymentBreakdown);

module.exports = router;