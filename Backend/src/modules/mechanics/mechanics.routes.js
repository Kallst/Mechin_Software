const express = require('express');
const router = express.Router();
const { 
    getNearbyMechanics, getProfile, updateProfile, toggleAvailability, getAllSpecialties, getMechanicSpecialties } = require('./mechanics.controller');

// La ruta final será: /api/mechanics/nearby
router.get('/nearby', getNearbyMechanics);

// Rutas de Perfil (MECHIN-JIRA)
router.get('/profile/:userId', getProfile);
router.put('/profile/:userId', updateProfile);
router.put('/availability/:userId', toggleAvailability);
router.get('/specialties', getAllSpecialties); // Catálogo total
router.get('/profile/:userId/specialties', getMechanicSpecialties); // Las del mecánico
// ... las demás rutas que ya tenías

module.exports = router; // <-- CRUCIAL: Sin esto, server.js no puede usarlo