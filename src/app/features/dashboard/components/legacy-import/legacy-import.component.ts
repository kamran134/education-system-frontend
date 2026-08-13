import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Database, Upload, School, Users, GraduationCap, FileText, CheckCircle, XCircle, Loader } from 'lucide-angular';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { StudentService } from '../../../students/services/student.service';
import { ExamService } from '../../../exams/services/exam.service';

interface ImportResult {
    inserted: number;
    skipped: number;
    errors: number;
    details: { skippedCodes: number[]; errorMessages: string[] };
}

interface SectionState {
    loading: boolean;
    result: ImportResult | null;
    error: string | null;
}

@Component({
    selector: 'app-legacy-import',
    imports: [
        CommonModule,
        LucideAngularModule
    ],
    templateUrl: './legacy-import.component.html',
    styleUrl: './legacy-import.component.scss'
})
export class LegacyImportComponent {
    @ViewChild('schoolFileInput') schoolFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('teacherFileInput') teacherFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('studentFileInput') studentFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('resultFileInput') resultFileInput!: ElementRef<HTMLInputElement>;

    // Icons
    readonly Database = Database;
    readonly Upload = Upload;
    readonly School = School;
    readonly Users = Users;
    readonly GraduationCap = GraduationCap;
    readonly FileText = FileText;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly Loader = Loader;

    sectionStates: Record<string, SectionState> = {
        schools: { loading: false, result: null, error: null },
        teachers: { loading: false, result: null, error: null },
        students: { loading: false, result: null, error: null },
        results: { loading: false, result: null, error: null },
    };

    importSections = [
        {
            id: 'schools',
            title: 'Məktəblər',
            description: 'Köhnə bazadan məktəb məlumatlarını idxal edin',
            icon: School,
            disabled: false
        },
        {
            id: 'teachers',
            title: 'Müəllimlər',
            description: 'Köhnə bazadan müəllim məlumatlarını idxal edin',
            icon: Users,
            disabled: false
        },
        {
            id: 'students',
            title: 'Şagirdlər',
            description: 'Köhnə bazadan şagird məlumatlarını idxal edin',
            icon: GraduationCap,
            disabled: false
        },
        {
            id: 'results',
            title: 'Şagird nəticələri',
            description: 'Köhnə bazadan şagird nəticələrini idxal edin',
            icon: FileText,
            disabled: false
        }
    ];

    constructor(private schoolService: SchoolService, private teacherService: TeacherService, private studentService: StudentService, private examService: ExamService) {}

    onImport(sectionId: string): void {
        if (sectionId === 'schools') {
            this.schoolFileInput.nativeElement.value = '';
            this.schoolFileInput.nativeElement.click();
        } else if (sectionId === 'teachers') {
            this.teacherFileInput.nativeElement.value = '';
            this.teacherFileInput.nativeElement.click();
        } else if (sectionId === 'students') {
            this.studentFileInput.nativeElement.value = '';
            this.studentFileInput.nativeElement.click();
        } else if (sectionId === 'results') {
            this.resultFileInput.nativeElement.value = '';
            this.resultFileInput.nativeElement.click();
        }
    }

    onSchoolFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const state = this.sectionStates['schools'];
        state.loading = true;
        state.result = null;
        state.error = null;

        this.schoolService.importLegacySchools(file).subscribe({
            next: (result: ImportResult) => {
                state.loading = false;
                state.result = result;
            },
            error: (err: any) => {
                state.loading = false;
                state.error = err?.error?.message || err?.message || 'İdxal zamanı xəta baş verdi';
            }
        });
    }

    onTeacherFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const state = this.sectionStates['teachers'];
        state.loading = true;
        state.result = null;
        state.error = null;

        this.teacherService.importLegacyTeachers(file).subscribe({
            next: (result: ImportResult) => {
                state.loading = false;
                state.result = result;
            },
            error: (err: any) => {
                state.loading = false;
                state.error = err?.error?.message || err?.message || 'İdxal zamanı xəta baş verdi';
            }
        });
    }

    onStudentFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const state = this.sectionStates['students'];
        state.loading = true;
        state.result = null;
        state.error = null;

        this.studentService.importLegacyStudents(file).subscribe({
            next: (result: ImportResult) => {
                state.loading = false;
                state.result = result;
            },
            error: (err: any) => {
                state.loading = false;
                state.error = err?.error?.message || err?.message || 'İdxal zamanı xəta baş verdi';
            }
        });
    }

    onResultFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const state = this.sectionStates['results'];
        state.loading = true;
        state.result = null;
        state.error = null;

        this.examService.importLegacyResults(file).subscribe({
            next: (result: ImportResult) => {
                state.loading = false;
                state.result = result;
            },
            error: (err: any) => {
                state.loading = false;
                state.error = err?.error?.message || err?.message || 'İdxal zamanı xəta baş verdi';
            }
        });
    }

    getState(sectionId: string): SectionState {
        return this.sectionStates[sectionId];
    }
}
