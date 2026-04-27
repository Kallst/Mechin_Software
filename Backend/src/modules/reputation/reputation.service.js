const db = require('../../config/db'); // Importamos lo que sea que exporte tu db.js

const createReview = async (servicioId, clienteId, mecanicoId, puntaje, contenido) => {
    try {
        // 1. Insertar la calificación
        // Usamos db.query directamente. Si db es una función, usamos db('SQL').
        const query = typeof db.query === 'function' ? db.query.bind(db) : db;

        const resCalificacion = await query(
            `INSERT INTO calificaciones (servicio_id, cliente_id, mecanico_id, puntaje) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [servicioId, clienteId, mecanicoId, puntaje]
        );

        const calificacionId = resCalificacion.rows[0].id;

        // 2. Insertar el comentario asociado (si existe)
        if (contenido && contenido.trim() !== "") {
            await query(
                `INSERT INTO comentarios (calificacion_id, cliente_id, contenido) 
                 VALUES ($1, $2, $3)`,
                [calificacionId, clienteId, contenido]
            );
        }

        // 3. Obtener nuevas estadísticas del mecánico
        const stats = await query(
            `SELECT AVG(puntaje) as promedio, COUNT(*) as total 
             FROM calificaciones WHERE mecanico_id = $1`,
            [mecanicoId]
        );

        const { promedio, total } = stats.rows[0];

        // 4. Actualizar el perfil del mecánico
        // Nota: Según tu init.sql, la columna es 'total_servicios'
        await query(
            `UPDATE perfiles_mecanico 
             SET promedio_rating = $1, total_servicios = $2 
             WHERE id = $3`,
            [parseFloat(promedio).toFixed(2), total, mecanicoId]
        );

        return { success: true, nuevoPromedio: promedio };
        
    } catch (error) {
        console.error("Error detallado en createReview:", error);
        throw error; // Re-lanzamos para que el controlador lo capture
    }
};

module.exports = { createReview };