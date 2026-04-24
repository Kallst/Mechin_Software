const db = require('../../config/db');

const processPayment = async (clienteId, servicioId, montoTotal, metodoPago) => {
    // 1. Obtener el mecanico_id asociado a este servicio
    const servicioInfo = await db.query("SELECT mecanico_id FROM servicios WHERE id = $1", [servicioId]);
    if (servicioInfo.rows.length === 0) throw new Error("Servicio no encontrado");
    
    const mecanicoId = servicioInfo.rows[0].mecanico_id;

    // 2. Cálculos financieros (10% comisión plataforma)
    const comisionPlataforma = parseFloat((montoTotal * 0.10).toFixed(2));
    const montoMecanico = parseFloat((montoTotal - comisionPlataforma).toFixed(2));

    // 3. Insertar el pago en la tabla (Respetando tus campos exactos del SQL)
    const queryPago = `
        INSERT INTO pagos (
            servicio_id, cliente_id, mecanico_id, 
            monto_total, comision_plataforma, monto_mecanico, 
            metodo_pago, estado, fecha_pago
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmado', NOW())
        RETURNING *;
    `;
    const resultPago = await db.query(queryPago, [
        servicioId, clienteId, mecanicoId, 
        montoTotal, comisionPlataforma, montoMecanico, metodoPago
    ]);
    
    // 4. Actualizar estado del servicio y registrar transacción
    await db.query("UPDATE servicios SET estado = 'finalizado', precio_final = $2 WHERE id = $1", [servicioId, montoTotal]);
    
    await db.query(`
        INSERT INTO transacciones (pago_id, tipo, monto, descripcion) 
        VALUES ($1, 'ingreso_mecanico', $2, 'Pago por servicio realizado')
    `, [resultPago.rows[0].id, montoMecanico]);

    return resultPago.rows[0];
};

const getPaymentHistory = async (clienteId) => {
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