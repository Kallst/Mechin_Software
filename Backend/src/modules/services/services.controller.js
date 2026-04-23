const db = require('../../config/db');

const createServiceRequest = async (req, res) => {
    // LOG DE SEGURIDAD: Monitoreo en tiempo real de lo que llega del Frontend
    console.log("=== INICIO PETICIÓN ===");
    console.log("Body recibido:", req.body);

    // 1. Extraemos los campos del body
    const { 
        cliente_id, 
        mecanico_id, 
        tipo_servicio, 
        descripcion, 
        direccion_servicio, 
        latitud_servicio, 
        longitud_servicio 
    } = req.body;

    // 2. Procesamos el ID del mecánico: 
    // Aseguramos que si viene "1" (string) se convierta a 1 (int), y si no viene nada sea null.
    const final_mecanico_id = mecanico_id ? parseInt(mecanico_id) : null;

    console.log("ID del mecánico a insertar:", final_mecanico_id);

    try {
        // 3. Inserción en la tabla 'servicios'
        const queryInsert = `
            INSERT INTO servicios (
                cliente_id, 
                mecanico_id, 
                tipo_servicio, 
                descripcion, 
                direccion_servicio, 
                latitud_servicio, 
                longitud_servicio, 
                estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente') 
            RETURNING *;
        `;
        
        const values = [
            parseInt(cliente_id) || 1, 
            final_mecanico_id, 
            tipo_servicio || 'General', 
            descripcion || 'Sin descripción', 
            direccion_servicio || 'Manizales', 
            latitud_servicio || 5.067, 
            longitud_servicio || -75.517
        ];

        const result = await db.query(queryInsert, values);
        
        // 4. CORRECCIÓN DE REFERENCIA:
        // Según tu pgAdmin, la columna se llama 'servicio_id'. Usamos esa o 'id' como respaldo.
        const nuevoServicioId = result.rows[0].servicio_id || result.rows[0].id;

        // 5. Inserción en el historial de estados
        await db.query(
            `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                nuevoServicioId, 
                parseInt(cliente_id) || 1, 
                'ninguno', 
                'pendiente', 
                final_mecanico_id ? 'Solicitud directa asignada' : 'Solicitud general'
            ]
        );

        console.log("✅ ÉXITO: Servicio guardado con ID:", nuevoServicioId);
        console.log("=== FIN PETICIÓN ===");

        res.status(201).json({ 
            ok: true, 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("❌ ERROR EN BASE DE DATOS:", error.message);
        res.status(500).json({ 
            ok: false, 
            error: error.message 
        });
    }
};

const getActiveServicesCount = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM servicios WHERE cliente_id = $1 AND estado != 'finalizado'", 
            [req.params.clienteId]
        );
        res.json({ ok: true, count: parseInt(result.rows[0].count) });
    } catch (e) { 
        res.json({ ok: false, count: 0 }); 
    }
};

module.exports = { createServiceRequest, getActiveServicesCount };