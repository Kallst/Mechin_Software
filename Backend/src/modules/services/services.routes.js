const { Router } = require('express');
const router = Router();
const servicesController = require('./services.controller');

// Ruta para crear servicio (POST /api/services)
router.post('/', servicesController.createServiceRequest);

// Nueva ruta para estadísticas (GET /api/services/count/:clienteId)
router.get('/count/:clienteId', servicesController.getActiveServicesCount);

module.exports = router;