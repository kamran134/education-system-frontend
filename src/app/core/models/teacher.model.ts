import { District } from "./district.model";
import { School } from "./school.model";
import { ApiResponse } from "./response.model";

export interface TeacherResponse {
    data: Teacher[];
    totalCount: number;
}

export interface TeacherApiResponse extends ApiResponse<{ data: Teacher[], totalCount: number }> {}

export interface Teacher {
    _id: string;
    fullname: string;
    code: number;
    school: School;
    district: District;
    score?: number;
    averageScore?: number;
    studentCount?: number;
    teacherOfTheYearScore?: number;
    place?: number;
    active: boolean;
}

export interface TeacherForCreation {
    fullname: string;
    code: number;
    school?: School;
    district?: District;
    studentCount?: number;
    active?: boolean;
}