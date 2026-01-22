// Types are defined in this file

// Actually, to be safe and self-contained, I will define interfaces here or import if they exist. Given I haven't seen them, I'll define them here.

export interface LoginReq {
    email: string;
    password?: string;
    remember_me?: boolean;
}

export interface UserInfo {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    organization?: string;
}

export interface LoginResp {
    token: string;
    refresh_token?: string;
    expires_in: number;
    user_info: UserInfo;
}

export interface RegisterReq {
    first_name: string;
    last_name: string;
    email: string;
    organization?: string;
    password: string;
    confirm_password: string;
    agree_terms: boolean;
}

export interface RegisterResp {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
}

const API_BASE = '/api/user';

const MOCK_DELAY = 800;

const mockLogin = async (data: LoginReq): Promise<LoginResp> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
        token: 'mock-jwt-token-' + Date.now(),
        expires_in: 3600,
        user_info: {
            id: 'mock-user-001',
            first_name: 'Demo',
            last_name: 'User',
            email: data.email,
            organization: 'Default Org'
        }
    };
};

const mockRegister = async (data: RegisterReq): Promise<RegisterResp> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
        id: 'mock-user-new-' + Date.now(),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        token: 'mock-jwt-token-' + Date.now()
    };
};

export const authService = {
    async login(data: LoginReq): Promise<LoginResp> {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                // Fallback to mock on 404 or 500 in dev
                if (import.meta.env.DEV && (response.status === 404 || response.status >= 500)) {
                    console.warn('API connection failed, falling back to Mock Mode');
                    return mockLogin(data);
                }
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Login failed');
            }

            return response.json();
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn('Network error, falling back to Mock Mode');
                return mockLogin(data);
            }
            throw error;
        }
    },

    async register(data: RegisterReq): Promise<RegisterResp> {
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                if (import.meta.env.DEV && (response.status === 404 || response.status >= 500)) {
                    console.warn('API connection failed, falling back to Mock Mode');
                    return mockRegister(data);
                }
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Registration failed');
            }

            return response.json();
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn('Network error, falling back to Mock Mode');
                return mockRegister(data);
            }
            throw error;
        }
    }
};
