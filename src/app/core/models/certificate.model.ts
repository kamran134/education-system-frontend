// Зеркалит education-system-back/src/types/certificate.types.ts — единственный источник
// истины по геометрии остаётся сервер (CERTIFICATES_TASK.md §6.2), здесь только контракт данных.

export type CertificateFieldType =
    | 'month'
    | 'grade'
    | 'studentFullName'
    | 'schoolName'
    | 'districtName'
    | 'teacherFullName'
    | 'examDate'
    | 'level'
    | 'previousLevel'
    | 'serial'
    | 'qr'
    | 'static';

export type CertificateFieldAlign = 'left' | 'center' | 'right';
export type CertificateFontFamily = 'montserrat' | 'notoSerif';
export type CertificateFontWeight = 'regular' | 'semibold' | 'bold';
export type CertificateTextTransform = 'none' | 'upper' | 'lower' | 'capitalize';

export interface CertificateFieldMask {
    color: string;
    padding: number;
}

export interface CertificateField {
    id: string;
    type: CertificateFieldType;
    x: number;
    y: number;
    w: number;
    h: number;
    align: CertificateFieldAlign;
    fontFamily: CertificateFontFamily;
    fontWeight: CertificateFontWeight;
    italic: boolean;
    fontSize: number;
    color: string;
    prefix: string;
    suffix: string;
    transform: CertificateTextTransform;
    autoShrink: boolean;
    minFontSize: number;
    mask: CertificateFieldMask | null;
    /** Только static. Поддерживает плейсхолдеры {month}/{grade}/… и **жирный**. */
    text?: string;
    /** Цвет **жирного**, если отличается от `color`. `undefined` — тот же цвет. */
    boldColor?: string;
    /** Перенос по словам. У полей до v2 этого ключа нет — читать `?? false`. */
    multiline?: boolean;
    /** Множитель кегля для высоты строки при multiline — читать `?? 1.25`. */
    lineHeight?: number;
}

export interface CertificateTemplate {
    id: number;
    awardCode: string;
    levelCode: string | null;
    name: string;
    imagePath: string;
    imageWidth: number;
    imageHeight: number;
    fields: CertificateField[];
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CertificateData {
    studentFullName: string;
    schoolName: string;
    districtName: string | null;
    grade: number;
    month: number;
    year: number;
    examDate: string;
    level: string;
    previousLevel: string | null;
    teacherFullName: string;
}

export interface IssuedCertificate {
    id: number;
    serial: string;
    verifyToken: string;
    studentResultId: number;
    awardCode: string;
    templateId: number;
    data: CertificateData;
    issuedAt: string;
    revokedAt: string | null;
    revokeReason: string | null;
}

export interface CertificateAvailability {
    available: boolean;
    serial: string | null;
}

// Три награды (CERTIFICATES_V2_TASK.md §4) — зеркалит AWARD_CODES на бэкенде
// (certificate-issue.service.ts). Один результат может иметь право сразу на несколько.
export const DEVELOPING_STUDENT_AWARD = 'developing_student';
export const STUDENT_OF_THE_MONTH_AWARD = 'student_of_the_month';
export const REPUBLIC_WIDE_STUDENT_OF_THE_MONTH_AWARD = 'republic_wide_student_of_the_month';

export type AwardCode =
    | typeof DEVELOPING_STUDENT_AWARD
    | typeof STUDENT_OF_THE_MONTH_AWARD
    | typeof REPUBLIC_WIDE_STUDENT_OF_THE_MONTH_AWARD;

// Доступность сертификата на результат — по каждой из трёх наград отдельно.
export type CertificateAvailabilityMap = Record<number, Record<AwardCode, CertificateAvailability>>;

// Пять пиллей, под которые заказчик прислал шаблоны развития — CERTIFICATES_TASK.md §1.
// У «Ayın şagirdi» / «Respublika üzrə» градации по пилле нет — один шаблон на награду.
export const CERTIFICATE_LEVELS: { code: string; label: string }[] = [
    { code: 'D', label: 'D pilləsi' },
    { code: 'C', label: 'C pilləsi' },
    { code: 'B', label: 'B pilləsi' },
    { code: 'A', label: 'A pilləsi' },
    { code: 'Lisey', label: 'Lisey pilləsi' },
];

export interface CertificateAwardMeta {
    code: AwardCode;
    label: string;
    /** null = единственный шаблон без градации по пилле */
    levels: { code: string | null; label: string }[];
}

export const CERTIFICATE_AWARDS: CertificateAwardMeta[] = [
    {
        code: DEVELOPING_STUDENT_AWARD,
        label: 'İnkişaf edən şagird',
        levels: CERTIFICATE_LEVELS,
    },
    {
        code: STUDENT_OF_THE_MONTH_AWARD,
        label: 'Ayın şagirdi',
        levels: [{ code: null, label: 'Ayın şagirdi' }],
    },
    {
        code: REPUBLIC_WIDE_STUDENT_OF_THE_MONTH_AWARD,
        label: 'Respublika üzrə Ayın Şagirdi',
        levels: [{ code: null, label: 'Respublika üzrə Ayın Şagirdi' }],
    },
];
