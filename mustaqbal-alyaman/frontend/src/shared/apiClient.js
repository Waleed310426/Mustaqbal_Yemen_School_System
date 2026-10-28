import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5005/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — إرفاق JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — معالجة انتهاء الجلسة
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
