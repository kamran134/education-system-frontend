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
    profile?: ProfileSummary | null;
}

/**
 * Данные привязанной сущности для profile-блока на главной странице.
 * Одна форма на все 4 роли (student/teacher/schoolDirector/districtRepresenter) —
 * поля читаются выборочно в зависимости от роли, см. ProfileHeaderComponent.
 */
export interface ProfileSummary {
    entityId: string;
    avatarUrl?: string;
    fullName?: string;    // student, teacher
    name?: string;         // school, district
    grade?: number;        // student
    schoolName?: string;   // student, teacher, schoolDirector
    districtName?: string; // student, teacher, schoolDirector, districtRepresenter
    teacherName?: string;  // student
}
