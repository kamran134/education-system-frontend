import { District } from "./district.model";
import { School } from "./school.model";

export interface TeacherResponse {
    data: Teacher[];
    totalCount: number;
}

export interface Teacher {
    _id: string;
    fullname: string;
    code: number;
    school: School;
    district: District;
    score?: number;
    averageScore?: number;
    active: boolean;
}

export interface TeacherForCreation {
    fullname: string;
    code: number;
    school?: School;
    district?: District;
    active?: boolean;
}