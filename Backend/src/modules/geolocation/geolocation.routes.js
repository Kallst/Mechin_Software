const express = require('express');
const router = express.Router();
const geoController = require('./geolocation.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.put('/update', authMiddleware, geoController.actualizarUbicacion);

module.exports = router;