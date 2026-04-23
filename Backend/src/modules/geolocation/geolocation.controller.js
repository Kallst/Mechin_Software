const db = require('../../config/db');

const actualizarUbicacion = async (req, res) => {
    const usuarioId = req.user.id; // Obtenido del auth.middleware
    const { latitud, longitud } = req.body;

    try {
        const query = `
            UPDATE usuarios 
            SET latitud = $1, longitud = $2, actualizado_en = NOW() 
            WHERE id = $3 
            RETURNING id, nombre_completo;
        `;
        const { rows } = await db.query(query, [latitud, longitud, usuarioId]);
        
        res.status(200).json({ 
            success: true, 
            message: "Ubicación actualizada en la base de datos",
            data: rows[0] 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { actualizarUbicacion };