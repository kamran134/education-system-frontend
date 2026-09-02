/**
 * Подписи класса по-азербайджански: «3-cü sinif», а не «3-ci sinif».
 *
 * По коду в нескольких местах было захардкожено «-ci» для любого числа — для 1, 2, 5, 7, 8, 11
 * это верно, а для 3, 4, 6, 9, 10 нет. Учитывая, что система живёт вокруг 1–4-х классов,
 * неправильными были как раз самые частые подписи.
 *
 * Суффикс — по последней цифре; для диапазона классов (1–11) этого достаточно: 10 → «10-cu»,
 * 11 → «11-ci». Отдельный от academic-year.util.ts набор: там суффиксы для ГОДА и в длинной
 * форме («2026/2027-cı»), здесь — короткие порядковые.
 */
const ORDINAL_SUFFIX_BY_LAST_DIGIT: Record<number, string> = {
    0: 'cu', 1: 'ci', 2: 'ci', 3: 'cü', 4: 'cü',
    5: 'ci', 6: 'cı', 7: 'ci', 8: 'ci', 9: 'cu',
};

/** «3-cü» — только порядковое число, без слова. */
export function gradeOrdinal(grade: number): string {
    return `${grade}-${ORDINAL_SUFFIX_BY_LAST_DIGIT[Math.abs(grade) % 10]}`;
}

/** «3-cü sinif». */
export function gradeLabel(grade: number): string {
    return `${gradeOrdinal(grade)} sinif`;
}

/** «3-cü sinif nəticələri» — заголовок над блоком результатов класса. */
export function gradeResultsTitle(grade: number): string {
    return `${gradeOrdinal(grade)} sinif nəticələri`;
}

/** «5, 6-cı siniflər» — суффикс по ПОСЛЕДНЕМУ числу списка, как и читается вслух. */
export function gradesLabel(grades: number[]): string {
    if (grades.length === 0) return '';
    if (grades.length === 1) return gradeLabel(grades[0]);
    const last = grades[grades.length - 1];
    return `${grades.join(', ')}-${ORDINAL_SUFFIX_BY_LAST_DIGIT[Math.abs(last) % 10]} siniflər`;
}
