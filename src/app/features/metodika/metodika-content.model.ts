/**
 * Редактируемый контент публичной страницы «İSİM metodikası» (BASE_FIXES... нет, отдельная
 * задача — п.6 ТЗ от 04.09.2026). Дефолт живёт здесь, на фронте: если в app_settings нет
 * строки metodika.content, страница показывает нынешний утверждённый заказчиком текст.
 *
 * Файл импортируют и публичная страница (metodika.component.ts), и админский редактор
 * (dashboard/components/metodika-editor) — единый источник дефолта и единая функция слияния.
 */

export interface MetodikaDiscipline {
    name: string;
    questions: number;
}

export interface MetodikaLevel {
    code: string;
    percent: string;
}

export interface MetodikaPartItem {
    title: string;
    text: string;
}

export interface MetodikaLiveCard {
    badge: string;
    title: string;
    text: string;
}

export interface MetodikaYearPoint {
    points: string;
    title: string;
    note: string;
}

export interface MetodikaContent {
    hero: { eyebrow: string; title: string; lead: string };
    parts: { eyebrow: string; items: MetodikaPartItem[] };
    training: { title: string; text: string; authorBadge: string; authorName: string; authorBio: string };
    part1: {
        badge: string;
        title: string;
        lead: string;
        examTitle: string;
        disciplines: MetodikaDiscipline[];
        levelsTitle: string;
        levelsLead: string;
        levels: MetodikaLevel[];
        ladderNote: string;
    };
    live: { title: string; cards: MetodikaLiveCard[] };
    yearAwards: { title: string; lead: string; points: MetodikaYearPoint[]; footer: string };
    outcome1: { label: string; text: string };
    careerTest: { badge: string; title: string; text: string; outcomeLabel: string; outcomeText: string };
    part2: { badge: string; title: string; lead: string; outcomeLabel: string; outcomeText: string };
}

/** Палитра полос предметов — циклически по индексу, см. решение 2 ТЗ. Админ её не редактирует. */
export const METODIKA_DISCIPLINE_BAR_CLASSES: readonly string[] = [
    'bg-brand-red',
    'bg-brand-blue',
    'bg-brand-green',
    'bg-brand-magenta',
];

/** Палитра плиток уровня — по коду, см. решение 2 ТЗ. Неизвестный код — нейтральная заглушка. */
const LEVEL_TILE_CLASSES: Record<string, string> = {
    E: 'bg-[#FED716] text-brand-ink',
    D: 'bg-[#F37820] text-white',
    C: 'bg-brand-magenta text-white',
    B: 'bg-brand-green text-white',
    A: 'bg-brand-blue text-white',
    Lisey: 'bg-brand-red text-white',
};

const LEVEL_TILE_FALLBACK_CLASS = 'bg-gray-300 text-brand-ink';

export function getDisciplineBarClass(index: number): string {
    return METODIKA_DISCIPLINE_BAR_CLASSES[index % METODIKA_DISCIPLINE_BAR_CLASSES.length];
}

/** Цвет бейджа карточки «Nəticələr canlı yayımda» — по позиции, вёрстка не меняется (3 карточки). */
const LIVE_CARD_BADGE_CLASSES: readonly string[] = ['bg-brand-red', 'bg-brand-green', 'bg-brand-magenta'];

export function getLiveCardBadgeClass(index: number): string {
    return LIVE_CARD_BADGE_CLASSES[index % LIVE_CARD_BADGE_CLASSES.length];
}

export function getLevelTileClass(code: string): string {
    return LEVEL_TILE_CLASSES[code] ?? LEVEL_TILE_FALLBACK_CLASS;
}

/** totalQuestions больше не хранится отдельно — иначе разъезжается с суммой при правке. */
export function getTotalQuestions(disciplines: readonly MetodikaDiscipline[]): number {
    return disciplines.reduce((sum, d) => sum + (Number(d.questions) || 0), 0);
}

export const METODIKA_DEFAULT_CONTENT: MetodikaContent = {
    hero: {
        eyebrow: 'Karyera və Psixologiya Mərkəzinin layihəsi',
        title: 'İSİM metodikası',
        lead: 'İbtidai Siniflərin İnkişaf Metodikası — Azərbaycanda analoqu olmayan metodikadır. Layihə artıq 6-cı ildir ki, həyata keçirilir.',
    },
    parts: {
        eyebrow: 'İSİM metodikası 2 əsas hissədən ibarətdir',
        items: [
            {
                title: 'Şagirdin düzgün hədəfini formalaşdırmaq',
                text: 'Hədəf aydın olanda şagirdin dərslərə köklənməsi artır.',
            },
            {
                title: 'Qavrama üslubunu öyrətmə üslubu ilə uzlaşdırmaq',
                text: 'Dərslərin daha yaxşı mənimsənilməsini təmin etmək üçün.',
            },
        ],
    },
    training: {
        title: 'İbtidai sinif müəllimləri üçün təlim',
        text: 'Layihə çərçivəsində öncə ibtidai sinif müəllimləri üçün əyani və ya onlayn təlim keçirilir. Təlimi İSİM metodikasının müəllifi şəxsən özü keçir.',
        authorBadge: 'Metodikanın müəllifi',
        authorName: 'Samir Vəliyev',
        authorBio: 'Karyera-psixologiya üzrə mütəxəssis. ABŞ-ın Milli Karyera İnkişafı Assosiasiyasının üzvü, DİM-in “Abituriyentin bələdçisi” kitabının, eləcə də çoxsaylı araşdırmaların və elmi məqalələrin müəllifi.',
    },
    part1: {
        badge: 'Birinci hissə',
        title: 'Şagirdin hədəfini formalaşdıraraq, dərslərə köklənməsini artırmaq',
        lead: 'Şagirdlər rayon (şəhər) üzrə Mərkəzləşmiş İmtahanda iştirak edir və 50 sualdan imtahan verirlər.',
        examTitle: 'Mərkəzləşmiş İmtahan',
        disciplines: [
            { name: 'Azərbaycan dili', questions: 15 },
            { name: 'Riyaziyyat', questions: 15 },
            { name: 'Həyat Bilgisi', questions: 10 },
            { name: 'Məntiq', questions: 10 },
        ],
        levelsTitle: 'İmtahanın nəticəsi — 6 səviyyədən biri',
        levelsLead: 'Hər şagird topladığı balın faizinə uyğun olaraq aşağıdakı səviyyələrdən birində qərarlaşır.',
        levels: [
            { code: 'E', percent: '0–29%' },
            { code: 'D', percent: '30–49%' },
            { code: 'C', percent: '50–69%' },
            { code: 'B', percent: '70–83%' },
            { code: 'A', percent: '84–94%' },
            { code: 'Lisey', percent: '95–100%' },
        ],
        ladderNote: 'Kürsüdəki bal — səviyyəyə görə İLİN ŞAGİRDLƏRİ yarışına yazılan iştirak balıdır, səviyyənin həddi deyil.',
    },
    live: {
        title: 'Nəticələr canlı yayımda',
        cards: [
            {
                badge: 'YouTube',
                title: 'Açıq elan',
                text: 'Nəticələr youtube üzərindən canlı yayımda açıqlanır. Şagirdlər adlarının hansı səviyyədə çıxacağını maraqla gözləyirlər.',
            },
            {
                badge: 'Bir pillə yuxarı',
                title: 'İNKİŞAF EDƏN ŞAGİRD',
                text: 'Növbəti imtahanda olduğu səviyyədən bir pillə yüksəyə qalxan şagird bu adı qazanır.',
            },
            {
                badge: 'Təbrik',
                title: 'Şəkli paylaşılır',
                text: 'Canlı yayımda onların şəkli paylaşılaraq, təbrik olunurlar.',
            },
        ],
    },
    yearAwards: {
        title: 'İLİN ŞAGİRDLƏRİ bu cür müəyyənləşir',
        lead: 'Tədris ilinin sonunda həm rayon (şəhər), həm də Respublika üzrə ən çox bal toplayan şagirdlər İLİN ŞAGİRDLƏRİ adını qazanırlar.',
        points: [
            { points: '10', title: 'İNKİŞAF EDƏN ŞAGİRD', note: 'Bir pillə yüksəyə qalxdığı hər imtahana görə' },
            { points: '5', title: 'AYIN ƏN YAXŞI ŞAGİRDİ', note: 'Ayın nəticələrinə görə seçilirsə' },
            { points: '1–6', title: 'İMTAHANDA İŞTİRAK', note: 'Hər Mərkəzləşmiş İmtahana görə, düşdüyü səviyyəyə uyğun' },
        ],
        footer: 'Bütün şagirdlərin nəticələri onların müəllimlərinə və oxuduqları məktəbə də yazılır — İLİN MÜƏLLİMLƏRİ və İLİN MƏKTƏBLƏRİ beləcə seçilir.',
    },
    outcome1: {
        label: 'Nə əldə edirik?',
        text: 'Şagird bir pillə yüksək səviyyəyə qalxmağa, İNKİŞAF EDƏN ŞAGİRD kimi canlı yayımda təbrik olunmağa böyük maraq göstərir, həmçinin AYIN ŞAGİRDİ və İLİN ŞAGİRDİ kimi adları qazanmağa çalışır — beləcə onun hədəfləri formalaşır və dərslərə köklənməsi artır.',
    },
    careerTest: {
        badge: 'Test',
        title: 'PSİXOLOJİ-KARYERA TESTİ',
        text: 'Hədəflərin düzgün formalaşdırılması üçün İSİM metodikasında şagirdlər həm də psixoloji-karyera testindən keçirilirlər.',
        outcomeLabel: 'Nə əldə edirik?',
        outcomeText: 'Test nəticəsində şagirdin gələcəkdə hansı ixtisaslara uyğun olduğu indidən müəyyənləşir. Nəticədə şagirdin şüuraltında yanlış hədəflər deyil, gerçək hədəflər formalaşır.',
    },
    part2: {
        badge: 'İkinci hissə',
        title: 'Qavrama üslubunu öyrətmə üslubu ilə uzlaşdıraraq, dərslərin daha yaxşı mənimsənilməsini təmin etmək',
        lead: 'İSİM metodikası çərçivəsində şagirdlər Karyera və Psixologiya Mərkəzinin hazırladığı xüsusi ÖYRƏNMƏ ÜSLUBU TESTİndən keçirilirlər. Test vasitəsilə şagirdin hansı öyrənmə üslubuna sahib olması müəyyənləşir.',
        outcomeLabel: 'Nə əldə edirik?',
        outcomeText: 'Sinifdə olan şagirdlərin hansı üslubda daha yaxşı qavramaları müəyyənləşdiyi üçün müəllim dərs keçərkən hər bir şagirdə individual yanaşmağı və dərslərin daha yaxşı mənimsənilməsini təmin etməyi bacarır.',
    },
};

/**
 * Слияние сохранённого контента (из GET /api/metodika, может быть null или частичным) с
 * дефолтом — по секциям, целыми объектами. Массивы берутся из сохранённого целиком, если
 * это непустой массив, иначе из дефолта (см. решение по слиянию в задаче п.6 ТЗ).
 * Используется и публичной страницей, и админским редактором — не дублировать логику.
 */
export function mergeMetodikaContent(saved: Partial<MetodikaContent> | null | undefined): MetodikaContent {
    const def = METODIKA_DEFAULT_CONTENT;
    if (!saved) {
        return JSON.parse(JSON.stringify(def));
    }

    const arrOrDefault = <T>(arr: T[] | undefined | null, fallback: T[]): T[] =>
        Array.isArray(arr) && arr.length > 0 ? arr : fallback;

    return {
        hero: { ...def.hero, ...(saved.hero ?? {}) },
        parts: {
            eyebrow: saved.parts?.eyebrow ?? def.parts.eyebrow,
            items: arrOrDefault(saved.parts?.items, def.parts.items),
        },
        training: { ...def.training, ...(saved.training ?? {}) },
        part1: {
            ...def.part1,
            ...(saved.part1 ?? {}),
            disciplines: arrOrDefault(saved.part1?.disciplines, def.part1.disciplines),
            levels: arrOrDefault(saved.part1?.levels, def.part1.levels),
        },
        live: {
            title: saved.live?.title ?? def.live.title,
            cards: arrOrDefault(saved.live?.cards, def.live.cards),
        },
        yearAwards: {
            ...def.yearAwards,
            ...(saved.yearAwards ?? {}),
            points: arrOrDefault(saved.yearAwards?.points, def.yearAwards.points),
        },
        outcome1: { ...def.outcome1, ...(saved.outcome1 ?? {}) },
        careerTest: { ...def.careerTest, ...(saved.careerTest ?? {}) },
        part2: { ...def.part2, ...(saved.part2 ?? {}) },
    };
}
