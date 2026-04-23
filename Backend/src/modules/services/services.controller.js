const db = require('../../config/db');

/**
 * MECHIN-13: Crea una nueva solicitud de servicio
 */
const createServiceRequest = async (req, res) => {
    const { 
        cliente_id, 
        tipo_servicio, 
        descripcion, 
        direccion_servicio, 
        latitud_servicio, 
        longitud_servicio 
    } = req.body;

    try {
        // 1. Insertar en tabla servicios
        const queryInsertServicio = `
            INSERT INTO servicios (
                cliente_id, tipo_servicio, descripcion, direccion_servicio, 
                latitud_servicio, longitud_servicio, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente') 
            RETURNING *;
        `;
        
        const valuesServicio = [
            cliente_id || 1, 
            tipo_servicio, 
            descripcion, 
            direccion_servicio || 'Cra. 23 #64-15, Manizales', 
            latitud_servicio || 5.067, 
            longitud_servicio || -75.517
        ];

        const result = await db.query(queryInsertServicio, valuesServicio);
        const newService = result.rows[0];

        // 2. Historial de estado inicial
        await db.query(`
            INSERT INTO estados_servicio (
                servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion
            ) VALUES ($1, $2, $3, $4, $5)`,
            [newService.id, cliente_id || 1, 'ninguno', 'pendiente', 'Solicitud inicial creada']
        );

        res.status(201).json({
            ok: true,
            message: "Solicitud registrada correctamente",
            data: newService
        });

    } catch (error) {
        console.error("❌ Error en createServiceRequest:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * MECHIN-13: Obtiene el conteo real de servicios activos
 */
const getActiveServicesCount = async (req, res) => {
    const { clienteId } = req.params;
    try {
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
        console.error("❌ Error en getActiveServicesCount:", error);
        res.status(500).json({ ok: false, count: 0 });
    }
};

// --- EL BLOQUE QUE ESTABA FALLANDO (EXPLICACIÓN ABAJO) ---
module.exports = {
    createServiceRequest,
    getActiveServicesCount
};