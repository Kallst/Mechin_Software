// routes/payments.routes.js (o el nombre que le hayas puesto)
const express = require('express');
const router = express.Router();

// Ruta de prueba para que Express no se queje
router.get('/test', (req, res) => {
    res.json({ ok: true, message: "Ruta de pagos funcionando" });
});

// ¡ESTA ES LA LÍNEA CRÍTICA QUE SUELE FALTAR!
module.exports = router;