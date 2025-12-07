export interface StatisticsFilter {
    districtIds?: string[];
    schoolIds?: string[];
    grades?: number[];
    year?: number;
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
