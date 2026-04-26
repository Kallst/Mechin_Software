const express = require('express');
const router = express.Router();
const reputationController = require('./reputation.controller');
// const { authenticateToken } = require('../../middlewares/auth'); // Descomenta cuando tengas el middleware listo

// Ruta para calificar un servicio (MECHIN-50)
// POST /api/reputation/rate
router.post('/rate', reputationController.postReview);

// Ruta para ver las calificaciones de un mecánico específico (MECHIN-52)
// GET /api/reputation/mechanic/:id
// router.get('/mechanic/:id', reputationController.getMechanicReviews); 

module.exports = router;