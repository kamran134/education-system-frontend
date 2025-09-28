import { Exam } from "./exam.model";
import { Student } from "./student.model";

export interface ExamResult {
    _id: string;
    disciplines: { az: number; math: number; lifeKnowledge: number; logic: number; }
    exam: Exam;
    grade: number;
    level: string;
    score: number;
    student: string;
    totalScore: number;
    studentData: Student;
    participationScore?: number;
    developmentScore?: number;
    studentOfTheMonthScore?: number;
    republicWideStudentOfTheMonthScore?: number;
    status?: string;
    month?: number;
    year?: number;
}