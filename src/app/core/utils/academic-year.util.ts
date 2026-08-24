/** Академический год — та же формула, что backend/utils/academic-year.util.ts (сентябрь–июнь). */
export function getCurrentAcademicYear(): number {
    const now = new Date();
    return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Первый учебный год, за который данные считаются достоверными.
 * До 2025/2026 в базе лежат остатки импорта из Mongo, которым нельзя доверять —
 * решение заказчика 24.08.2026: такие годы в выборе года просто не показываем.
 */
export const FIRST_TRACKED_ACADEMIC_YEAR = 2025;

/** "2025/2026" — общий формат учебного года для шапки профиля и таблицы рейтингов. */
export function academicYearLabel(year: number): string {
    return `${year}/${year + 1}`;
}
