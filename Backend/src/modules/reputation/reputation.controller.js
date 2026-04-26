const reputationService = require('./reputation.service');

const postReview = async (req, res) => {
    try {
        const { servicio_id, mecanico_id, puntaje, contenido } = req.body;
        const cliente_id = req.user.id; // Asumiendo que tienes un middleware de auth

        if (!puntaje || puntaje < 1 || puntaje > 5) {
            return res.status(400).json({ message: "El puntaje debe estar entre 1 y 5" });
        }

        const resultado = await reputationService.createReview(
            servicio_id, cliente_id, mecanico_id, puntaje, contenido
        );

        res.status(201).json({
            message: "¡Calificación enviada con éxito!",
            data: resultado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al procesar la calificación" });
    }
};

module.exports = { postReview };