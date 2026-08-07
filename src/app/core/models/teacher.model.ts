import { District } from "./district.model";
import { School } from "./school.model";
import { ApiResponse } from "./response.model";
import { YearRating } from "./year-rating.model";

export interface TeacherResponse {
    data: Teacher[];
    totalCount: number;
}

export interface TeacherApiResponse extends ApiResponse<{ data: Teacher[], totalCount: number }> {}

export interface Teacher {
    id: number;
    fullname: string;
    code: number;
    school: School;
    district: District;
    score?: number;
    averageScore?: number;
    studentCount?: number;
    teacherOfTheYearScore?: number;
    place?: number;
    districtPlace?: number | null;
    filterPlace?: number | null;
    active: boolean;
    ratings?: YearRating[];
    avatarUrl?: string;
    // Только в ответе updateTeacher, когда меняется code — сколько учеников этого учителя
    // автоматически перекодировано каскадом (PHASE3_PLAN.md п.4).
    cascadedStudentsCount?: number;
}

export interface TeacherForCreation {
    fullname: string;
    code: number;
    school?: School;
    district?: District;
    studentCount?: number;
    active?: boolean;
}
