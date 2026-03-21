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

    formatStudentData(students: ExamResult[]): any[] {
        return students.map(result => ({
            'Şagirdin kodu': (result.studentData || {}).code,
            'Soyadı': (result.studentData || {}).lastName,
            'Adı': (result.studentData || {}).firstName,
            'Atasının adı': (result.studentData || {}).middleName,
            'Sinfi': (result.studentData || {}).grade,
            'Müəllimi': (result.studentData || {}).teacher?.fullname || 'Müəllim tapılmadı',
            'Məktəbi': (result.studentData || {}).school?.name || 'Məktəb tapılmadı',
            'Rayonu / şəhəri': (result.studentData || {}).district?.name || 'Rayon / şəhər tapılmadı',
            'Balı': result.totalScore
        }));
    }

    formatAllStudentData(students: Student[]): any[] {
        return students.map(student => ({
            'Şagirdin kodu': student.code,
            'Soyadı': student.lastName,
            'Adı': student.firstName,
            'Atasının adı': student.middleName,
            'Sinfi': student.grade,
            'Müəllimi': student.teacher?.fullname || 'Müəllim tapılmadı',
            'Məktəbi': student.school?.name || 'Məktəb tapılmadı',
            'Rayonu / şəhəri': student.district?.name || 'Rayon / şəhər tapılmadı',
            'Ümumi balı': student.score || 0,
            'Orta balı': student.averageScore || 0,
        }));
    }

    // Форматирование данных для учителей
    formatTeacherData(teachers: Teacher[]): any[] {
        return teachers.map(teacher => ({
            'Müəllimin kodu': teacher.code,
            'Soyadı, adı, ata adı': teacher.fullname,
            'Məktəbi': teacher.school?.name || '',
            'Rayonu / şəhəri': teacher.district?.name || 'Rayon / şəhər tapılmadı',
            'Ümumi balı': teacher.score,
            'Orta balı': teacher.averageScore,
        }));
    }

    // Форматирование данных для школ
    formatSchoolData(schools: School[]): any[] {
        return schools.map(school => ({
            'Məktəbin kodu': school.code,
            'Adı': school.name,
            'Rayonu / şəhəri': school.district?.name || 'Rayon / şəhər tapılmadı',
            'Ümumi balı': school.score,
            'Orta balı': school.averageScore,
        }));
    }

    // Форматирование данных для районов
    formatDistrictData(districts: District[]): any[] {
        return districts.map(district => ({
            'Rayon / şəhər kodu': district.code,
            'Adı': district.name,
            'Ümumi balı': district.score,
            'Orta balı': district.averageScore,
        }));
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
