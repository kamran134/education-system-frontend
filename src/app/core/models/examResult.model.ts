import { Exam } from "./exam.model";
import { Student } from "./student.model";

/** Один предмет результата (IMTAHAN_NOVLERI_TASK.md §4/§6, шаг 2) — заменяет пять
 *  захардкоженных полей az/math/lifeKnowledge/logic/english. Набор предметов зависит от секции
 *  типа экзамена этого результата, поэтому приходит с бэка, а не задан статически на фронте.
 *  Отдельного maxQuestions на предмет больше нет (§16): questionCount на этой же строке И ЕСТЬ
 *  число вопросов по предмету в этой конкретной работе — знаменатель процента складывается из
 *  суммы questionCount всех предметов результата (см. ExamResult.maxQuestions ниже). */
export interface IDisciplineScore {
    subjectCode: string;
    nameAz: string;
    score: number;
    questionCount: number | null;
}

export interface ExamResult {
    id: number;
    disciplines?: IDisciplineScore[];
    maxQuestions?: number | null;
    scorePercent?: number | null;
    exam: Exam | null;
    grade: number;
    level: string;
    /** Колонка student_results.score. У каждого результата она жёстко равна 1 («одно участие») —
     *  это НЕ рейтинговый балл, для него есть ratingScore ниже. */
    score: number;
    /** Рейтинговый балл, набранный этим результатом (за тот месяц): участие + inkişaf +
     *  ayın şagirdi + respublika üzrə ayın şagirdi. Сумма таких баллов за год и есть годовой
     *  рейтинг ученика (v_student_year_scores). */
    ratingScore?: number;
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
