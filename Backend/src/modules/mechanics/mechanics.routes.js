const express = require('express');
const router = express.Router();
const { getNearbyMechanics } = require('./mechanics.controller');

// La ruta final será: /api/mechanics/nearby
router.get('/nearby', getNearbyMechanics);

module.exports = router; // <-- CRUCIAL: Sin esto, server.js no puede usarlo