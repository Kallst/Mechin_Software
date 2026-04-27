const API_URL = 'http://localhost:5000/api/mechanics';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const mechanicsService = {
    // Perfil básico profesional
    getProfile: async (userId) => {
        const res = await fetch(`${API_URL}/profile/${userId}`, { headers: getAuthHeaders() });
        return res.json();
    },

    updateProfile: async (userId, data) => {
        const res = await fetch(`${API_URL}/profile/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // Disponibilidad (Switch rápido)
    toggleAvailability: async (userId, disponible) => {
        const res = await fetch(`${API_URL}/availability/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ disponible })
        });
        return res.json();
    },

    // Especialidades
    getAllSpecialties: async () => {
        const res = await fetch(`${API_URL}/specialties`, { headers: getAuthHeaders() });
        return res.json();
    },

    getMechanicSpecialties: async (userId) => {
        const res = await fetch(`${API_URL}/profile/${userId}/specialties`, { headers: getAuthHeaders() });
        return res.json();
    }
};

export default mechanicsService;