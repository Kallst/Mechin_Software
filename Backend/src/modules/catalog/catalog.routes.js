const express = require('express');
const router = express.Router();
const {
    registrarRepuesto,
    actualizarRepuesto,
    borrarRepuesto,
    listarCatalogo,
    detalleRepuesto,
    actualizarEstado,
    listarCategorias
} = require('./catalog.controller');

const authMiddleware = require('../../middlewares/auth.middleware');

// ─── Rutas públicas (no requieren auth) ─────────────────────
// MECHIN-43: Visualización del catálogo + MECHIN-46: Búsqueda + MECHIN-47: Filtrado
router.get('/', listarCatalogo);

// Categorías disponibles — debe ir ANTES de /:id para no colisionar
router.get('/meta/categorias', listarCategorias);

// MECHIN-44: Detalle del repuesto
router.get('/:id', detalleRepuesto);

// ─── Rutas protegidas (requieren auth) ──────────────────────
// MECHIN-40: Registro de repuesto
router.post('/', authMiddleware, registrarRepuesto);

// MECHIN-41: Edición de repuesto
router.put('/:id', authMiddleware, actualizarRepuesto);

// MECHIN-42: Eliminación de repuesto
router.delete('/:id', authMiddleware, borrarRepuesto);

// MECHIN-49: Estado del producto
router.patch('/:id/estado', authMiddleware, actualizarEstado);

module.exports = router;