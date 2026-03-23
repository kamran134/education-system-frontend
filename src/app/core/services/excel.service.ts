import { Injectable } from "@angular/core";
import * as XLSX from 'xlsx';
import { ExamResult } from "../models/examResult.model";
import { Student, StudentWithResult } from "../models/student.model";
import { Teacher } from "../models/teacher.model";
import { School } from "../models/school.model";
import { District } from "../models/district.model";
import moment from "moment";

@Injectable({
    providedIn: 'root'
})
export class ExcelService {
    constructor() { }

    // ── Column maps: key → { Azerbaijani label, value accessor } ─────────────

    private readonly examResultColumnMap = new Map<string, { label: string; accessor: (r: any) => any }>([
        ['level',             { label: 'Pillə',            accessor: (r: any) => r.level || '' }],
        ['place',             { label: 'Yer',              accessor: (r: any) => r.place || '' }],
        ['code',              { label: 'Şagirdin kodu',    accessor: (r: any) => r.studentData?.code }],
        ['lastName',          { label: 'Soyadı',           accessor: (r: any) => r.studentData?.lastName }],
        ['firstName',         { label: 'Adı',              accessor: (r: any) => r.studentData?.firstName }],
        ['middleName',        { label: 'Atasının adı',     accessor: (r: any) => r.studentData?.middleName }],
        ['grade',             { label: 'Sinfi',            accessor: (r: any) => r.studentData?.grade }],
        ['teacher',           { label: 'Müəllimi',         accessor: (r: any) => r.studentData?.teacher?.fullname || 'Müəllim tapılmadı' }],
        ['school',            { label: 'Məktəbi',          accessor: (r: any) => r.studentData?.school?.name || 'Məktəb tapılmadı' }],
        ['district',          { label: 'Rayonu / şəhəri', accessor: (r: any) => r.studentData?.district?.name || 'Rayon / şəhər tapılmadı' }],
        ['totalScore',        { label: 'İmtahan balı',    accessor: (r: any) => r.totalScore ?? 0 }],
        ['score',             { label: 'Balı',             accessor: (r: any) => r.score ?? 0 }],
        ['averageScore',      { label: 'Orta balı',        accessor: (r: any) => r.studentData?.averageScore ?? 0 }],
        ['participationCount',{ label: 'İştirak sayı',    accessor: (r: any) => r.participationCount ?? 0 }],
    ]);

    private readonly studentColumnMap = new Map<string, { label: string; accessor: (s: any) => any }>([
        ['place',             { label: 'Yer',              accessor: (s: any) => s.place || '' }],
        ['code',              { label: 'Şagirdin kodu',    accessor: (s: any) => s.code }],
        ['lastName',          { label: 'Soyadı',           accessor: (s: any) => s.lastName }],
        ['firstName',         { label: 'Adı',              accessor: (s: any) => s.firstName }],
        ['middleName',        { label: 'Atasının adı',     accessor: (s: any) => s.middleName }],
        ['grade',             { label: 'Sinfi',            accessor: (s: any) => s.grade }],
        ['teacher',           { label: 'Müəllimi',         accessor: (s: any) => s.teacher?.fullname || 'Müəllim tapılmadı' }],
        ['school',            { label: 'Məktəbi',          accessor: (s: any) => s.school?.name || 'Məktəb tapılmadı' }],
        ['district',          { label: 'Rayonu / şəhəri', accessor: (s: any) => s.district?.name || 'Rayon / şəhər tapılmadı' }],
        ['score',             { label: 'Reytinq balı',     accessor: (s: any) => s.score ?? 0 }],
        ['averageScore',      { label: 'Orta balı',        accessor: (s: any) => s.averageScore ?? 0 }],
        ['participationCount',{ label: 'İştirak sayı',    accessor: (s: any) => s.participationCount ?? 0 }],
    ]);

    private readonly teacherColumnMap = new Map<string, { label: string; accessor: (t: any) => any }>([
        ['place',        { label: 'Yer',                   accessor: (t: any) => t.place || '' }],
        ['code',         { label: 'Müəllimin kodu',        accessor: (t: any) => t.code }],
        ['fullName',     { label: 'Soyadı, adı, ata adı', accessor: (t: any) => t.fullname }],
        ['school',       { label: 'Məktəbi',               accessor: (t: any) => t.school?.name || '' }],
        ['district',     { label: 'Rayonu / şəhəri',       accessor: (t: any) => t.district?.name || 'Rayon / şəhər tapılmadı' }],
        ['studentCount', { label: 'Şagird sayı',           accessor: (t: any) => t.studentCount ?? 0 }],
        ['score',        { label: 'Ümumi balı',            accessor: (t: any) => t.score ?? 0 }],
        ['averageScore', { label: 'Orta balı',             accessor: (t: any) => t.averageScore ?? 0 }],
    ]);

    private readonly schoolColumnMap = new Map<string, { label: string; accessor: (s: any) => any }>([
        ['place',        { label: 'Yer',               accessor: (s: any) => s.place || '' }],
        ['code',         { label: 'Məktəbin kodu',     accessor: (s: any) => s.code }],
        ['name',         { label: 'Adı',               accessor: (s: any) => s.name }],
        ['district',     { label: 'Rayonu / şəhəri',  accessor: (s: any) => s.district?.name || 'Rayon / şəhər tapılmadı' }],
        ['studentCount', { label: 'Şagird sayı',       accessor: (s: any) => s.studentCount ?? 0 }],
        ['score',        { label: 'Ümumi balı',        accessor: (s: any) => s.score ?? 0 }],
        ['averageScore', { label: 'Orta balı',         accessor: (s: any) => s.averageScore ?? 0 }],
    ]);

    private readonly districtColumnMap = new Map<string, { label: string; accessor: (d: any) => any }>([
        ['place',        { label: 'Yer',                 accessor: (d: any) => d.place || '' }],
        ['code',         { label: 'Rayon / şəhər kodu', accessor: (d: any) => d.code }],
        ['name',         { label: 'Adı',                 accessor: (d: any) => d.name }],
        ['studentCount', { label: 'Şagird sayı',         accessor: (d: any) => d.studentCount ?? 0 }],
        ['score',        { label: 'Ümumi balı',          accessor: (d: any) => d.score ?? 0 }],
        ['averageScore', { label: 'Orta balı',           accessor: (d: any) => d.averageScore ?? 0 }],
    ]);

    // Builds rows using only the requested columns (or all columns if `columns` is undefined)
    private mapRows<T>(
        items: T[],
        colMap: Map<string, { label: string; accessor: (item: any) => any }>,
        columns?: string[]
    ): any[] {
        const keys = columns ? columns.filter(c => colMap.has(c)) : [...colMap.keys()];
        return items.map(item => {
            const row: Record<string, any> = {};
            for (const k of keys) {
                const def = colMap.get(k)!;
                row[def.label] = def.accessor(item);
            }
            return row;
        });
    }

    /**
     * Форматирует достижения студента на основе числовых полей
     */
    private formatStudentAchievements(result: any): string {
        const achievements: string[] = [];

        // Проверяем развивающийся студент
        if (result.developmentScore && result.developmentScore > 0) {
            achievements.push('İnkişaf edən şagird');
        }

        // Проверяем студент месяца по району
        if (result.studentOfTheMonthScore && result.studentOfTheMonthScore > 0) {
            achievements.push('Ayın şagirdi');
        }

        // Проверяем студент месяца по республике
        if (result.republicWideStudentOfTheMonthScore && result.republicWideStudentOfTheMonthScore > 0) {
            achievements.push('Respublika üzrə ayın şagirdi');
        }

        return achievements.join(', ') || ' ';
    }

    // columns: selected column keys to export; omit to export all columns
    formatStudentData(students: ExamResult[], columns?: string[]): any[] {
        return this.mapRows(students, this.examResultColumnMap, columns);
    }

    formatAllStudentData(students: Student[], columns?: string[]): any[] {
        return this.mapRows(students, this.studentColumnMap, columns);
    }

    // Форматирование данных для учителей
    formatTeacherData(teachers: Teacher[], columns?: string[]): any[] {
        return this.mapRows(teachers, this.teacherColumnMap, columns);
    }

    // Форматирование данных для школ
    formatSchoolData(schools: School[], columns?: string[]): any[] {
        return this.mapRows(schools, this.schoolColumnMap, columns);
    }

    // Форматирование данных для районов
    formatDistrictData(districts: District[], columns?: string[]): any[] {
        return this.mapRows(districts, this.districtColumnMap, columns);
    }

    formatStudentDetailsData(student: StudentWithResult): any[] {
        return student.results.map(result => (
            student.grade < 5 ? {
                'Şagirdin kodu': student.code,
                'Soyadı': student.lastName,
                'Adı': student.firstName,
                'Atasının adı': student.middleName,
                'Sinfi': student.grade,
                'Müəllimi': student.teacher?.fullname || 'Müəllim tapılmadı',
                'Məktəbi': student.school?.name || 'Məktəb tapılmadı',
                'Rayonu / şəhəri': student.district?.name || 'Rayon / şəhər tapılmadı',
                'İmtahanın adı': result.exam?.name,
                'Balı': result.score,
                'Tarixi': result.exam?.date ? moment(new Date(result.exam.date)).format('DD.MM.yyyy') : 'Tarix tapılmadı',
                'Azərbaycan dili': result.disciplines?.az || 0,
                'Riyaziyyat': result.disciplines?.math || 0,
                'Həyat bilgisi': result.disciplines?.lifeKnowledge || 0,
                'Məntiq': result.disciplines?.logic || 0,
                'Ümumi balı': result.totalScore || 0,
                'Pilləsi': result.level || 'Pillə tapılmadı',
                'Statusu': this.formatStudentAchievements(result),
            }
            :
            {
                'Şagirdin kodu': student.code,
                'Soyadı': student.lastName,
                'Adı': student.firstName,
                'Atasının adı': student.middleName,
                'Sinfi': student.grade,
                'Müəllimi': student.teacher?.fullname || 'Müəllim tapılmadı',
                'Məktəbi': student.school?.name || 'Məktəb tapılmadı',
                'Rayonu / şəhəri': student.district?.name || 'Rayon / şəhər tapılmadı',
                'İmtahanın adı': result.exam?.name,
                'Balı': result.score,
                'Tarixi': result.exam?.date ? moment(new Date(result.exam.date)).format('DD.MM.yyyy') : 'Tarix tapılmadı',
                //'Tarixi': result.exam.date ? new Date(result.exam.date).toLocaleDateString() : 'Tarix tapılmadı',
                'Azərbaycan dili': result.disciplines?.az || 0,
                'Riyaziyyat': result.disciplines?.math || 0,
                'Məntiq': result.disciplines?.logic || 0,
                'Ümumi balı': result.totalScore || 0,
                'Pilləsi': result.level || 'Pillə tapılmadı',
                'Statusu': this.formatStudentAchievements(result),
            }
        ));
    }

    formatHeaders(ws: XLSX.WorkSheet) {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1'); // Получаем диапазон данных
        const headerRow = 0; // Первая строка — это заголовки

        for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
        if (!ws[cellAddress]) continue;
            // Применяем стили к заголовкам
            ws[cellAddress].s = {
                font: {
                    bold: true, // Жирный шрифт
                    sz: 14,     // Размер шрифта (14 — чуть больше стандартного)
                },
                alignment: {
                    horizontal: 'center', // Выравнивание по центру (опционально)
                },
            };
        }

        // Устанавливаем высоту строки заголовков (опционально)
        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][headerRow] = { hpt: 20 }; // Высота строки в пунктах
    }
}
