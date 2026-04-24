const db = require('../../config/db');

const getNotifications = async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const query = `
            SELECT * FROM notificaciones 
            WHERE usuario_id = $1 
            ORDER BY creado_en DESC 
            LIMIT 10
        `;
        const result = await db.query(query, [usuarioId]);
        res.json({ ok: true, notifications: result.rows });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE notificaciones SET leida = TRUE WHERE id = $1", [id]);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

module.exports = { getNotifications, markAsRead };