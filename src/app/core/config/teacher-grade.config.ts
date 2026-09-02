import { Teacher } from '../models/teacher.model';
import { gradesLabel } from '../utils/grade-label.util';

/**
 * Источник значения «Sinfi» на профиле учителя (PROFILES_V3_TASK.md §5).
 * 'manual' — то, что админ ввёл руками в teachers.grade_label.
 * 'auto'   — вычисление из классов учеников (Teacher.grades, приходит из findById).
 * Заказчик решил вести класс вручную; автоматический путь оставлен рабочим —
 * бэкенд продолжает отдавать grades[], для возврата достаточно поменять константу.
 */
export const TEACHER_GRADE_SOURCE: 'manual' | 'auto' = 'manual';

export function resolveTeacherGradeLabel(teacher: Teacher): string | null {
    if (TEACHER_GRADE_SOURCE === 'manual') {
        return teacher.gradeLabel?.trim() || null;
    }
    const grades = teacher.grades ?? [];
    if (grades.length === 0) return null;
    return gradesLabel(grades);
}
