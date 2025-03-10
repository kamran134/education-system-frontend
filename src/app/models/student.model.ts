import { District } from "./district.model";
import { ExamResult } from "./examResult.model";
import { School } from "./school.model";
import { Teacher } from "./teacher.model";

export interface StudentData {
    data: Student[];
    totalCount: number;
}

export interface RepairingResults {
    message?: string;
    repairedStudents?: string[];
    studentsWithoutDistrict?: string[];
    studentsWithoutSchool?: string[];
    studentsWithoutTeacher?: string[];
    repairedTeachers?: string[];
    teachersWithoutDistrict?: string[];
    teachersWithoutSchool?: string[];
    repairedSchools?: string[];
    schoolsWithoutDistrict?: string[];
}

export interface StudentWithResultData {
    data: StudentWithResult;
}

export interface Student {
    _id: string;
    lastName: string;
    firstName: string;
    middleName: string;
    code: number;
    grade: number;
    teacher: Teacher;
    school: School;
    district: District;
    status?: string;
    score?: number;
    averageScore?: number;
}

export interface StudentWithResult {
    _id: string;
    lastName: string;
    firstName: string;
    middleName: string;
    code: number;
    grade: number;
    teacher: Teacher;
    school: School;
    district: District;
    status: string;
    results: ExamResult[];
}