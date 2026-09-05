export interface FilterParams {
    page?: number;
    size?: number;
    regionIds?: string | string[];
    districtIds?: string | string[];
    schoolIds?: string | string[];
    teacherIds?: string | string[];
    active?: boolean;
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
    // Фильтры по rayon/məktəb/müəllim (FIXES п.9 от 04.09.2026) — работают на табах
    // schoolDirector/teacher/student, где у пользователя есть эффективная привязка.
    districtIds?: string | string[];
    schoolIds?: string | string[];
    teacherIds?: string | string[];
}
