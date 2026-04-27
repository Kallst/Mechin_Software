import api from './api';

const reputationService = {
    /**
     * Envía una nueva calificación al backend
     * @param {Object} reviewData - { servicio_id, mecanico_id, puntaje, contenido }
     */
    calificar: async (reviewData) => {
        const response = await api.post('/reputation/calificar', reviewData);
        return response.data;
    }
};

export default reputationService;