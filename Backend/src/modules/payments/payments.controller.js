const paymentsService = require('./payments.service');

const processPayment = async (req, res) => {
    const clienteId = req.user.id; // Extraído de forma segura por el authMiddleware
    const { servicio_id, monto, metodo_pago } = req.body;

    // Validación básica
    if (!servicio_id || !monto || !metodo_pago) {
        return res.status(400).json({ 
            ok: false, 
            message: "Faltan datos obligatorios: servicio_id, monto y metodo_pago son requeridos." 
        });
    }

    try {
        const nuevoPago = await paymentsService.processPayment(clienteId, servicio_id, monto, metodo_pago);
        
        res.status(201).json({ 
            ok: true, 
            message: "Pago procesado exitosamente.", 
            data: nuevoPago 
        });
    } catch (error) {
        console.error("Error al procesar el pago:", error.message);
        res.status(500).json({ 
            ok: false, 
            error: "Hubo un error interno al intentar procesar el pago." 
        });
    }
};

const getPaymentHistory = async (req, res) => {
    const clienteId = req.user.id; // Extraído de forma segura por el authMiddleware

    try {
        const historial = await paymentsService.getPaymentHistory(clienteId);
        res.json({ ok: true, data: historial });
    } catch (error) {
        console.error("Error al obtener el historial de pagos:", error.message);
        res.status(500).json({ 
            ok: false, 
            error: "Hubo un error al obtener el historial de pagos." 
        });
    }
};

module.exports = {
    processPayment,
    getPaymentHistory
};