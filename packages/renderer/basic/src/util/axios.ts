// src/utils/axios.ts
import axios from 'axios'; // Default import
import type { AxiosRequestConfig, AxiosResponse } from 'axios'; // Named type imports
import { ElMessage } from 'element-plus';

// Use the type from axios.create return value
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    ElMessage.error('Request failed');
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (data.errno !== 0 && data.errno !== 200) {
      ElMessage.error(data.message || 'Request failed');
      return Promise.reject(new Error(data.message || 'Error'));
    }
    return data;
  },
  (error) => {
    console.error('Response error:', error);
    const msg = error.response?.data?.message || 'Network error';
    ElMessage.error(msg);
    if (error.response?.status === 401) {
      // router.push('/login'); // Uncomment if using vue-router
    }
    return Promise.reject(error);
  }
);

export default instance;
