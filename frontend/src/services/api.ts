import axios from 'axios';

const TOKEN_KEY = 'jwt_token';

const api = axios.create({
  baseURL: '/api', // Folosim proxy-ul Vite
  // NU setez Content-Type global! Lăsăm axios să-l seteze automat (important pentru FormData)
  withCredentials: true
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const requestUrl: string | undefined = originalRequest?.url;
    const isRefreshCall = typeof requestUrl === 'string' && requestUrl.includes('/auth/refresh-token');

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;

      try {
        const response = await api.post('/auth/refresh-token', {}, { withCredentials: true });

        const { token } = response.data;
        
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 