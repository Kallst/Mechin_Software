const db = require('../../config/db');

const getNearbyMechanics = async (req, res) => {
    try {
        // Consulta basada en tu script SQL
        const query = `
            SELECT 
                u.nombre_completo, 
                u.latitud, 
                u.longitud,
                pm.id as mecanico_id,
                pm.promedio_rating,
                (SELECT e.nombre FROM especialidades e 
                 JOIN mecanico_especialidades me ON e.id = me.especialidad_id 
                 WHERE me.perfil_mecanico_id = pm.id LIMIT 1) as especialidad
            FROM usuarios u
            JOIN perfiles_mecanico pm ON u.id = pm.usuario_id
            WHERE pm.disponible = true 
              AND pm.estado_validacion = 'aprobado'
        `;
        
        const result = await db.query(query);

        // Simulamos coordenadas si la DB devuelve nulos para probar el mapa
        const mechanics = result.rows.map(m => ({
            ...m,
            lat: m.latitud ? parseFloat(m.latitud) : (5.06 + Math.random() * 0.01),
            lng: m.longitud ? parseFloat(m.longitud) : (-75.50 + Math.random() * 0.01),
            distancia: (0.5 + Math.random() * 2).toFixed(1)
        }));

        res.status(200).json({
            ok: true,
            mechanics
        });
    } catch (error) {
        console.error("❌ Error en getNearbyMechanics:", error.message);
        res.status(500).json({ ok: false, message: "Error interno del servidor" });
    }
};

module.exports = { getNearbyMechanics };