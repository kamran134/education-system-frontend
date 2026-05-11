export interface FilterParams {
    page?: number;
    size?: number;
    districtIds?: string | string[];
    schoolIds?: string | string[];
    teacherIds?: string | string[];
    defective?: boolean;
    grades?: string;
    levels?: string;
    examIds?: string;
    examId?: string;
    sortColumn?: string;
    sortDirection?: string;
    code?: string | number;
    month?: string;
    year?: string;
    academicYear?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface UserParams {
    email?: string;
    role?: string;
    isApproved?: boolean;
    page?: number;
    size?: number;
    createdAt?: Date;
    updatedAt?: Date;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
}
