import { Exam } from "./exam.model";
import { Student } from "./student.model";

interface IDisciplines {
    az: number;
    math: number;
    lifeKnowledge: number;
    logic: number;
    english: number;
}

export interface ExamResult {
    id: number;
    disciplines?: IDisciplines;
    questionCounts?: IDisciplines;
    exam: Exam | null;
    grade: number;
    level: string;
    score: number;
    student: string;
    totalScore: number;
    studentData?: Student;
    participationScore?: number;
    developmentScore?: number;
    studentOfTheMonthScore?: number;
    republicWideStudentOfTheMonthScore?: number;
    status?: string;
    month?: number;
    year?: number;
}
