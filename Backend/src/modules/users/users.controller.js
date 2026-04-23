const db = require('../../config/db');

const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        // Ajustado según tu script: "nombre_completo" y "usuarios"
        const query = 'SELECT id, nombre_completo, correo, foto_perfil FROM usuarios WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        res.status(200).json({
            ok: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error real en DB:", error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getUserById
};