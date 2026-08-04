export interface UserResponse {
    data: User[];
    totalCount: number;
}

export type UserRole = "superadmin" | "admin" | "moderator" | "districtRepresenter" | "schoolDirector" | "teacher" | "student";

export interface User {
    id: number;
    email: string;
    passwordHash: string;
    role: UserRole;
    isApproved: boolean;
    districtId?: string;
    schoolId?: string;
    teacherId?: string;
    studentId?: string;
}

export interface UserEdit {
    id: number;
    email: string;
    password?: string;
    role: UserRole;
    isApproved: boolean;
    districtId?: string;
    schoolId?: string;
    teacherId?: string;
    studentId?: string;
}