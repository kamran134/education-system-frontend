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
    // IMTAHAN_NOVLERI_TASK.md §5-§6 шаг 3: необязательный фильтр по типу экзамена для /api/stats/*.
    // Без него бэкенд подставляет базовый тип — существующие экраны (stats.component.ts и т.д.)
    // не передают его вовсе и продолжают видеть ровно то же, что и раньше. Используется новой
    // страницей features/type-ratings/.
    examTypeId?: number;
    // Only entities with a rating (score > 0) for the chosen year/month and exam type. Set by the
    // yearly /stats tabs only; without it the lists are unchanged (/students directory, teacher profile).
    ratedOnly?: boolean;
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
