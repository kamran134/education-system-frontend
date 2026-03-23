export interface ActiveSessionsInfo {
    activeSessionsCount: number;
    lastLoginAt?: Date;
    currentSession: boolean;
}

export interface TokenStatistics {
    totalUsers: number;
    usersWithTokens: number;
    totalTokens: number;
    averageTokensPerUser: number;
}

export interface AuthResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface RefreshResponse {
    token: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        role: string;
        email: string;
    };
}

export interface UserInfo {
    id: string;
    email: string;
    role: string;
    isApproved: boolean;
    lastLoginAt?: Date;
}
