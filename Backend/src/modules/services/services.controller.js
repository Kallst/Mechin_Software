const getActiveServicesCount = async (req, res) => {
    const { clienteId } = req.params;
    try {
        // SQL simplificado: contamos filas filtrando por cliente y estados activos
        // Eliminamos cualquier referencia a columnas de fecha para evitar el error SQL
        const query = `
            SELECT COUNT(*) FROM servicios 
            WHERE cliente_id = $1 
            AND estado IN ('pendiente', 'asignado', 'en_camino', 'en_progreso')
        `;
        const result = await db.query(query, [clienteId]);
        
        res.status(200).json({
            ok: true,
            count: parseInt(result.rows[0].count)
        });
    } catch (error) {
        console.error("❌ Error al obtener conteo:", error);
        res.status(500).json({ ok: false, message: "Error al obtener estadísticas" });
    }
};