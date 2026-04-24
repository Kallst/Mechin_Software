const express = require('express');
const router = express.Router();
const { getNearbyMechanics, getProfile, updateProfile, toggleAvailability } = require('./mechanics.controller');

// La ruta final será: /api/mechanics/nearby
router.get('/nearby', getNearbyMechanics);

// Rutas de Perfil (MECHIN-JIRA)
router.get('/profile/:userId', getProfile);
router.put('/profile/:userId', updateProfile);
router.put('/availability/:userId', toggleAvailability);

module.exports = router; // <-- CRUCIAL: Sin esto, server.js no puede usarlo