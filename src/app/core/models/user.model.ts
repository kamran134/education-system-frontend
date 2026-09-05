export interface UserResponse {
    data: User[];
    totalCount: number;
}

export type UserRole = "superadmin" | "admin" | "moderator" | "regionRepresenter" | "districtRepresenter" | "schoolDirector" | "teacher" | "student";

export interface User {
    id: number;
    email: string;
    passwordHash: string;
    role: UserRole;
    isApproved: boolean;
    regionId?: string;
    districtId?: string;
    schoolId?: string;
    teacherId?: string;
    studentId?: string;
    // Название привязанной сущности (məktəb/müəllim/şagird/rayon/region) — только для отображения
    // в списке İstifadəçilər (FIXES п.9 от 04.09.2026). У admin-подобных ролей отсутствует.
    linkedName?: string;
    linkedType?: 'school' | 'teacher' | 'student' | 'district' | 'region';
}

export interface UserEdit {
    id: number;
    email: string;
    password?: string;
    role: UserRole;
    isApproved: boolean;
    regionId?: string;
    districtId?: string;
    schoolId?: string;
    teacherId?: string;
    studentId?: string;
}