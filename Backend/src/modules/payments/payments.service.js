const db = require('../../config/db');

const processPayment = async (clienteId, servicioId, monto, metodoPago) => {
    // 1. Insertar el registro del pago en la tabla (asumiendo que crearemos una tabla 'pagos')
    const queryPago = `
        INSERT INTO pagos (servicio_id, cliente_id, monto, metodo_pago, estado, fecha_pago)
        VALUES ($1, $2, $3, $4, 'completado', NOW())
        RETURNING *;
    `;
    const resultPago = await db.query(queryPago, [servicioId, clienteId, monto, metodoPago]);
    
    // 2. Actualizar el estado del servicio a 'pagado'
    await db.query("UPDATE servicios SET estado = 'pagado' WHERE id = $1", [servicioId]);

    // 3. Registrar el cambio en la tabla de trazabilidad de estado
    await db.query(
        `INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion)
         VALUES ($1, $2, 'finalizado', 'pagado', 'Pago procesado exitosamente por el cliente')`,
        [servicioId, clienteId]
    );

    return resultPago.rows[0];
};

const getPaymentHistory = async (clienteId) => {
    // Traemos los pagos junto con información básica del servicio pagado
    const query = `
        SELECT p.*, s.tipo_servicio 
        FROM pagos p
        JOIN servicios s ON p.servicio_id = s.id
        WHERE p.cliente_id = $1
        ORDER BY p.fecha_pago DESC
    `;
    const result = await db.query(query, [clienteId]);
    return result.rows;
};

module.exports = {
    processPayment,
    getPaymentHistory
};