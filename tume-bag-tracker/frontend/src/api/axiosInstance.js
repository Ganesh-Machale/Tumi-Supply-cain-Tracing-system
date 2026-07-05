import axios from 'axios';

let inMemoryToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

export const getAccessToken = () => inMemoryToken;
export const setAccessToken = (token) => {
  inMemoryToken = token;
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true // crucial to send/receive HTTPOnly cookies
});

// Request Interceptor to inject Bearer access token
axiosInstance.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers['Authorization'] = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to intercept 401 and refresh silently
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If refresh endpoint returns 401, redirect to login
      if (originalRequest.url === '/api/auth/refresh') {
        setAccessToken(null);
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // Enqueue request while token is refreshing
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosInstance.post('/api/auth/refresh');
        const { accessToken } = response.data;
        
        setAccessToken(accessToken);
        isRefreshing = false;
        
        // Dispatch new token to all queued subscribers
        refreshSubscribers.forEach((callback) => callback(accessToken));
        refreshSubscribers = [];
        
        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        // Force redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
