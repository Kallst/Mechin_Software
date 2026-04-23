const db = require('../../config/db');

const createServiceRequest = async (req, res) => {
    // LOG DE SEGURIDAD: Esto nos dirá EXACTAMENTE qué recibe el servidor
    console.log("=== INICIO PETICIÓN ===");
    console.log("Body recibido:", req.body);

    // Intentamos capturar el ID de cualquier forma y lo convertimos a número
    let m_id = req.body.mecanico_id || req.body.mecanicoId || req.body.id_mecanico || null;
    
    // Si m_id es una cadena "1", lo convertimos a entero 1
    if (m_id !== null) {
        m_id = parseInt(m_id);
    }

    const { 
        cliente_id, 
        tipo_servicio, 
        descripcion, 
        direccion_servicio, 
        latitud_servicio, 
        longitud_servicio 
    } = req.body;

    console.log("ID del mecánico después de procesar:", m_id);

    try {
        const queryInsert = `
            INSERT INTO servicios (
                cliente_id, mecanico_id, tipo_servicio, descripcion, 
                direccion_servicio, latitud_servicio, longitud_servicio, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente') 
            RETURNING *;
        `;
        
        const values = [
            parseInt(cliente_id) || 1, 
            m_id, 
            tipo_servicio || 'General', 
            descripcion || 'Sin descripción', 
            direccion_servicio || 'Manizales', 
            latitud_servicio || 5.067, 
            longitud_servicio || -75.517
        ];

        const result = await db.query(queryInsert, values);
        
        // Registro en historial
        await db.query(
            `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [result.rows[0].id, parseInt(cliente_id) || 1, 'ninguno', 'pendiente', m_id ? 'Asignado' : 'General']
        );

        console.log("✅ EXITOSO: Guardado con ID", result.rows[0].id);
        console.log("=== FIN PETICIÓN ===");

        res.status(201).json({ ok: true, data: result.rows[0] });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN DB:", error.message);
        res.status(500).json({ ok: false, error: error.message });
    }
};

const getActiveServicesCount = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM servicios WHERE cliente_id = $1 AND estado != 'finalizado'", 
            [req.params.clienteId]
        );
        res.json({ ok: true, count: parseInt(result.rows[0].count) });
    } catch (e) { res.json({ ok: false, count: 0 }); }
};

module.exports = { createServiceRequest, getActiveServicesCount };