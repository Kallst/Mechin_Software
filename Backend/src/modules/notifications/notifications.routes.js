const express = require('express');
const router = express.Router();

// CORRECTO: Están en el mismo nivel, solo necesitas el ./
const { getNotifications } = require('./notifications.controller'); 

router.get('/:usuarioId', getNotifications);

module.exports = router;