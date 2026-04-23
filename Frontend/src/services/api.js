import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Este interceptor agrega el token automáticamente a todas las peticiones
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // O donde sea que guardes tu JWT
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;