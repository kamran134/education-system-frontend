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

/** Первый календарный год в месячных фильтрах /stats (İnkişaf, Ayın şagirdləri, Respublika
 *  üzrə) — решение заказчика 25.08.2026: будущие годы там не нужны, старые годы до этого не
 *  вычищены (в отличие от FIRST_TRACKED_ACADEMIC_YEAR, это не про доверие к данным). */
export const FIRST_TRACKED_CALENDAR_YEAR = 2024;

/** "2025/2026" — общий формат учебного года для шапки профиля и таблицы рейтингов. */
export function academicYearLabel(year: number): string {
    return `${year}/${year + 1}`;
}

/** Азербайджанский порядковый суффикс по последней цифре числа (BASE_FIXES_TASK.md §4.3). */
const ORDINAL_SUFFIX_BY_LAST_DIGIT: Record<number, string> = {
    0: 'ıncı', 1: 'inci', 2: 'nci', 3: 'üncü', 4: 'üncü',
    5: 'inci', 6: 'cı', 7: 'nci', 8: 'inci', 9: 'uncu',
};

/**
 * «2025/2026-cı tədris ili» — вместо статичного «cari tədris ili» (заказчик, 25.08.2026:
 * должно быть видно, какой именно год, а не абстрактное «текущий»). Суффикс считается от
 * последней цифры ВТОРОГО года пары (2026 → «-cı»), а не первого — так пишет и сам заказчик
 * в требовании.
 */
export function academicYearPeriodLabel(year: number): string {
    const secondYear = year + 1;
    const lastDigit = secondYear % 10;
    const suffix = ORDINAL_SUFFIX_BY_LAST_DIGIT[lastDigit];
    return `${academicYearLabel(year)}-${suffix} tədris ili`;
}
