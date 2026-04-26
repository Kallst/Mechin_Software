const API_URL = 'http://localhost:5000/api/users';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const getUserProfile = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.json();
};

const updateProfile = async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
};

const deleteAccount = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return response.json();
};

const usersService = { getUserProfile, updateProfile, deleteAccount };
export default usersService;