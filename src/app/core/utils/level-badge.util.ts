// YENI_DUZELISLER_2026-09-17 п.2: палитра ступенек лендинга (assets/hedef-kursusu.svg) — та же,
// что уже была закодирована локально в features/metodika/metodika-content.model.ts
// (LEVEL_TILE_CLASSES). Вынесена сюда общим util'ом, чтобы кабинет ученика (п.2) и metodika
// использовали одни и те же цвета, а не разъезжались при правках.
export const LEVEL_BADGE_CLASSES: Record<string, string> = {
    E: 'bg-[#FED716] text-brand-ink',
    D: 'bg-[#F37820] text-white',
    C: 'bg-brand-magenta text-white',
    B: 'bg-brand-green text-white',
    A: 'bg-brand-blue text-white',
    Lisey: 'bg-brand-red text-white',
};

export const LEVEL_BADGE_FALLBACK_CLASS = 'bg-gray-300 text-brand-ink';

/** Неизвестный или пустой код уровня → нейтральная заглушка. */
export function levelBadgeClass(level: string | null | undefined): string {
    if (!level) return LEVEL_BADGE_FALLBACK_CLASS;
    return LEVEL_BADGE_CLASSES[level] ?? LEVEL_BADGE_FALLBACK_CLASS;
}
