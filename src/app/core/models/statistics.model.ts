export interface StatisticsFilter {
    regionIds?: string[];
    districtIds?: string[];
    schoolIds?: string[];
    teacherIds?: string[];
    grades?: number[];
    year?: number;
    month?: number;
    // IMTAHAN_NOVLERI_TASK.md §14: без него бэкенд берёт базовый тип.
    examTypeId?: number;
}

export interface InkishafFilter {
    districtIds?: string[];
    schoolIds?: string[];
    teacherIds?: string[];
    grades?: number[];
    year?: number;
    minParticipations?: number;
    examTypeId?: number;
}

export interface StatusStatistics {
    count: number;
    percentage: number;
}

export interface LevelStatistics {
    E: StatusStatistics;
    D: StatusStatistics;
    C: StatusStatistics;
    B: StatusStatistics;
    A: StatusStatistics;
    Lisey: StatusStatistics;
}

export interface YearlyStatistics {
    totalStudents: number;
    studentsOfMonth: StatusStatistics;
    republicStudentsOfMonth: StatusStatistics;
    developingStudents: StatusStatistics;
    averageScore: number;
    levelStatistics: LevelStatistics;
    // IMTAHAN_NOVLERI_TASK.md §14: тип, по которому реально посчитаны цифры — переданный
    // examTypeId или базовый по умолчанию. Используется для подписи на плитках профиля.
    examTypeId?: number;
    examTypeName?: string;
}

export interface MonthlyStatistics {
    month: string;
    monthName: string;
    totalResults: number;
    studentsOfMonth: StatusStatistics;
    republicStudentsOfMonth: StatusStatistics;
    developingStudents: StatusStatistics;
    levelStatistics: LevelStatistics;
}

export interface StatisticsResponse {
    yearly: YearlyStatistics;
    monthly: MonthlyStatistics[];
}

export interface InkishafStatistics {
    minParticipations: number;
    maxParticipations: number;
    baseCount: number;
    developingCount: number;
    percentage: number;
}
