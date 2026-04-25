const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const authMiddleware = require('../../middlewares/auth.middleware');

// GET /api/chat/:serviceId — historial de mensajes del servicio
router.get('/:serviceId', authMiddleware, async (req, res) => {
    const { serviceId } = req.params;
    try {
        const result = await db.query(
            `SELECT id, emisor_id, emisor_nombre, texto, enviado_en
             FROM chat_mensajes
             WHERE servicio_id = $1
             ORDER BY enviado_en ASC`,
            [serviceId]
        );
        res.json({ ok: true, messages: result.rows });
    } catch (err) {
        console.error('Error cargando historial de chat:', err);
        res.status(500).json({ ok: false, message: 'Error al cargar mensajes' });
    }
});

module.exports = router;