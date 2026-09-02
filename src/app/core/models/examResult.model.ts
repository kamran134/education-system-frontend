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
    /** КАЛЕНДАРНЫЙ год результата, не учебный. Для отбора «за какой тədris ili» брать
     *  academicYear ниже, а не вычислять из этого поля. */
    year?: number;
    /** Учебный год результата (год его начала) — приходит с бэка из generated-колонки
     *  student_results.academic_year. null у июльских/августовских результатов: они не
     *  принадлежат ни одному учебному году. */
    academicYear?: number | null;
}
