const { Router } = require('express');
const router = Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const {
    createServiceRequest,
    getActiveServicesCount,
    getActiveServiceForClient,
    cancelService,
    getPendingRequestsForMechanic,
    getActiveServiceForMechanic,
    acceptService,
    rejectService,
    updateServiceStatus
} = require('./services.controller');

// ── Rutas del cliente ────────────────────────────────────────
// ClientDashboard llama exactamente estas URLs:
router.post('/',                            authMiddleware, createServiceRequest);
router.get('/count',                        authMiddleware, getActiveServicesCount);        // ← sin :clienteId en URL
router.get('/active',                       authMiddleware, getActiveServiceForClient);     // ← servicio activo del cliente
router.put('/cancel/:serviceId',            authMiddleware, cancelService);                 // ← cancelar servicio

// ── Rutas del mecánico ───────────────────────────────────────
// MechanicDashboard llama exactamente estas URLs:
router.get('/mechanic/pending/:mecanicoId', authMiddleware, getPendingRequestsForMechanic);
router.get('/mechanic/active/:mecanicoId',  authMiddleware, getActiveServiceForMechanic);
router.put('/accept/:serviceId',            authMiddleware, acceptService);
router.put('/reject/:serviceId',            authMiddleware, rejectService);
router.put('/status/:serviceId',            authMiddleware, updateServiceStatus);

module.exports = router;