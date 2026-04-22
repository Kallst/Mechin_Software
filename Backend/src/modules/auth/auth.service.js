import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

// Mapeo de roles: frontend → BD
// Frontend usa: 'client', 'mechanic', 'store'
// La BD usa:    'cliente', 'mecanico', 'tienda'
// El backend ya hace esta conversión, pero lo dejamos documentado aquí

class AuthService {
  register(userData) {
    return axios.post(API_URL + 'register', userData);
  }

  login(email, password) {
    return axios.post(API_URL + 'login', { email, password })
      .then(response => {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  forgotPassword(email) {
    return axios.post(API_URL + 'forgot-password', { email });
  }

  verifyCode(email, code, newPassword) {
    return axios.post(API_URL + 'verify-code', { email, code, newPassword });
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();