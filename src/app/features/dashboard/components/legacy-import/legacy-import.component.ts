import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Database, Upload, School, Users, GraduationCap, FileText, CheckCircle, XCircle, Loader } from 'lucide-angular';
import { SchoolService } from '../../../schools/services/school.service';

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
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule
    ],
    templateUrl: './legacy-import.component.html',
    styleUrl: './legacy-import.component.scss'
})
export class LegacyImportComponent {
    @ViewChild('schoolFileInput') schoolFileInput!: ElementRef<HTMLInputElement>;

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
            disabled: true
        },
        {
            id: 'students',
            title: 'Şagirdlər',
            description: 'Köhnə bazadan şagird məlumatlarını idxal edin',
            icon: GraduationCap,
            disabled: true
        },
        {
            id: 'results',
            title: 'Şagird nəticələri',
            description: 'Köhnə bazadan şagird nəticələrini idxal edin',
            icon: FileText,
            disabled: true
        }
    ];

    constructor(private schoolService: SchoolService) {}

    onImport(sectionId: string): void {
        if (sectionId === 'schools') {
            this.schoolFileInput.nativeElement.value = '';
            this.schoolFileInput.nativeElement.click();
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

    getState(sectionId: string): SectionState {
        return this.sectionStates[sectionId];
    }
}
