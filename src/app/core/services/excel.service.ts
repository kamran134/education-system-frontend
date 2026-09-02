import { Injectable } from "@angular/core";
import * as XLSX from 'xlsx-js-style';
import { ExamResult } from "../models/examResult.model";
import { Student, StudentWithResult } from "../models/student.model";
import { Teacher } from "../models/teacher.model";
import { School } from "../models/school.model";
import { District } from "../models/district.model";
import { Region } from "../models/region.model";
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
        ['code',              { label: 'Şagirdin iş nömrəsi',    accessor: (r: any) => r.studentData?.code }],
        ['lastName',          { label: 'Soyadı',           accessor: (r: any) => r.studentData?.lastName }],
        ['firstName',         { label: 'Adı',              accessor: (r: any) => r.studentData?.firstName }],
        ['middleName',        { label: 'Atasının adı',     accessor: (r: any) => r.studentData?.middleName }],
        // Класс НА МОМЕНТ РЕЗУЛЬТАТА (r.grade, sr.grade на бэке), не студента (r.studentData?.grade —
        // живой, текущий класс). Fallback не нужен: все три вызывающих (İE/AŞ/AŞ respublika üzrə,
        // stats.component.ts) идут через queryStudentResultStats, где верхнеуровневый grade есть
        // всегда — проверено grep-ом (SINIF_TARIXCESI_TASK.md §3.2).
        ['grade',             { label: 'Sinfi',            accessor: (r: any) => r.grade }],
        ['teacher',           { label: 'Müəllimi',         accessor: (r: any) => r.studentData?.teacher?.fullname || 'Müəllim tapılmadı' }],
        ['school',            { label: 'Məktəbi',          accessor: (r: any) => r.studentData?.school?.name || 'Məktəb tapılmadı' }],
        ['district',          { label: 'Təhsil sektoru', accessor: (r: any) => r.studentData?.district?.name || 'Təhsil sektoru tapılmadı' }],
        ['totalScore',        { label: 'İmtahan balı',    accessor: (r: any) => r.totalScore ?? 0 }],
        ['score',             { label: 'Reytinq xalı',             accessor: (r: any) => r.score ?? 0 }],
        ['averageScore',      { label: 'Orta reytinq xalı',        accessor: (r: any) => r.studentData?.averageScore ?? 0 }],
        ['participationCount',{ label: 'İştirak sayı',    accessor: (r: any) => r.participationCount ?? 0 }],
    ]);

    private readonly studentColumnMap = new Map<string, { label: string; accessor: (s: any) => any }>([
        ['place',             { label: 'Respublika üzrə yer', accessor: (s: any) => s.place || '' }],
        ['districtPlace',     { label: 'Təhsil sektoru üzrə yer', accessor: (s: any) => s.districtPlace || '' }],
        ['filterPlace',       { label: 'Filtr üzrə yer',    accessor: (s: any) => s.filterPlace || '' }],
        ['code',              { label: 'Şagirdin iş nömrəsi',    accessor: (s: any) => s.code }],
        ['lastName',          { label: 'Soyadı',           accessor: (s: any) => s.lastName }],
        ['firstName',         { label: 'Adı',              accessor: (s: any) => s.firstName }],
        ['middleName',        { label: 'Atasının adı',     accessor: (s: any) => s.middleName }],
        // yearGrade — класс ЗА ПОКАЗАННЫЙ учебный год, не живой s.grade. Намеренно без
        // `?? s.grade`: подставлять живой класс в выгрузку за прошлый год — ровно та ошибка,
        // которую чиним (SINIF_TARIXCESI_TASK.md §3.1). Бэк заполняет yearGrade всегда, так что
        // пустым оно окажется только там, где класс за тот год действительно неизвестен.
        ['grade',             { label: 'Sinfi',            accessor: (s: any) => s.yearGrade ?? '' }],
        ['teacher',           { label: 'Müəllimi',         accessor: (s: any) => s.teacher?.fullname || 'Müəllim tapılmadı' }],
        ['school',            { label: 'Məktəbi',          accessor: (s: any) => s.school?.name || 'Məktəb tapılmadı' }],
        ['district',          { label: 'Təhsil sektoru', accessor: (s: any) => s.district?.name || 'Təhsil sektoru tapılmadı' }],
        ['score',             { label: 'Reytinq xalı',     accessor: (s: any) => s.score ?? 0 }],
        ['averageScore',      { label: 'Orta reytinq xalı',        accessor: (s: any) => s.averageScore ?? 0 }],
        ['participationCount',{ label: 'İştirak sayı',    accessor: (s: any) => s.participationCount ?? 0 }],
    ]);

    private readonly teacherColumnMap = new Map<string, { label: string; accessor: (t: any) => any }>([
        ['place',        { label: 'Respublika üzrə yer',   accessor: (t: any) => t.place || '' }],
        ['districtPlace',{ label: 'Təhsil sektoru üzrə yer',  accessor: (t: any) => t.districtPlace || '' }],
        ['filterPlace',  { label: 'Filtr üzrə yer',        accessor: (t: any) => t.filterPlace || '' }],
        ['code',         { label: 'Müəllimin kodu',        accessor: (t: any) => t.code }],
        ['fullName',     { label: 'Soyadı, adı, ata adı', accessor: (t: any) => t.fullname }],
        ['school',       { label: 'Məktəbi',               accessor: (t: any) => t.school?.name || '' }],
        ['district',     { label: 'Təhsil sektoru',       accessor: (t: any) => t.district?.name || 'Təhsil sektoru tapılmadı' }],
        ['studentCount', { label: 'Şagird sayı',           accessor: (t: any) => t.studentCount ?? 0 }],
        ['score',        { label: 'Reytinq xalı',            accessor: (t: any) => t.score ?? 0 }],
        ['averageScore', { label: 'Orta reytinq xalı',             accessor: (t: any) => t.averageScore ?? 0 }],
    ]);

    private readonly schoolColumnMap = new Map<string, { label: string; accessor: (s: any) => any }>([
        ['place',        { label: 'Respublika üzrə yer', accessor: (s: any) => s.place || '' }],
        ['districtPlace',{ label: 'Təhsil sektoru üzrə yer', accessor: (s: any) => s.districtPlace || '' }],
        ['filterPlace',  { label: 'Filtr üzrə yer',      accessor: (s: any) => s.filterPlace || '' }],
        ['code',         { label: 'Məktəbin kodu',     accessor: (s: any) => s.code }],
        ['name',         { label: 'Adı',               accessor: (s: any) => s.name }],
        ['district',     { label: 'Təhsil sektoru',  accessor: (s: any) => s.district?.name || 'Təhsil sektoru tapılmadı' }],
        ['studentCount', { label: 'Şagird sayı',       accessor: (s: any) => s.studentCount ?? 0 }],
        ['score',        { label: 'Reytinq xalı',        accessor: (s: any) => s.score ?? 0 }],
        ['averageScore', { label: 'Orta reytinq xalı',         accessor: (s: any) => s.averageScore ?? 0 }],
    ]);

    private readonly districtColumnMap = new Map<string, { label: string; accessor: (d: any) => any }>([
        ['place',        { label: 'Respublika üzrə yer', accessor: (d: any) => d.place || '' }],
        ['filterPlace',  { label: 'Filtr üzrə yer',       accessor: (d: any) => d.filterPlace || '' }],
        ['code',         { label: 'Təhsil sektorunun kodu', accessor: (d: any) => d.code }],
        ['name',         { label: 'Adı',                 accessor: (d: any) => d.name }],
        ['studentCount', { label: 'Şagird sayı',         accessor: (d: any) => d.studentCount ?? 0 }],
        ['score',        { label: 'Reytinq xalı',          accessor: (d: any) => d.score ?? 0 }],
        ['averageScore', { label: 'Orta reytinq xalı',           accessor: (d: any) => d.averageScore ?? 0 }],
    ]);

    private readonly regionColumnMap = new Map<string, { label: string; accessor: (r: any) => any }>([
        ['place',         { label: 'Respublika üzrə yer', accessor: (r: any) => r.place || '' }],
        ['filterPlace',   { label: 'Filtr üzrə yer',       accessor: (r: any) => r.filterPlace || '' }],
        ['code',          { label: 'Regional idarə kodu', accessor: (r: any) => r.code }],
        ['name',          { label: 'Adı',                 accessor: (r: any) => r.name }],
        ['districtCount', { label: 'Təhsil sektorlarının sayı',          accessor: (r: any) => r.districtCount ?? 0 }],
        ['studentCount',  { label: 'Şagird sayı',         accessor: (r: any) => r.studentCount ?? 0 }],
        ['score',         { label: 'Reytinq xalı',          accessor: (r: any) => r.score ?? 0 }],
        ['averageScore',  { label: 'Orta reytinq xalı',           accessor: (r: any) => r.averageScore ?? 0 }],
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

    // Форматирование данных для регионов (Regional Təhsil İdarələri)
    formatRegionData(regions: Region[], columns?: string[]): any[] {
        return this.mapRows(regions, this.regionColumnMap, columns);
    }

    private readonly userRoleLabels: Record<string, string> = {
        superadmin: 'Superadmin',
        admin: 'Admin',
        moderator: 'Moderator',
        regionRepresenter: 'Regional idarə nümayəndəsi',
        districtRepresenter: 'Rayon nümayəndəsi',
        schoolDirector: 'Məktəb direktoru',
        teacher: 'Müəllim',
        student: 'Şagird',
    };

    /**
     * Downloads a single-row Excel file with a newly created user's login credentials,
     * so an admin can hand them off (email + generated password won't be retrievable later).
     */
    exportUserCredentials(user: { email: string; password: string; role: string }): void {
        const ws = XLSX.utils.json_to_sheet([{
            'E-mail': user.email,
            'Şifrə': user.password,
            'Vəzifəsi': this.userRoleLabels[user.role] || user.role,
        }]);
        this.formatHeaders(ws);
        ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'İstifadəçi');
        const safeEmail = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        XLSX.writeFile(wb, `istifadeci-${safeEmail}.xlsx`);
    }

    /** Полные азербайджанские подписи предметов (не сокращения из стилизованного экспорта). */
    private readonly studentDetailDisciplines: Array<{ key: 'az' | 'math' | 'lifeKnowledge' | 'logic' | 'english'; label: string }> = [
        { key: 'az',            label: 'Azərbaycan dili' },
        { key: 'math',          label: 'Riyaziyyat' },
        { key: 'lifeKnowledge', label: 'Həyat bilgisi' },
        { key: 'logic',         label: 'Məntiq' },
        { key: 'english',       label: 'İngilis dili' },
    ];

    /**
     * Экспорт результатов ученика. `results` — уже отфильтрованный набор строк (текущий год для
     * основной кнопки, выбранные классы для второй) — сам метод историю не режет.
     * Одна ветка вместо прежних grade<5 / grade>=5: единственное отличие было в наличии
     * «Həyat bilgisi», а это теперь решает динамический список предметов.
     */
    formatStudentDetailsData(student: StudentWithResult, results?: ExamResult[]): any[] {
        const rows = results ?? student.results ?? [];

        // Предметная колонка выводится, только если хотя бы в одной экспортируемой строке по ней
        // есть ненулевой балл (П.10e). Тот же подход, что в exportExamResultsStyled.
        const activeDisciplines = this.studentDetailDisciplines.filter(d =>
            rows.some(r => {
                const v = (r.disciplines as any)?.[d.key];
                return v != null && v !== 0;
            })
        );

        return rows.map(result => {
            const row: Record<string, any> = {
                // Код строкой: 10-значное число Excel сворачивает в «1.2E+09» (П.10f).
                'Şagirdin kodu': String(student.code),
                'Soyadı': student.lastName,
                'Adı': student.firstName,
                'Atasının adı': student.middleName,
                // Класс на момент экзамена, а не текущий класс ученика (тот растёт каждый год) — П.10d.
                'Sinfi': result.grade,
                'Müəllimi': student.teacher?.fullname || 'Müəllim tapılmadı',
                'Məktəbi': student.school?.name || 'Məktəb tapılmadı',
                'Təhsil sektoru': student.district?.name || 'Təhsil sektoru tapılmadı',
                'İmtahanın adı': result.exam?.name,
                'Tarixi': result.exam?.date ? moment(new Date(result.exam.date)).format('DD.MM.yyyy') : 'Tarix tapılmadı',
                // Pillə и İmtahan balı — сразу после даты, как в таблице на самой карточке.
                // Раньше обе стояли в конце, за динамическими колонками предметов, и на широком
                // листе их просто не находили глазами.
                'Pilləsi': result.level || 'Pillə tapılmadı',
                'İmtahan balı': result.totalScore || 0,
            };
            for (const d of activeDisciplines) {
                row[d.label] = result.disciplines?.[d.key] ?? 0;
            }
            // Рейтинговый балл ЗА ЭТОТ МЕСЯЦ (участие + inkişaf + ayın şagirdi + respublika üzrə),
            // а не result.score: та колонка в БД у каждого результата равна 1, из-за чего в выгрузке
            // везде стояла единица (жалоба заказчика 02.09.2026).
            row['Reytinq xalı'] = result.ratingScore ?? 0;
            row['Statusu'] = this.formatStudentAchievements(result);
            return row;
        });
    }

    formatHeaders(ws: XLSX.WorkSheet) {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const headerRow = 0;

        for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
        if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: 'center' },
            };
        }

        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][headerRow] = { hpt: 20 };
    }

    /**
     * Styled export for İmtahan nəticələri:
     * – merged title row with active filter label
     * – blue header row, yellow Yekun bal column
     * – dynamic discipline columns (only those with at least one non-zero value)
     */
    exportExamResultsStyled(results: ExamResult[], filterLabel: string): void {
        type DisciplineKey = 'az' | 'math' | 'lifeKnowledge' | 'logic' | 'english';

        // ── 1. Active discipline columns ──────────────────────────────────────
        const allDisciplines: Array<{ key: DisciplineKey; label: string }> = [
            { key: 'az',            label: 'Az.' },
            { key: 'math',          label: 'Riy.' },
            { key: 'lifeKnowledge', label: 'H.B.' },
            { key: 'logic',         label: 'Məntiq' },
            { key: 'english',       label: 'İng.' },
        ];
        const activeDisciplines = allDisciplines.filter(d =>
            results.some(r => r.disciplines && ((r.disciplines as any)[d.key] ?? 0) > 0)
        );

        // ── 2. Column layout ──────────────────────────────────────────────────
        const fixedBefore = ['№', 'Sinif', 'Şagirdin kodu', 'Şagirdin soyadı', 'Şagirdin adı', 'Şagirdin ata adı'];
        const allHeaders  = [...fixedBefore, ...activeDisciplines.map(d => d.label), 'Yekun bal', 'Pillə'];
        const totalCols   = allHeaders.length;
        const yekunBalIdx = fixedBefore.length + activeDisciplines.length;
        const pilleIdx    = yekunBalIdx + 1;

        // ── 3. Shared style tokens ────────────────────────────────────────────
        const BLUE   = '244185';
        const YELLOW = 'FFFF00';
        const WHITE  = 'FFFFFF';
        const BLACK  = '000000';
        const borderThin = {
            top:    { style: 'thin', color: { rgb: BLACK } },
            bottom: { style: 'thin', color: { rgb: BLACK } },
            left:   { style: 'thin', color: { rgb: BLACK } },
            right:  { style: 'thin', color: { rgb: BLACK } },
        };
        const headerBase = {
            font:      { bold: true, sz: 10, color: { rgb: WHITE } },
            fill:      { patternType: 'solid', fgColor: { rgb: BLUE } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border:    borderThin,
        };
        const headerYekun = {
            font:      { bold: true, sz: 10, color: { rgb: BLACK } },
            fill:      { patternType: 'solid', fgColor: { rgb: YELLOW } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border:    borderThin,
        };
        const dataCenter = {
            alignment: { horizontal: 'center', vertical: 'center' },
            border:    borderThin,
        };
        const dataLeft = {
            alignment: { horizontal: 'left', vertical: 'center' },
            border:    borderThin,
        };
        const dataYekun = {
            fill:      { patternType: 'solid', fgColor: { rgb: YELLOW } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border:    borderThin,
        };
        const dataBlue = {
            font:      { color: { rgb: WHITE } },
            fill:      { patternType: 'solid', fgColor: { rgb: BLUE } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border:    borderThin,
        };

        // ── 4. Build worksheet ────────────────────────────────────────────────
        const ws: XLSX.WorkSheet = {};

        // Row 0 — merged title
        ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = {
            v: filterLabel, t: 's',
            s: {
                font:      { bold: true, sz: 13 },
                alignment: { horizontal: 'center', vertical: 'center' },
            },
        };

        // Row 1 — headers
        allHeaders.forEach((header, c) => {
            ws[XLSX.utils.encode_cell({ r: 1, c })] = {
                v: header, t: 's',
                s: c === yekunBalIdx ? headerYekun : headerBase,
            };
        });

        // Rows 2+ — data
        results.forEach((r, rowIdx) => {
            const rowR = rowIdx + 2;
            const cells: Array<string | number> = [
                rowIdx + 1,
                r.grade ?? '',
                r.studentData?.code ?? '',
                r.studentData?.lastName ?? '',
                r.studentData?.firstName ?? '',
                r.studentData?.middleName ?? '',
                ...activeDisciplines.map(d => (r.disciplines as any)?.[d.key] ?? ''),
                r.totalScore ?? 0,
                r.level ?? '',
            ];

            cells.forEach((val, c) => {
                const isYekunBal = c === yekunBalIdx;
                const isPille    = c === pilleIdx;
                const isLeftAlign = c >= 2 && c < fixedBefore.length && c !== 1;
                const style = isYekunBal ? dataYekun
                            : isPille    ? dataBlue
                            : isLeftAlign ? dataLeft
                            : dataCenter;
                ws[XLSX.utils.encode_cell({ r: rowR, c })] = {
                    v: val,
                    t: typeof val === 'number' ? 'n' : 's',
                    s: style,
                };
            });
        });

        // ── 5. Worksheet metadata ─────────────────────────────────────────────
        ws['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: 1 + results.length, c: totalCols - 1 },
        });
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];
        ws['!cols'] = [
            { wch: 4  },  // №
            { wch: 6  },  // Sinif
            { wch: 13 },  // kod
            { wch: 16 },  // soyadı
            { wch: 13 },  // adı
            { wch: 13 },  // ata adı
            ...activeDisciplines.map(() => ({ wch: 8 })),
            { wch: 11 },  // Yekun bal
            { wch: 9  },  // Pillə
        ];
        ws['!rows'] = [{ hpt: 28 }, { hpt: 26 }];

        // ── 6. Write file ─────────────────────────────────────────────────────
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Nəticələr');
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `imtahan-neticeleri-${dateStr}.xlsx`);
    }
}
