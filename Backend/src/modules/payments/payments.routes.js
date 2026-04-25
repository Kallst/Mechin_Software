// ============================================================
// MECHIN — Rutas del módulo de Pagos
// ============================================================

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const {
    processPayment,
    getPaymentHistory,
    getPaymentBreakdown
} = require('./payments.controller');

// POST /api/payments/process — Procesar un pago (requiere autenticación)
router.post('/process', authMiddleware, processPayment);

// GET /api/payments/history — Historial de pagos del cliente (requiere autenticación)
router.get('/history', authMiddleware, getPaymentHistory);

// GET /api/payments/:pagoId/breakdown — Desglose de un pago específico (requiere autenticación)
router.get('/:pagoId/breakdown', authMiddleware, getPaymentBreakdown);

module.exports = router;