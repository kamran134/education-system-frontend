import { District } from "./district.model";
import { ExamResult } from "./examResult.model";
import { School } from "./school.model";
import { Teacher } from "./teacher.model";
import { ApiResponse } from "./response.model";

export interface StudentResponse {
    data: Student[];
    totalCount: number;
}

// Новый формат с ResponseHandler
export interface StudentApiResponse extends ApiResponse<{ data: Student[], totalCount: number }> {}

export interface RepairingResults {
    message?: string;
    repairedStudents?: string[];
    studentsWithoutDistrict?: string[];
    studentsWithoutSchool?: string[];
    studentsWithoutTeacher?: string[];
    missedDistricts?: number[];
    missedSchools?: number[];
    missedTeachers?: number[];
    failedStudents?: Array<{ code: number, reason: string }>;
    repairedTeachers?: string[];
    teachersWithoutDistrict?: string[];
    teachersWithoutSchool?: string[];
    failedTeachers?: Array<{ code: number, reason: string }>;
    repairedSchools?: string[];
    schoolsWithoutDistrict?: string[];
}

export interface StudentWithResultData {
    data: StudentWithResult;
}

import { YearRating } from './year-rating.model';

export interface Student {
    id: number;
    lastName: string;
    firstName: string;
    middleName: string;
    code: number;
    grade: number;
    teacher: Teacher | null;
    school: School | null;
    district: District | null;
    status?: string;
    score?: number;
    averageScore?: number;
    place?: number;
    districtPlace?: number | null;
    filterPlace?: number | null;
    avatarUrl?: string;
    participationCount?: number; // number of exams participated
    ratings?: YearRating[];
}

export interface StudentForCreation {
    lastName: string;
    firstName: string;
    middleName: string;
    code: number;
    grade: number;
    teacher?: Teacher;
    school?: School;
    district?: District;
}

export interface StudentWithResult {
    id: number;
    lastName: string;
    firstName: string;
    middleName: string;
    code: number;
    grade: number;
    teacher: Teacher | null;
    school: School | null;
    district: District | null;
    status: string;
    avatarUrl?: string;
    results: ExamResult[];
}

export interface StudentWithResultResponse extends ApiResponse<StudentWithResult> {}
