// ============================================================
// MECHIN — payments.service.js
// Capa de lógica de negocio para pagos y transacciones
// ============================================================

const db = require('../../config/db');

// ============================================================
// Procesar un pago
// ============================================================
const procesarPago = async ({ servicio_id, monto, metodo_pago, clienteId }) => {

    const servicioResult = await db.query(
        `SELECT s.id, s.mecanico_id, s.estado
         FROM servicios s
         WHERE s.id = $1 AND s.cliente_id = $2`,
        [servicio_id, clienteId]
    );

    if (servicioResult.rows.length === 0) {
        const error = new Error('Servicio no encontrado o no pertenece a este cliente');
        error.status = 404;
        throw error;
    }

    const servicio = servicioResult.rows[0];

    if (servicio.estado !== 'finalizado') {
        const error = new Error('Solo se pueden pagar servicios finalizados');
        error.status = 400;
        throw error;
    }

    const pagoExistente = await db.query(
        'SELECT id FROM pagos WHERE servicio_id = $1',
        [servicio_id]
    );

    if (pagoExistente.rows.length > 0) {
        const error = new Error('Este servicio ya tiene un pago registrado');
        error.status = 409;
        throw error;
    }

    const montoTotal         = parseFloat(monto);
    const comisionPlataforma = parseFloat((montoTotal * 0.15).toFixed(2));
    const montoMecanico      = parseFloat((montoTotal - comisionPlataforma).toFixed(2));

    const referencia = `MECHIN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const nuevoPago = await db.query(
        `INSERT INTO pagos 
         (servicio_id, cliente_id, mecanico_id, monto_total, comision_plataforma,
          monto_mecanico, metodo_pago, estado, referencia_simulada, fecha_pago)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmado', $8, NOW())
         RETURNING id`,
        [servicio_id, clienteId, servicio.mecanico_id, montoTotal, comisionPlataforma, montoMecanico, metodo_pago, referencia]
    );

    const pagoId = nuevoPago.rows[0].id;

    await db.query(
        `INSERT INTO desglose_pago (pago_id, concepto, descripcion, monto)
         VALUES 
         ($1, 'Servicio mecánico', 'Pago al mecánico por el servicio prestado', $2),
         ($1, 'Comisión plataforma', 'Comisión de Mechin (15%)', $3)`,
        [pagoId, montoMecanico, comisionPlataforma]
    );

    await db.query(
        `INSERT INTO transacciones (pago_id, tipo, monto, descripcion)
         VALUES ($1, 'pago', $2, $3)`,
        [pagoId, montoTotal, `Pago ${metodo_pago} — Ref: ${referencia}`]
    );

    await db.query(
        'UPDATE servicios SET precio_final = $1 WHERE id = $2',
        [montoTotal, servicio_id]
    );

    return {
        id: pagoId,
        referencia,
        monto_total:          montoTotal,
        comision_plataforma:  comisionPlataforma,
        monto_mecanico:       montoMecanico,
        metodo_pago,
        estado: 'confirmado'
    };
};

// ============================================================
// Obtener historial de pagos del cliente (MECHIN-61)
// ============================================================
const obtenerHistorialPagos = async (clienteId) => {
    const result = await db.query(
        `SELECT 
            p.id,
            p.referencia_simulada AS referencia,
            p.monto_total,
            p.comision_plataforma,
            p.monto_mecanico,
            p.metodo_pago,
            p.estado,
            p.fecha_pago,
            s.tipo_servicio,
            s.direccion_servicio,
            u.nombre_completo AS nombre_mecanico
         FROM pagos p
         JOIN servicios s ON p.servicio_id = s.id
         JOIN perfiles_mecanico pm ON p.mecanico_id = pm.id
         JOIN usuarios u ON pm.usuario_id = u.id
         WHERE p.cliente_id = $1
         ORDER BY p.fecha_pago DESC`,
        [clienteId]
    );
    return result.rows;
};

// ============================================================
// Obtener desglose de un pago específico
// ============================================================
const obtenerDesglosePago = async ({ pagoId, clienteId }) => {
    const pagoResult = await db.query(
        `SELECT p.*, s.tipo_servicio, s.direccion_servicio
         FROM pagos p
         JOIN servicios s ON p.servicio_id = s.id
         WHERE p.id = $1 AND p.cliente_id = $2`,
        [pagoId, clienteId]
    );

    if (pagoResult.rows.length === 0) {
        const error = new Error('Pago no encontrado');
        error.status = 404;
        throw error;
    }

    const desgloseResult = await db.query(
        'SELECT concepto, descripcion, monto FROM desglose_pago WHERE pago_id = $1',
        [pagoId]
    );

    return { pago: pagoResult.rows[0], desglose: desgloseResult.rows };
};

// ============================================================
// Obtener historial de ingresos del mecánico (MECHIN-62)
// ============================================================
const obtenerHistorialIngresosMecanico = async (usuarioId) => {
    const perfilResult = await db.query(
        'SELECT id FROM perfiles_mecanico WHERE usuario_id = $1',
        [usuarioId]
    );

    if (perfilResult.rows.length === 0) {
        const error = new Error('Perfil de mecánico no encontrado');
        error.status = 404;
        throw error;
    }

    const mecanicoId = perfilResult.rows[0].id;

    const result = await db.query(`
        SELECT
            p.id,
            p.monto_total,
            p.comision_plataforma,
            p.monto_mecanico,
            p.metodo_pago,
            p.estado,
            p.fecha_pago,
            p.referencia_simulada   AS referencia,
            s.tipo_servicio,
            s.direccion_servicio,
            u.nombre_completo       AS cliente_nombre
        FROM pagos p
        JOIN servicios s ON p.servicio_id = s.id
        JOIN usuarios u  ON p.cliente_id  = u.id
        WHERE p.mecanico_id = $1
          AND p.estado = 'confirmado'
        ORDER BY p.fecha_pago DESC
    `, [mecanicoId]);

    return result.rows;
};

module.exports = {
    procesarPago,
    obtenerHistorialPagos,
    obtenerDesglosePago,
    obtenerHistorialIngresosMecanico,
};