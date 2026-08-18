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
    text?: string;
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

// Пять пиллей, под которые заказчик прислал шаблоны — CERTIFICATES_TASK.md §1
export const CERTIFICATE_LEVELS: { code: string; label: string }[] = [
    { code: 'D', label: 'D pilləsi' },
    { code: 'C', label: 'C pilləsi' },
    { code: 'B', label: 'B pilləsi' },
    { code: 'A', label: 'A pilləsi' },
    { code: 'Lisey', label: 'Lisey pilləsi' },
];

export const DEVELOPING_STUDENT_AWARD = 'developing_student';
