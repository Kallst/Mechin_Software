const pool = require('../../config/db'); // Ajusta la ruta a tu conexión de BD

const createReview = async (servicioId, clienteId, mecanicoId, puntaje, contenido) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar la calificación
        const resCalificacion = await client.query(
            `INSERT INTO calificaciones (servicio_id, cliente_id, mecanico_id, puntaje) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [servicioId, clienteId, mecanicoId, puntaje]
        );

        // 2. Insertar el comentario asociado
        if (contenido) {
            await client.query(
                `INSERT INTO comentarios (calificacion_id, cliente_id, contenido) 
                 VALUES ($1, $2, $3)`,
                [resCalificacion.rows[0].id, clienteId, contenido]
            );
        }

        // 3. RECALCULAR PROMEDIO (MECHIN-54)
        // Obtenemos el promedio de todas las calificaciones de este mecánico
        const stats = await client.query(
            `SELECT AVG(puntaje) as promedio, COUNT(*) as total 
             FROM calificaciones WHERE mecanico_id = $1`,
            [mecanicoId]
        );

        const { promedio, total } = stats.rows[0];

        // 4. Actualizar el perfil del mecánico con los nuevos datos
        await client.query(
            `UPDATE perfiles_mecanico 
             SET promedio_rating = $1, total_servicios = $2 
             WHERE id = $3`,
            [parseFloat(promedio).toFixed(2), total, mecanicoId]
        );

        await client.query('COMMIT');
        return { success: true, nuevoPromedio: promedio };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { createReview };