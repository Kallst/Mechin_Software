const db = require('../../config/db');

const checkActiveService = async (clienteId) => {
    const activeCheck = await db.query(
        "SELECT id FROM servicios WHERE cliente_id = $1 AND estado NOT IN ('finalizado', 'cancelado') LIMIT 1",
        [clienteId]
    );
    return activeCheck.rows.length > 0;
};

const createService = async (clienteId, mecanicoId, tipoServicio, descripcion, direccion, lat, lng) => {
    const queryInsert = `
        INSERT INTO servicios (
            cliente_id, mecanico_id, tipo_servicio, descripcion, 
            direccion_servicio, latitud_servicio, longitud_servicio, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente') 
        RETURNING *;
    `;
    const values = [clienteId, mecanicoId, tipoServicio, descripcion, direccion, lat, lng];
    const result = await db.query(queryInsert, values);
    const nuevoServicioId = result.rows[0].id;

    await db.query(
        `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
         VALUES ($1, $2, $3, $4, $5)`,
        [nuevoServicioId, clienteId, 'ninguno', 'pendiente', 'Solicitud creada']
    );

    return result.rows[0];
};

const getActiveService = async (clienteId) => {
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
    return result.rows.length > 0 ? result.rows[0] : null;
};

const cancelService = async (id, clienteId) => {
    const current = await db.query("SELECT estado, cliente_id FROM servicios WHERE id = $1", [id]);
    if (current.rows.length === 0) return null;

    const estadoAnterior = current.rows[0].estado;

    await db.query("UPDATE servicios SET estado = 'cancelado' WHERE id = $1", [id]);

    await db.query(
        `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, clienteId, estadoAnterior, 'cancelado', 'Cancelado por el cliente desde el Dashboard']
    );
    return true;
};

const getActiveServicesCount = async (clienteId) => {
    const result = await db.query(
        "SELECT COUNT(*) FROM servicios WHERE cliente_id = $1 AND estado NOT IN ('finalizado', 'cancelado')", 
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