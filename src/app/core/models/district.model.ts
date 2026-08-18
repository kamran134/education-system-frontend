import { ApiResponse } from "./response.model";
import { YearRating } from "./year-rating.model";

export interface DistrictResponse {
    data: District[];
    totalCount: number;
}

export interface DistrictApiResponse extends ApiResponse<{ data: District[], totalCount: number }> {}

export interface District {
    id: number;
    name: string;
    code: number;
    regionId?: number | null;
    regionName?: string | null;
    rate: number;
    score: number;
    averageScore: number;
    studentCount: number;
    districtOfTheYearScore?: number;
    place?: number;
    filterPlace?: number | null;
    ratings?: YearRating[];
    avatarUrl?: string;
    educationHeadName?: string | null;
    // Только в ответе findById (профильная страница, PROFILES_TASK.md §2.2) — не приходят
    // в списках. actualStudentCount != studentCount: studentCount — сохранённый делитель
    // среднего балла, actualStudentCount — живой count(students) для отображения.
    schoolCount?: number;
    teacherCount?: number;
    actualStudentCount?: number;
}

export interface DistrictProfileUpdate {
    educationHeadName?: string | null;
}
