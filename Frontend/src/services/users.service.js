const API_URL = 'http://localhost:5000/api/users';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const getUserProfile = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener perfil');
        return data;
    } catch (error) {
        return { error: true, message: error.message };
    }
};

const updateProfile = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al actualizar perfil');
        return result;
    } catch (error) {
        return { error: true, message: error.message };
    }
};

const deleteAccount = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        // Si el backend responde con error (ej. 500), lanzamos el error para el catch
        if (!response.ok) throw new Error(data.message || 'Error al eliminar cuenta');
        return data;
    } catch (error) {
        // Ahora el frontend recibirá este objeto y el "if (!response.error)" funcionará bien
        return { error: true, message: error.message };
    }
};

const usersService = { getUserProfile, updateProfile, deleteAccount };
export default usersService;