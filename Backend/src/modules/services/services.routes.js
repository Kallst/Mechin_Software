const { Router } = require('express');
const router = Router();
const servicesController = require('./services.controller');

// Ruta para crear servicio (POST /api/services)
router.post('/', servicesController.createServiceRequest);

// Nueva ruta para estadísticas (GET /api/services/count/:clienteId)
router.get('/count/:clienteId', servicesController.getActiveServicesCount);

// --- NUEVAS RUTAS PARA EL SEGUIMIENTO (MECHIN-80) ---

// Obtener el servicio actual para la tarjeta flotante (GET /api/services/active/:clienteId)
router.get('/active/:clienteId', servicesController.getActiveService);

// Cancelar un servicio desde la tarjeta (PUT /api/services/cancel/:id)
router.put('/cancel/:id', servicesController.cancelService);

module.exports = router;