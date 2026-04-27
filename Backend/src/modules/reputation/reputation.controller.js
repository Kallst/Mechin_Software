const reputationService = require('./reputation.service');

const postReview = async (req, res) => {
    try {
        const { servicio_id, mecanico_id, puntaje, contenido } = req.body;
        const cliente_id = req.user.id; // Obtenido del authMiddleware

        // Validaciones básicas
        if (!puntaje || puntaje < 1 || puntaje > 5) {
            return res.status(400).json({ mensaje: "El puntaje debe estar entre 1 y 5" });
        }

        if (!servicio_id || !mecanico_id) {
            return res.status(400).json({ mensaje: "Faltan datos obligatorios (servicio o mecánico)" });
        }

        const resultado = await reputationService.createReview(
            servicio_id, cliente_id, mecanico_id, puntaje, contenido
        );

        res.status(201).json({
            mensaje: "¡Calificación enviada con éxito!",
            data: resultado
        });
    } catch (error) {
        console.error("Error en postReview:", error);
        res.status(500).json({ mensaje: "Error al procesar la calificación en el servidor" });
    }
};

module.exports = { postReview };