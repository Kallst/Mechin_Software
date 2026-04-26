const db = require('../../config/db');

// ============================================================
// Verifica si el cliente tiene un servicio activo en curso
// ============================================================
const checkActiveService = async (clienteId) => {
    const result = await db.query(
        `SELECT id FROM servicios 
         WHERE cliente_id = $1 
         AND estado NOT IN ('finalizado', 'cancelado') 
         LIMIT 1`,
        [clienteId]
    );
    return result.rows.length > 0;
};

// ============================================================
// Crea un nuevo servicio
// ============================================================
const createService = async (clienteId, mecanicoId, tipoServicio, descripcion, direccion, lat, lng) => {
    const result = await db.query(`
        INSERT INTO servicios (
            cliente_id, mecanico_id, tipo_servicio, descripcion,
            direccion_servicio, latitud_servicio, longitud_servicio, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
        RETURNING *
    `, [clienteId, mecanicoId, tipoServicio, descripcion, direccion, lat, lng]);

    const nuevoServicioId = result.rows[0].id;

    await db.query(`
        INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
        VALUES ($1, $2, $3, $4, $5)
    `, [nuevoServicioId, clienteId, 'ninguno', 'pendiente', 'Solicitud creada']);

    return result.rows[0];
};

// ============================================================
// Obtiene el servicio relevante para mostrar en el dashboard:
//
// Prioridad 1 — Servicio en curso (pendiente/asignado/en_camino/en_progreso)
// Prioridad 2 — Servicio finalizado SIN pago (para mostrar botón de pagar)
// Prioridad 3 — null (no mostrar nada)
//
// IMPORTANTE: usamos alias distintos para evitar que el nombre
// del mecánico sobreescriba datos del cliente en el frontend.
// ============================================================
const getActiveService = async (clienteId) => {

    // 1. Busca servicios EN CURSO
    const enCurso = await db.query(`
        SELECT 
            s.*,
            mecanico_usuario.nombre_completo AS mecanico_nombre,
            NULL::int AS pago_id
        FROM servicios s
        LEFT JOIN perfiles_mecanico pm 
            ON s.mecanico_id = pm.id
        LEFT JOIN usuarios mecanico_usuario 
            ON pm.usuario_id = mecanico_usuario.id
        WHERE s.cliente_id = $1
        AND s.estado IN ('pendiente', 'asignado', 'en_camino', 'en_progreso')
        ORDER BY s.fecha_solicitud DESC
        LIMIT 1
    `, [clienteId]);

    if (enCurso.rows.length > 0) return enCurso.rows[0];

    // 2. Busca el último FINALIZADO sin pago
    const pendienteDePago = await db.query(`
        SELECT 
            s.*,
            mecanico_usuario.nombre_completo AS mecanico_nombre,
            NULL::int AS pago_id
        FROM servicios s
        LEFT JOIN perfiles_mecanico pm 
            ON s.mecanico_id = pm.id
        LEFT JOIN usuarios mecanico_usuario 
            ON pm.usuario_id = mecanico_usuario.id
        WHERE s.cliente_id = $1
        AND s.estado = 'finalizado'
        AND NOT EXISTS (
            SELECT 1 FROM pagos p WHERE p.servicio_id = s.id
        )
        ORDER BY s.fecha_finalizacion DESC
        LIMIT 1
    `, [clienteId]);

    if (pendienteDePago.rows.length > 0) return pendienteDePago.rows[0];

    // 3. Nada relevante
    return null;
};

// ============================================================
// Cancela un servicio
// ============================================================
const cancelService = async (id, clienteId) => {
    const current = await db.query(
        'SELECT estado FROM servicios WHERE id = $1',
        [id]
    );
    if (current.rows.length === 0) return null;

    const estadoAnterior = current.rows[0].estado;

    await db.query(
        "UPDATE servicios SET estado = 'cancelado', actualizado_en = NOW() WHERE id = $1",
        [id]
    );

    await db.query(`
        INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
        VALUES ($1, $2, $3, $4, $5)
    `, [id, clienteId, estadoAnterior, 'cancelado', 'Cancelado por el cliente desde el Dashboard']);

    return true;
};

// ============================================================
// Conteo de servicios en curso (para el stat del dashboard)
// ============================================================
const getActiveServicesCount = async (clienteId) => {
    const result = await db.query(
        `SELECT COUNT(*) FROM servicios 
         WHERE cliente_id = $1 
         AND estado NOT IN ('finalizado', 'cancelado')`,
        [clienteId]
    );
    return parseInt(result.rows[0].count);
};

module.exports = {
    checkActiveService,
    createService,
    getActiveService,
    cancelService,
    getActiveServicesCount
};