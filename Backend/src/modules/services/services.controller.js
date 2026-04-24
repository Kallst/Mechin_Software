const db = require('../../config/db');

const createServiceRequest = async (req, res) => {
    // LOG DE SEGURIDAD
    console.log("=== INICIO PETICIÓN (VALIDADA) ===");
    console.log("Body recibido:", req.body);

    const { 
        cliente_id, 
        mecanico_id, 
        tipo_servicio, 
        descripcion, 
        direccion_servicio, 
        latitud_servicio, 
        longitud_servicio 
    } = req.body;

    // --- MECHIN-23: VALIDACIONES DE ENTRADA ---
    
    // 1. Validar campos vacíos (Criterio: No se deben permitir campos vacíos)
    if (!tipo_servicio || tipo_servicio.trim() === "" || 
        !descripcion || descripcion.trim() === "" || 
        !direccion_servicio || direccion_servicio.trim() === "") {
        return res.status(400).json({ 
            ok: false, 
            message: "Faltan datos obligatorios: El tipo de servicio, la descripción y la dirección no pueden estar vacíos." 
        });
    }

    // 2. Validar longitud de la descripción (Criterio: descripción obligatoria y clara)
    if (descripcion.trim().length < 15) {
        return res.status(400).json({ 
            ok: false, 
            message: "La descripción es muy corta. Por favor explica mejor el problema (mínimo 15 caracteres)." 
        });
    }

    const final_mecanico_id = mecanico_id ? parseInt(mecanico_id) : null;
    const final_cliente_id = parseInt(cliente_id);

    try {
        // --- MECHIN-23: REGLA DE NEGOCIO (DUPLICADOS) ---
        // Verificamos si Mariana ya tiene un servicio que no esté finalizado ni cancelado
        const activeCheck = await db.query(
            "SELECT id FROM servicios WHERE cliente_id = $1 AND estado NOT IN ('finalizado', 'cancelado') LIMIT 1",
            [final_cliente_id]
        );

        if (activeCheck.rows.length > 0) {
            return res.status(400).json({ 
                ok: false, 
                message: "Ya tienes una solicitud activa en el sistema. Debes esperar a que termine para solicitar otra." 
            });
        }

        // 3. Inserción en la tabla 'servicios' (Si pasó las validaciones)
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
            final_cliente_id, 
            final_mecanico_id, 
            tipo_servicio, 
            descripcion, 
            direccion_servicio, 
            latitud_servicio || 5.067, 
            longitud_servicio || -75.517
        ];

        const result = await db.query(queryInsert, values);
        const nuevoServicioId = result.rows[0].id; // Usamos 'id' que es el estándar de tu tabla

        // 4. Inserción en el historial de estados
        await db.query(
            `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                nuevoServicioId, 
                final_cliente_id, 
                'ninguno', 
                'pendiente', 
                final_mecanico_id ? `Solicitud directa al mecánico #${final_mecanico_id}` : 'Solicitud general'
            ]
        );

        console.log("✅ ÉXITO: MECHIN-23 cumplida. Servicio ID:", nuevoServicioId);
        res.status(201).json({ ok: true, data: result.rows[0] });

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        res.status(500).json({ ok: false, error: "Error interno al procesar la solicitud" });
    }
};

const getActiveServicesCount = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM servicios WHERE cliente_id = $1 AND estado NOT IN ('finalizado', 'cancelado')", 
            [req.params.clienteId]
        );
        res.json({ ok: true, count: parseInt(result.rows[0].count) });
    } catch (e) { 
        res.json({ ok: false, count: 0 }); 
    }
};

module.exports = { createServiceRequest, getActiveServicesCount };