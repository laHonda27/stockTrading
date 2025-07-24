import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, Stock, Portfolio, Transaction } from '../types';

const API_BASE_URL = 'http://localhost:5172/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré, rediriger vers login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', credentials);
        return response.data;
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    },
};

export const stockService = {
    getAll: async (): Promise<Stock[]> => {
        const response = await api.get('/api/stocks');
        return response.data;
    },

    getById: async (id: number): Promise<Stock> => {
        const response = await api.get(`/api/stocks/${id}`);
        return response.data;
    },
};

export const portfolioService = {
    getPortfolio: async (): Promise<Portfolio[]> => {
        const response = await api.get('/api/portfolio');
        return response.data;
    },

    buyStock: async (stockId: number, quantity: number): Promise<Transaction> => {
        const response = await api.post('/api/portfolio/buy', { stockId, quantity });
        return response.data;
    },

    sellStock: async (stockId: number, quantity: number): Promise<Transaction> => {
        const response = await api.post('/api/portfolio/sell', { stockId, quantity });
        return response.data;
    },

    getTransactions: async (): Promise<Transaction[]> => {
        const response = await api.get('/api/portfolio/transactions');
        return response.data;
    },
};

export const adminService = {
    getSimulationConfig: async () => {
        const response = await api.get('/api/admin/simulation-config');
        return response.data;
    },

    startSimulation: async () => {
        const response = await api.post('/api/admin/start-simulation');
        return response.data;
    },

    stopSimulation: async () => {
        const response = await api.post('/api/admin/stop-simulation');
        return response.data;
    },

    restartSimulation: async () => {
        const response = await api.post('/api/admin/restart-simulation');
        return response.data;
    },
};

export default api;