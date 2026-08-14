import { District } from "./district.model";
import { ApiResponse } from "./response.model";
import { YearRating } from "./year-rating.model";

export interface SchoolResponse {
    data: School[];
    totalCount: number;
}

export interface SchoolApiResponse extends ApiResponse<{ data: School[], totalCount: number }> {}

export interface School {
    id: number;
    name: string;
    address: string;
    description?: string | null;
    history?: string | null;
    code: number;
    districtCode: number;
    district: District;
    score?: number;
    averageScore?: number;
    studentCount?: number;
    schoolOfTheYearScore?: number;
    place?: number;
    districtPlace?: number | null;
    filterPlace?: number | null;
    active: boolean;
    ratings?: YearRating[];
    avatarUrl?: string;
    // Только в ответе updateSchool, когда меняется code — сколько учителей и их учеников
    // автоматически перекодировано каскадом (PHASE3_PLAN.md п.4).
    cascadedTeachersCount?: number;
    cascadedStudentsCount?: number;
}

export interface SchoolForCreation {
    name: string;
    address: string;
    description?: string | null;
    history?: string | null;
    code: number;
    districtCode?: number;
    district?: District;
    studentCount?: number;
    active?: boolean;
}
