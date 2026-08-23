/** Академический год — та же формула, что backend/utils/academic-year.util.ts (сентябрь–июнь). */
export function getCurrentAcademicYear(): number {
    const now = new Date();
    return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

/** "2025/2026" — общий формат учебного года для шапки профиля и таблицы рейтингов. */
export function academicYearLabel(year: number): string {
    return `${year}/${year + 1}`;
}
