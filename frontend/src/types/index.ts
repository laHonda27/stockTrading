export interface User {
    id: number;
    username: string;
    email: string;
    balance: number;
}

export interface Stock {
    id: number;
    symbol: string;
    name: string;
    currentPrice: number;
    previousPrice: number;
    lastUpdated: string;
}

export interface Transaction {
    id: number;
    userId: number;
    stockId: number;
    stock: Stock;
    type: 'Buy' | 'Sell';
    quantity: number;
    price: number;
    totalAmount: number;
    createdAt: string;
}

export interface Portfolio {
    id: number;
    userId: number;
    stockId: number;
    stock: Stock;
    quantity: number;
    averagePrice: number;
    lastUpdated: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}