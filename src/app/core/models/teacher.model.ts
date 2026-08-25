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
    biography?: string | null;
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
    // Только в ответе findById (профильная страница, PROFILES_TASK.md §2.2) — не приходят
    // в списках. actualStudentCount != studentCount: studentCount — сохранённый делитель
    // среднего балла, actualStudentCount — живой count(students) для отображения.
    actualStudentCount?: number;
    grades?: number[];
    // Ручной ввод (PROFILES_V3_TASK.md §5) — источник значения "Sinfi" на профиле, в отличие
    // от grades[] (вычисляется из классов учеников). См. core/config/teacher-grade.config.ts.
    gradeLabel?: string | null;
    pedagogicalStartYear?: number | null;
    // BASE_FIXES_TASK.md §2.3 — заменяет pedagogicalStartYear на профиле: стаж вводится
    // числом лет, а не годом начала (мог работать не непрерывно).
    pedagogicalExperienceYears?: number | null;
    achievements?: string | null;
}

export interface TeacherForCreation {
    fullname: string;
    biography?: string | null;
    code: number;
    school?: School;
    district?: District;
    studentCount?: number;
    active?: boolean;
    pedagogicalStartYear?: number | null;
    achievements?: string | null;
}
