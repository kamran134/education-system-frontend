export interface FilterParams {
    page?: number;
    size?: number;
    districtIds?: string;
    schoolIds?: string;
    teacherIds?: string;
    defective?: boolean;
    grades?: string;
    examIds?: string;
    examId?: string;
    sortColumn?: string;
    sortDirection?: string;
    code?: string;
    month?: string;
    year?: string;
    search?: string;
}

export interface UserParams {
    email?: string;
    role?: string;
    isApproved?: boolean;
    page?: number;
    size?: number;
    createdAt?: Date;
    updatedAt?: Date;
}