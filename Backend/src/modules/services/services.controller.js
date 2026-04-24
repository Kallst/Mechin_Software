const db = require('../../config/db');

// --- MECHIN-23: CREAR SOLICITUD ---
const createServiceRequest = async (req, res) => {
    console.log("=== INICIO PETICIÓN (VALIDADA) ===");
    const { 
        cliente_id, mecanico_id, tipo_servicio, descripcion, 
        direccion_servicio, latitud_servicio, longitud_servicio 
    } = req.body;

    if (!tipo_servicio || tipo_servicio.trim() === "" || 
        !descripcion || descripcion.trim() === "" || 
        !direccion_servicio || direccion_servicio.trim() === "") {
        return res.status(400).json({ 
            ok: false, 
            message: "Faltan datos obligatorios: El tipo de servicio, la descripción y la dirección no pueden estar vacíos." 
        });
    }

    if (descripcion.trim().length < 15) {
        return res.status(400).json({ 
            ok: false, 
            message: "La descripción es muy corta. Por favor explica mejor el problema (mínimo 15 caracteres)." 
        });
    }

    const final_mecanico_id = mecanico_id ? parseInt(mecanico_id) : null;
    const final_cliente_id = parseInt(cliente_id);

    try {
        const activeCheck = await db.query(
            "SELECT id FROM servicios WHERE cliente_id = $1 AND estado NOT IN ('finalizado', 'cancelado') LIMIT 1",
            [final_cliente_id]
        );

        if (activeCheck.rows.length > 0) {
            return res.status(400).json({ 
                ok: false, 
                message: "Ya tienes una solicitud activa en el sistema." 
            });
        }

        const queryInsert = `
            INSERT INTO servicios (
                cliente_id, mecanico_id, tipo_servicio, descripcion, 
                direccion_servicio, latitud_servicio, longitud_servicio, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente') 
            RETURNING *;
        `;
        
        const values = [
            final_cliente_id, final_mecanico_id, tipo_servicio, descripcion, 
            direccion_servicio, latitud_servicio || 5.067, longitud_servicio || -75.517
        ];

        const result = await db.query(queryInsert, values);
        const nuevoServicioId = result.rows[0].id;

        await db.query(
            `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [nuevoServicioId, final_cliente_id, 'ninguno', 'pendiente', 'Solicitud creada']
        );

        res.status(201).json({ ok: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// --- MECHIN-80: OBTENER DETALLE DEL SERVICIO ACTIVO ---
const getActiveService = async (req, res) => {
    const { clienteId } = req.params;
    try {
        // CORRECCIÓN: Se usa fecha_solicitud y se hace JOIN con perfiles y luego usuarios
        const query = `
            SELECT s.*, u.nombre_completo as mecanico_nombre 
            FROM servicios s 
            LEFT JOIN perfiles_mecanico pm ON s.mecanico_id = pm.id 
            LEFT JOIN usuarios u ON pm.usuario_id = u.id 
            WHERE s.cliente_id = $1 
            AND s.estado NOT IN ('finalizado', 'cancelado') 
            ORDER BY s.fecha_solicitud DESC 
            LIMIT 1
        `;
        const result = await db.query(query, [clienteId]);

        if (result.rows.length > 0) {
            res.json({ ok: true, service: result.rows[0] });
        } else {
            res.json({ ok: false, message: "No hay servicios activos" });
        }
    } catch (error) {
        console.error("Error en getActiveService:", error.message);
        res.status(500).json({ ok: false, error: error.message });
    }
};

// --- MECHIN-80: CANCELAR SERVICIO ---
const cancelService = async (req, res) => {
    const { id } = req.params;
    try {
        const current = await db.query("SELECT estado, cliente_id FROM servicios WHERE id = $1", [id]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: "No encontrado" });

        const estadoAnterior = current.rows[0].estado;
        const clienteId = current.rows[0].cliente_id;

        await db.query("UPDATE servicios SET estado = 'cancelado' WHERE id = $1", [id]);

        await db.query(
            `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, clienteId, estadoAnterior, 'cancelado', 'Cancelado por el cliente desde el Dashboard']
        );

        res.json({ ok: true, message: "Servicio cancelado exitosamente" });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
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

module.exports = { 
    createServiceRequest, 
    getActiveServicesCount, 
    getActiveService, 
    cancelService 
};