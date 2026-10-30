/**
 * Column catalogs shared by the admin settings screens (roles-columns, stats-columns) and the pages
 * that read those settings (exam-results, profile-rating-section). One source of the column keys.
 */

export interface ColumnOption {
    key: string;
    label: string;
}

// Keys must match the keys of columnCatalog in exam-results.component.ts (FIXES п.4 от 04.09.2026).
export const EXAM_RESULT_COLUMN_OPTIONS: ColumnOption[] = [
    { key: 'studentData.code', label: 'İş nömrəsi' },
    // YENI_DUZELISLER_2026-09-17 п.8: заголовок колонки упрощён, ключ не менялся (заказчик: «в /exam-results тоже»).
    { key: 'studentData.fullname', label: 'Şagird' },
    { key: 'grade', label: 'Sinif' },
    { key: 'level', label: 'Pillə' },
    { key: 'scorePercent', label: 'Bal faizi' },
    { key: 'totalScore', label: 'Ümumi bal' },
    { key: 'exam.date', label: 'Tarix' },
    { key: 'studentData.school.name', label: 'Məktəb' },
    // YENI_DUZELISLER_2026-09-17 п.3: "Müəllim" → "Layihə müəllimi".
    { key: 'studentData.teacher.fullname', label: 'Layihə müəllimi' },
    { key: 'studentData.district.name', label: 'Təhsil sektoru' },
];

export const DEFAULT_EXAM_RESULT_COLUMNS: string[] = EXAM_RESULT_COLUMN_OPTIONS.map(c => c.key);

export type ProfileRatingColumnKey = 'score' | 'place' | 'averagePlace' | 'districtPlace' | 'averageDistrictPlace';

/** Roles whose own profile ("ön səhifə") carries the per-year «Reytinqlər» table. */
export type ProfileRatingOwnerRole = 'teacher' | 'schoolDirector' | 'districtRepresenter' | 'regionRepresenter';

const TEACHER_OR_SCHOOL_RATING_COLUMNS: { key: ProfileRatingColumnKey; label: string }[] = [
    { key: 'score', label: 'Reytinq xalı' },
    { key: 'place', label: 'Respublika üzrə yer (ümumi xal)' },
    { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)' },
    { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer (ümumi xal)' },
    { key: 'averageDistrictPlace', label: 'Təhsil sektoru üzrə yer (orta xal)' },
];

// Editor labels per profile type; the order is the current order on the profile (Г2, 29.10.2026).
export const PROFILE_RATING_COLUMN_OPTIONS: Record<ProfileRatingOwnerRole, { key: ProfileRatingColumnKey; label: string }[]> = {
    teacher: TEACHER_OR_SCHOOL_RATING_COLUMNS,
    schoolDirector: TEACHER_OR_SCHOOL_RATING_COLUMNS,
    districtRepresenter: [
        { key: 'score', label: 'Reytinq xalı' },
        { key: 'place', label: 'Respublika üzrə yer (ümumi xal)' },
        { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)' },
    ],
    regionRepresenter: [
        { key: 'score', label: 'Reytinq xalı' },
        { key: 'place', label: 'Respublika üzrə yer' },
    ],
};

/**
 * Applies a saved column setting to the available columns. No saved array = the available set as is
 * (default); an array = exactly those columns in that order (unknown keys dropped); empty array = none.
 */
export function applyColumnSetting<T extends { key: string }>(available: T[], saved: unknown): T[] {
    if (!Array.isArray(saved)) return available;
    const result: T[] = [];
    for (const key of saved) {
        if (typeof key !== 'string') continue;
        const column = available.find(c => c.key === key);
        if (column && !result.includes(column)) result.push(column);
    }
    return result;
}
