// YENI_DUZELISLER_2026-09-17 п.5b: общий форматтер "Bal faizi" для месячных вкладок /stats и
// /type-ratings — бэк отдаёт scorePercent только там, где известно число вопросов
// (stats.service.pg.ts::queryStudentResultStats, п.5a). Округление — точно как в
// exam-results.component.ts::formatScorePercent, чтобы один и тот же результат не показывал
// разные проценты на разных страницах (сам exam-results не трогаем).
export function formatScorePercentOrTotal(r: { scorePercent?: number | null; totalScore?: number | null }): string {
    if (r.scorePercent != null) return `${Math.round(r.scorePercent)}%`;
    return String(r.totalScore ?? 0);
}
