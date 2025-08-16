import axios from 'axios';

const API_BASE_URL = '/api'; // Use proxy in dev, override in prod

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true,
});

// Request interceptor to attach auth token to headers
api.interceptors.request.use(
  (config) => {
    let user = null;
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser && rawUser !== 'undefined') {
        user = JSON.parse(rawUser);
      } else {
        console.warn('localStorage.user is empty or undefined');
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
      console.log('Authorization header added for:', config.url);
    } else {
      // console.log('No token found for:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and standardized error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    const { status, data } = error.response;

    if (status === 401) {
      return Promise.reject(new Error(data.error || 'Authorization failed. Please log in again.'));
    }
    switch (status) {
      case 400:
        return Promise.reject(new Error(data.error || 'Invalid request. Please check your input.'));
      case 404:
        return Promise.reject(new Error(data.error || 'Resource not found.'));
      case 500:
        return Promise.reject(new Error('Server error. Please try again later.'));
      default:
        return Promise.reject(new Error(data.error || 'An unexpected error occurred.'));
    }
  }
);

// --- Authentication Service ---
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  // --- ADDED: Forgot Password Direct ---
  forgotPasswordDirect: async ({ email, newPassword, confirmPassword }) => {
    try {
      const response = await api.post('/auth/forgot-password-direct', {
        email,
        newPassword,
        confirmPassword,
      });
      return response.data; // will have .message or error
    } catch (error) {
      throw error;
    }
  },
};

// --- User Service ---
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      // Sync timezone to localStorage for quick access
      if (response.data && response.data.timezone) {
        localStorage.setItem('userTimeZone', response.data.timezone);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      // Sync timezone to localStorage
      if (response.data && response.data.timezone) {
        localStorage.setItem('userTimeZone', response.data.timezone);
      }
      // Dispatch timezone changed event
      window.dispatchEvent(new Event('timezoneChanged'));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/user/password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// --- Todo Service ---
export const todoService = {
  getTodos: async () => {
    try {
      const response = await api.get('/todos');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createTodo: async (todoData) => {
    try {
      const response = await api.post('/todos', todoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTodo: async (id, updates) => {
    try {
      const response = await api.put(`/todos/${id}`, updates);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTodo: async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  parseTaskDetails: async ({taskTitle, timeZone }) => {
    try {
      const response = await api.post('/nlp/parse-task-details', { taskTitle, timeZone });
      return response.data;
    } catch (error) {
      // If NLP fails, return null
      return null;
    }
  },
};

export default api;
