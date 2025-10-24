export interface UserResponse {
    data: User[];
    totalCount: number;
}

export type UserRole = "superadmin" | "admin" | "moderator" | "districtRepresenter" | "schoolDirector" | "teacher" | "student";

export interface User {
    _id: string;
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
    _id: string;
    email: string;
    password?: string;
    role: UserRole;
    isApproved: boolean;
    districtId?: string;
    schoolId?: string;
    teacherId?: string;
    studentId?: string;
}