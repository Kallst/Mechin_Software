const servicesService = require('./services.service');

// --- MECHIN-23: CREAR SOLICITUD ---
const createServiceRequest = async (req, res) => {
    console.log("=== INICIO PETICIÓN (VALIDADA) ===");
    
    // EXTRACCIÓN SEGURA: El ID viene del token JWT, no del body
    const final_cliente_id = req.user.id; 

    const { 
        mecanico_id, tipo_servicio, descripcion, 
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

    try {
        const hasActive = await servicesService.checkActiveService(final_cliente_id);

        if (hasActive) {
            return res.status(400).json({ 
                ok: false, 
                message: "Ya tienes una solicitud activa en el sistema." 
            });
        }

        const newService = await servicesService.createService(
            final_cliente_id, final_mecanico_id, tipo_servicio, descripcion, 
            direccion_servicio, latitud_servicio || 5.067, longitud_servicio || -75.517
        );

        res.status(201).json({ ok: true, data: newService });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// --- MECHIN-80: OBTENER DETALLE DEL SERVICIO ACTIVO ---
const getActiveService = async (req, res) => {
    // EXTRACCIÓN SEGURA: Del token
    const clienteId = req.user.id; 
    
    try {
        const service = await servicesService.getActiveService(clienteId);

        if (service) {
            res.json({ ok: true, service });
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
    const clienteId = req.user.id; // Del token

    try {
        const success = await servicesService.cancelService(id, clienteId);
        
        if (!success) {
            return res.status(404).json({ ok: false, message: "No encontrado o no pertenece a este usuario" });
        }

        res.json({ ok: true, message: "Servicio cancelado exitosamente" });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const getActiveServicesCount = async (req, res) => {
    const clienteId = req.user.id; // Del token
    try {
        const count = await servicesService.getActiveServicesCount(clienteId);
        res.json({ ok: true, count });
    } catch (e) { 
        res.json({ ok: false, count: 0 }); 
    }
};

// --- TAREAS MECÁNICO (MECHIN-JIRA) ---

const getMechanicPendingRequests = async (req, res) => {
    const { mechanicId } = req.params;
    try {
        const query = `
            SELECT s.*, u.nombre_completo as cliente_nombre, u.telefono as cliente_telefono 
            FROM servicios s 
            JOIN usuarios u ON s.cliente_id = u.id 
            WHERE (s.mecanico_id = $1 OR s.mecanico_id IS NULL)
            AND s.estado = 'pendiente'
            ORDER BY s.fecha_solicitud DESC
        `;
        const result = await db.query(query, [mechanicId]);
        res.json({ ok: true, requests: result.rows });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const acceptService = async (req, res) => {
    const { id } = req.params;
    const { mechanicId } = req.body;
    
    try {
        const current = await db.query("SELECT estado, cliente_id FROM servicios WHERE id = $1", [id]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: "Servicio no encontrado" });
        if (current.rows[0].estado !== 'pendiente') return res.status(400).json({ ok: false, message: "El servicio ya no está disponible" });

        const clienteId = current.rows[0].cliente_id;

        await db.query(`
            UPDATE servicios 
            SET estado = 'en_progreso', mecanico_id = $1, fecha_asignacion = NOW() 
            WHERE id = $2
        `, [mechanicId, id]);

        const mechQuery = await db.query("SELECT usuario_id FROM perfiles_mecanico WHERE id = $1", [mechanicId]);
        const mechUserId = mechQuery.rows.length > 0 ? mechQuery.rows[0].usuario_id : null;

        await db.query(`
            INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
            VALUES ($1, $2, 'pendiente', 'en_progreso', 'Servicio aceptado por el mecánico')
        `, [id, mechUserId]);

        await db.query(`
            INSERT INTO notificaciones (usuario_id, servicio_id, tipo, mensaje)
            VALUES ($1, $2, 'servicio_aceptado', 'Un mecánico ha aceptado tu solicitud de servicio.')
        `, [clienteId, id]);

        res.json({ ok: true, message: "Servicio aceptado" });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const rejectService = async (req, res) => {
    const { id } = req.params;
    try {
        const current = await db.query("SELECT estado, cliente_id FROM servicios WHERE id = $1", [id]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: "Servicio no encontrado" });
        
        await db.query(`
            UPDATE servicios 
            SET mecanico_id = NULL 
            WHERE id = $1
        `, [id]);

        await db.query(`
            INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
            VALUES ($1, $2, 'pendiente', 'pendiente', 'Servicio rechazado por el mecánico asignado')
        `, [id, current.rows[0].cliente_id]);

        res.json({ ok: true, message: "Servicio rechazado y devuelto a pendientes" });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const updateServiceStatus = async (req, res) => {
    const { id } = req.params;
    const { status, mechanicUserId } = req.body;

    try {
        const current = await db.query("SELECT estado, cliente_id FROM servicios WHERE id = $1", [id]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: "Servicio no encontrado" });
        
        const estadoAnterior = current.rows[0].estado;
        const clienteId = current.rows[0].cliente_id;

        let queryUpdate = "UPDATE servicios SET estado = $1, actualizado_en = NOW()";
        if (status === 'finalizado') {
            queryUpdate += ", fecha_finalizacion = NOW()";
        }
        queryUpdate += " WHERE id = $2";

        await db.query(queryUpdate, [status, id]);

        await db.query(`
            INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, mechanicUserId || clienteId, estadoAnterior, status, 'Estado actualizado por el mecánico']);

        let mensajeNotificacion = '';
        let tipoNotificacion = '';
        if (status === 'en_camino') {
            mensajeNotificacion = 'El mecánico está en camino a tu ubicación.';
            tipoNotificacion = 'servicio_en_camino';
        } else if (status === 'finalizado') {
            mensajeNotificacion = 'El servicio ha finalizado. ¡No olvides calificar al mecánico!';
            tipoNotificacion = 'servicio_finalizado';
        }

        if (mensajeNotificacion) {
            await db.query(`
                INSERT INTO notificaciones (usuario_id, servicio_id, tipo, mensaje)
                VALUES ($1, $2, $3, $4)
            `, [clienteId, id, tipoNotificacion, mensajeNotificacion]);
        }

        res.json({ ok: true, message: `Servicio cambiado a ${status}` });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const getMechanicActiveService = async (req, res) => {
    const { mechanicId } = req.params;
    try {
        const query = `
            SELECT s.*, u.nombre_completo as cliente_nombre, u.telefono as cliente_telefono, u.latitud as cliente_lat, u.longitud as cliente_lng 
            FROM servicios s 
            JOIN usuarios u ON s.cliente_id = u.id 
            WHERE s.mecanico_id = $1 
            AND s.estado IN ('en_camino', 'en_progreso', 'asignado') 
            ORDER BY s.fecha_solicitud DESC 
            LIMIT 1
        `;
        const result = await db.query(query, [mechanicId]);

        if (result.rows.length > 0) {
            res.json({ ok: true, service: result.rows[0] });
        } else {
            res.json({ ok: false, message: "No hay servicios activos" });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

module.exports = { 
    createServiceRequest, 
    getActiveServicesCount, 
    getActiveService, 
    cancelService,
    getMechanicPendingRequests,
    acceptService,
    rejectService,
    updateServiceStatus,
    getMechanicActiveService
};