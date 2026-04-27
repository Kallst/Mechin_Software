const express = require('express');
const router = express.Router();
const reputationController = require('./reputation.controller');
const authMiddleware = require('../../middlewares/auth.middleware'); 

// Ruta para calificar un servicio
// POST /api/reputation/calificar
router.post('/calificar', authMiddleware, reputationController.postReview);

// Ruta para ver las calificaciones de un mecánico específico (opcional para el futuro)
// router.get('/mechanic/:id', reputationController.getMechanicReviews); 

module.exports = router;