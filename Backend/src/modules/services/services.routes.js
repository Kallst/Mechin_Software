const { Router } = require('express');
const router = Router();
const servicesController = require('./services.controller');
const authMiddleware = require('../../middlewares/auth.middleware'); // <-- AGREGADO

// Protegemos TODAS las rutas de servicios con el token
router.use(authMiddleware); // <-- AGREGADO

// Ruta para crear servicio (POST /api/services)
router.post('/', servicesController.createServiceRequest);

// Nueva ruta para estadísticas (GET /api/services/count) <-- Modificado (sin :clienteId)
router.get('/count', servicesController.getActiveServicesCount);

// --- NUEVAS RUTAS PARA EL SEGUIMIENTO (MECHIN-80) ---

// Obtener el servicio actual para la tarjeta flotante (GET /api/services/active) <-- Modificado (sin :clienteId)
router.get('/active', servicesController.getActiveService);

// Cancelar un servicio desde la tarjeta (PUT /api/services/cancel/:id)
router.put('/cancel/:id', servicesController.cancelService);

module.exports = router;