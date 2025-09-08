export interface UserResponse {
    data: User[];
    totalCount: number;
}

export interface User {
    _id: string;
    email: string;
    passwordHash: string;
    role: "superadmin" | "admin" | "moderator" | "user";
    isApproved: boolean;
}

export interface UserEdit {
    _id: string;
    email: string;
    password?: string;
    role: "superadmin" | "admin" | "moderator" | "user";
    isApproved: boolean;
}