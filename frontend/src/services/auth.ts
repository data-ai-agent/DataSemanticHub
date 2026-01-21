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

const API_BASE = '/api/v1/user';

export const authService = {
    async login(data: LoginReq): Promise<LoginResp> {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    },

    async register(data: RegisterReq): Promise<RegisterResp> {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    }
};
