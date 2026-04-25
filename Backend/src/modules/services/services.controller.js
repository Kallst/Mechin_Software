const db = require('../../config/db');

// ============================================================
// Crear solicitud de servicio — POST /api/services
// CORRECCIÓN: cliente_id viene del token (req.user.id), no del body
// ============================================================
const createServiceRequest = async (req, res) => {
    const cliente_id = req.user.id; // ← del JWT, no del body
    const { mecanico_id, tipo_servicio, descripcion, direccion_servicio, latitud_servicio, longitud_servicio, precio_estimado } = req.body;

    if (!tipo_servicio || !descripcion || !direccion_servicio) {
        return res.status(400).json({ ok: false, message: "Faltan campos obligatorios" });
    }

    try {
        const result = await db.query(`
            INSERT INTO servicios 
                (cliente_id, mecanico_id, tipo_servicio, descripcion, direccion_servicio, latitud_servicio, longitud_servicio, precio_estimado, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente')
            RETURNING id
        `, [cliente_id, mecanico_id || null, tipo_servicio, descripcion, direccion_servicio, latitud_servicio || null, longitud_servicio || null, precio_estimado || null]);

        res.status(201).json({ ok: true, message: "Servicio solicitado correctamente", serviceId: result.rows[0].id });
    } catch (error) {
        console.error("❌ Error createServiceRequest:", error);
        res.status(500).json({ ok: false, message: "Error al crear la solicitud" });
    }
};

// ============================================================
// Conteo de servicios activos del cliente — GET /api/services/count
// CORRECCIÓN: cliente_id viene del token, no de la URL
// ============================================================
const getActiveServicesCount = async (req, res) => {
    const cliente_id = req.user.id; // ← del JWT
    try {
        const result = await db.query(`
            SELECT COUNT(*) FROM servicios 
            WHERE cliente_id = $1 
            AND estado IN ('pendiente', 'asignado', 'en_camino', 'en_progreso')
        `, [cliente_id]);
        res.status(200).json({ ok: true, count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error("❌ Error getActiveServicesCount:", error);
        res.status(500).json({ ok: false, message: "Error al obtener estadísticas" });
    }
};

// ============================================================
// Servicio activo del cliente — GET /api/services/active
// NUEVO: ClientDashboard lo necesita para mostrar el estado en tiempo real
// ============================================================
const getActiveServiceForClient = async (req, res) => {
    const cliente_id = req.user.id; // ← del JWT
    try {
        const result = await db.query(`
            SELECT 
                s.id,
                s.tipo_servicio,
                s.descripcion,
                s.direccion_servicio,
                s.estado,
                s.precio_estimado,
                s.fecha_solicitud,
                s.mecanico_id,
                s.pago_id,
                u.nombre_completo AS mecanico_nombre,
                u.telefono AS mecanico_telefono
            FROM servicios s
            LEFT JOIN perfiles_mecanico pm ON s.mecanico_id = pm.id
            LEFT JOIN usuarios u ON pm.usuario_id = u.id
            WHERE s.cliente_id = $1
              AND s.estado IN ('pendiente', 'asignado', 'en_camino', 'en_progreso')
            ORDER BY s.fecha_solicitud DESC
            LIMIT 1
        `, [cliente_id]);

        if (result.rows.length === 0) {
            return res.json({ ok: true, service: null });
        }
        res.json({ ok: true, service: result.rows[0] });
    } catch (error) {
        console.error("❌ Error getActiveServiceForClient:", error);
        res.status(500).json({ ok: false, message: "Error al obtener servicio activo" });
    }
};

// ============================================================
// Cancelar servicio — PUT /api/services/cancel/:serviceId
// NUEVO: ClientDashboard tiene botón de cancelar
// ============================================================
const cancelService = async (req, res) => {
    const { serviceId } = req.params;
    const cliente_id = req.user.id;

    try {
        // Verificar que el servicio pertenece al cliente y está cancelable
        const check = await db.query(`
            SELECT id, estado FROM servicios 
            WHERE id = $1 AND cliente_id = $2
        `, [serviceId, cliente_id]);

        if (check.rows.length === 0) {
            return res.status(404).json({ ok: false, message: "Servicio no encontrado" });
        }

        if (check.rows[0].estado === 'finalizado') {
            return res.status(400).json({ ok: false, message: "No se puede cancelar un servicio finalizado" });
        }

        await db.query(`
            UPDATE servicios SET estado = 'cancelado' WHERE id = $1
        `, [serviceId]);

        res.json({ ok: true, message: "Servicio cancelado" });
    } catch (error) {
        console.error("❌ Error cancelService:", error);
        res.status(500).json({ ok: false, message: "Error al cancelar el servicio" });
    }
};

// ============================================================
// Solicitudes pendientes para mecánico — GET /api/services/mechanic/pending/:mecanicoId
// ============================================================
const getPendingRequestsForMechanic = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                s.id,
                s.tipo_servicio,
                s.descripcion,
                s.direccion_servicio,
                s.estado,
                s.precio_estimado,
                s.fecha_solicitud,
                u.nombre_completo AS cliente_nombre,
                u.telefono AS cliente_telefono
            FROM servicios s
            JOIN usuarios u ON s.cliente_id = u.id
            WHERE s.estado = 'pendiente'
              AND s.mecanico_id IS NULL
            ORDER BY s.fecha_solicitud ASC
        `);
        res.json({ ok: true, requests: result.rows });
    } catch (error) {
        console.error("❌ Error getPendingRequestsForMechanic:", error);
        res.status(500).json({ ok: false, message: "Error al obtener solicitudes pendientes" });
    }
};

// ============================================================
// Servicio activo del mecánico — GET /api/services/mechanic/active/:mecanicoId
// ============================================================
const getActiveServiceForMechanic = async (req, res) => {
    const { mecanicoId } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                s.id,
                s.tipo_servicio,
                s.descripcion,
                s.direccion_servicio,
                s.estado,
                s.precio_estimado,
                s.fecha_solicitud,
                u.nombre_completo AS cliente_nombre,
                u.telefono AS cliente_telefono
            FROM servicios s
            JOIN usuarios u ON s.cliente_id = u.id
            WHERE s.mecanico_id = $1
              AND s.estado IN ('asignado', 'en_camino', 'en_progreso')
            ORDER BY s.fecha_asignacion DESC
            LIMIT 1
        `, [mecanicoId]);

        if (result.rows.length === 0) return res.json({ ok: true, service: null });
        res.json({ ok: true, service: result.rows[0] });
    } catch (error) {
        console.error("❌ Error getActiveServiceForMechanic:", error);
        res.status(500).json({ ok: false, message: "Error al obtener servicio activo" });
    }
};

// ============================================================
// Aceptar servicio — PUT /api/services/accept/:serviceId
// ============================================================
const acceptService = async (req, res) => {
    const { serviceId } = req.params;
    const { mechanicId } = req.body;

    if (!mechanicId) return res.status(400).json({ ok: false, message: "Falta el ID del mecánico" });

    try {
        const check = await db.query(
            `SELECT id FROM servicios WHERE id = $1 AND estado = 'pendiente'`,
            [serviceId]
        );
        if (check.rows.length === 0) {
            return res.status(409).json({ ok: false, message: "El servicio ya no está disponible" });
        }

        await db.query(`
            UPDATE servicios 
            SET mecanico_id = $1, estado = 'asignado', fecha_asignacion = NOW()
            WHERE id = $2
        `, [mechanicId, serviceId]);

        res.json({ ok: true, message: "Servicio aceptado correctamente" });
    } catch (error) {
        console.error("❌ Error acceptService:", error);
        res.status(500).json({ ok: false, message: "Error al aceptar el servicio" });
    }
};

// ============================================================
// Rechazar servicio — PUT /api/services/reject/:serviceId
// ============================================================
const rejectService = async (req, res) => {
    res.json({ ok: true, message: "Solicitud rechazada" });
};

// ============================================================
// Actualizar estado — PUT /api/services/status/:serviceId
// ============================================================
const updateServiceStatus = async (req, res) => {
    const { serviceId } = req.params;
    const { status, mechanicUserId } = req.body;

    const estadosValidos = ['en_camino', 'en_progreso', 'finalizado', 'cancelado'];
    if (!estadosValidos.includes(status)) {
        return res.status(400).json({ ok: false, message: "Estado inválido" });
    }

    try {
        let extraFields = '';
        if (status === 'en_progreso') extraFields = ', fecha_inicio = NOW()';
        if (status === 'finalizado')  extraFields = ', fecha_finalizacion = NOW()';

        await db.query(`
            UPDATE servicios SET estado = $1 ${extraFields} WHERE id = $2
        `, [status, serviceId]);

        res.json({ ok: true, message: `Estado actualizado a: ${status}` });
    } catch (error) {
        console.error("❌ Error updateServiceStatus:", error);
        res.status(500).json({ ok: false, message: "Error al actualizar el estado" });
    }
};

module.exports = {
    createServiceRequest,
    getActiveServicesCount,
    getActiveServiceForClient,
    cancelService,
    getPendingRequestsForMechanic,
    getActiveServiceForMechanic,
    acceptService,
    rejectService,
    updateServiceStatus
};