import api from './api';

const API_URL = '/api'; // Ajustează portul în funcție de backend

export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        isActive: number;
        isEmailVerified: number;
        roles: string[];
    };
}

class AuthService {
    async register(data: RegisterData): Promise<void> {
        await api.post('/auth/register', data);
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            console.log('🔑 AuthService login attempt:', { email });
            const response = await api.post('/auth/login', {
                email,
                password
            });
            
            console.log('✅ AuthService login response:', response.data);
            
            if (response.data.token) {
                localStorage.setItem('jwt_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ AuthService login error:', error);
            throw new Error('Autentificare eșuată');
        }
    }

    async verifyEmail(token: string): Promise<void> {
        await api.post('/auth/verify-email', { token });
    }

    logout(): void {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    }

    getToken(): string | null {
        return localStorage.getItem('jwt_token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export default new AuthService(); 