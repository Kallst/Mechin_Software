// ============================================================
// MECHIN — Frontend/src/services/auth.service.js
// Maneja token y datos del usuario en localStorage
// ============================================================

const API_URL = 'http://localhost:5000/api/auth';

const authService = {

    // ── Login ────────────────────────────────────────────────
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.msg || 'Error al iniciar sesión');
            error.response = { data };
            throw error;
        }

        // Guardar token y usuario en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        return data;
    },

    // ── Registro ─────────────────────────────────────────────
    register: async (userData) => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.msg || 'Error al registrarse');
            error.response = { data };
            throw error;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        return data;
    },

    // ── Logout ───────────────────────────────────────────────
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // ── Obtener token ────────────────────────────────────────
    getToken: () => {
        return localStorage.getItem('token');
    },

    // ── Obtener usuario actual ───────────────────────────────
    // Devuelve: { id, nombreCompleto, email, role } o null
    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    // ── Verificar si hay sesión activa ───────────────────────
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // ── Recuperación de contraseña ───────────────────────────
    forgotPassword: async (email) => {
        const response = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.msg || 'Error al procesar la solicitud');
            error.response = { data };
            throw error;
        }

        return data;
    },

    // ── Verificar código y cambiar contraseña ────────────────
    verifyCode: async (email, code, newPassword) => {
        const response = await fetch(`${API_URL}/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.msg || 'Error al verificar código');
            error.response = { data };
            throw error;
        }

        return data;
    },
};

export default authService;