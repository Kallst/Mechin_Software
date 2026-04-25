import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

class AuthService {
  register(userData) {
    return axios.post(API_URL + 'register', userData);
  }

  login(email, password) {
    return axios.post(API_URL + 'login', { email, password })
      .then(response => {
        if (response.data.token) {
          // Limpiar cualquier sesión anterior antes de guardar la nueva
          // Esto evita que queden datos de otro usuario/rol en localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');

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

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();