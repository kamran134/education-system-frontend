import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ExamResultsService } from '../services/exam-results.service';
import { ExamResult } from '../../../core/models/examResult.model';
import { District } from '../../../core/models/district.model';
import { School } from '../../../core/models/school.model';
import { Teacher } from '../../../core/models/teacher.model';
import { Exam } from '../../../core/models/exam.model';
import { FilterParams } from '../../../core/models/filterParams.model';
import { DistrictService } from '../../districts/services/district.service';
import { SchoolService } from '../../schools/services/school.service';
import { TeacherService } from '../../teachers/services/teacher.service';
import { ExamService } from '../../exams/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { ResultEditingDialogComponent } from '../../students/components/result-editing/result-editing-dialog.component';

// UI Components
import { LucideAngularModule, Search, Download, Filter, X, Edit2 } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/ui/form-controls/select/select.component';

@Component({
    selector: 'app-exam-results',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        LucideAngularModule,
        ButtonComponent,
        InputComponent,
        SelectComponent
    ],
    templateUrl: './exam-results.component.html',
    styleUrl: './exam-results.component.scss'
})
export class ExamResultsComponent implements OnInit {
    // Icons
    readonly Search = Search;
    readonly Download = Download;
    readonly Filter = Filter;
    readonly X = X;
    readonly Edit2 = Edit2;
    
    // Math for template
    readonly Math = Math;

    // Data
    examResults: ExamResult[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    exams: Exam[] = [];
    
    // Pagination
    totalCount = 0;
    pageIndex = 0;
    pageSize = 1000;
    
    // Loading states
    isLoading = false;
    isLoadingDistricts = false;
    isLoadingSchools = false;
    isLoadingTeachers = false;
    isLoadingExams = false;
    
    // Filters
    searchText = '';
    studentCode = '';
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedExamIds: string[] = [];
    selectedGrades: number[] = [];
    
    // Filter visibility
    showFilters = false;

    // Table columns
    displayedColumns = [
        { key: 'exam.date', label: 'Tarix', sortable: true },
        { key: 'studentData.code', label: 'Kod', sortable: true },
        { key: 'studentData.lastName', label: 'Soyadı', sortable: true },
        { key: 'studentData.firstName', label: 'Adı', sortable: true },
        { key: 'grade', label: 'Sinif', sortable: true },
        { key: 'studentData.school.name', label: 'Məktəb', sortable: true },
        { key: 'studentData.teacher.fullname', label: 'Müəllim', sortable: true },
        { key: 'studentData.district.name', label: 'Rayon', sortable: true },
        { key: 'totalScore', label: 'Ümumi bal', sortable: true },
        { key: 'level', label: 'Pillə', sortable: true },
        { key: 'actions', label: 'Əməliyyatlar', sortable: false }
    ];

    // Sort
    sortColumn = '';
    sortDirection: 'asc' | 'desc' = 'desc';

    constructor(
        private examResultsService: ExamResultsService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private examService: ExamService,
        private dialog: MatDialog,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadDistricts();
        this.loadExams();
        this.loadExamResults();
    }

    get districtOptions(): SelectOption[] {
        return this.districts.map(district => ({
            value: district._id,
            label: district.name
        }));
    }

    get schoolOptions(): SelectOption[] {
        return this.schools.map(school => ({
            value: school._id,
            label: school.name
        }));
    }

    get teacherOptions(): SelectOption[] {
        return this.teachers.map(teacher => ({
            value: teacher._id,
            label: teacher.fullname
        }));
    }

    get examOptions(): SelectOption[] {
        return this.exams.map(exam => ({
            value: exam._id,
            label: `${exam.name} (${new Date(exam.date).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })})`
        }));
    }

    get gradeOptions(): SelectOption[] {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(grade => ({
            value: grade,
            label: grade.toString()
        }));
    }

    loadExamResults(): void {
        console.log('🔄 Loading started, isLoading =', true);
        this.isLoading = true;
        
        const filters: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            search: this.searchText || undefined,
            code: this.studentCode || undefined,
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
            teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds : undefined,
            examIds: this.selectedExamIds.length > 0 ? this.selectedExamIds.join(",") : undefined,
            grades: this.selectedGrades.length > 0 ? this.selectedGrades.join(",") : undefined,
            sortColumn: this.sortColumn || undefined,
            sortDirection: this.sortDirection || undefined
        };

        console.log('📊 Exam Results Filters:', filters);
        console.log('🎯 Selected Exam IDs:', this.selectedExamIds);
        console.log('🎓 Selected Grades:', this.selectedGrades);
        console.log('🎓 Grades string:', filters.grades);

        this.examResultsService.getExamResults(filters).subscribe({
            next: (response) => {
                console.log('✅ Exam Results Response:', response);
                this.examResults = response.data;
                this.totalCount = response.totalCount;
                console.log('🏁 Loading finished, isLoading =', false);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Nəticələrin yüklənməsində xəta:', error);
                console.log('❌ Loading error, isLoading =', false);
                this.isLoading = false;
            }
        });
    }

    loadDistricts(): void {
        this.isLoadingDistricts = true;
        const params: FilterParams = { page: 1, size: 1000 };
        
        this.districtService.getDistricts(params).subscribe({
            next: (response) => {
                this.districts = response.data || [];
                this.isLoadingDistricts = false;
            },
            error: (error) => {
                console.error('Rayonların yüklənməsində xəta:', error);
                this.isLoadingDistricts = false;
            }
        });
    }

    loadSchools(): void {
        this.isLoadingSchools = true;
        const params: FilterParams = {
            page: 1,
            size: 1000,
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined
        };
        
        this.schoolService.getSchools(params).subscribe({
            next: (response) => {
                this.schools = response.data || [];
                this.isLoadingSchools = false;
            },
            error: (error) => {
                console.error('Məktəblərin yüklənməsində xəta:', error);
                this.isLoadingSchools = false;
            }
        });
    }

    loadTeachers(): void {
        this.isLoadingTeachers = true;
        const params: FilterParams = {
            page: 1,
            size: 1000,
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined
        };
        
        this.teacherService.getTeachers(params).subscribe({
            next: (response) => {
                this.teachers = response.data || [];
                this.isLoadingTeachers = false;
            },
            error: (error) => {
                console.error('Müəllimlərin yüklənməsində xəta:', error);
                this.isLoadingTeachers = false;
            }
        });
    }

    loadExams(): void {
        this.isLoadingExams = true;
        const params: FilterParams = {
            page: 1,
            size: 1000,
            sortColumn: 'date',
            sortDirection: 'desc'
        };

        this.examService.getExams(params).subscribe({
            next: (response: any) => {
                this.exams = ResponseHandlerUtil.extractData<Exam[]>(response) || [];
                this.isLoadingExams = false;
            },
            error: (err: any) => {
                console.error('İmtahanların yüklənməsində xəta:', err);
                this.isLoadingExams = false;
            }
        });
    }

    onDistrictChange(districtIds: string[]): void {
        this.selectedDistrictIds = districtIds;
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.schools = [];
        this.teachers = [];
        
        if (districtIds.length > 0) {
            this.loadSchools();
        }
        this.loadExamResults();
    }

    onSchoolChange(schoolIds: string[]): void {
        this.selectedSchoolIds = schoolIds;
        this.selectedTeacherIds = [];
        this.teachers = [];
        
        if (schoolIds.length > 0) {
            this.loadTeachers();
        }
        this.loadExamResults();
    }

    onTeacherChange(teacherIds: string[]): void {
        this.selectedTeacherIds = teacherIds;
        this.loadExamResults();
    }

    onExamChange(examIds: string[]): void {
        this.selectedExamIds = examIds;
        this.pageIndex = 0;
        this.loadExamResults();
    }

    onGradeChange(grades: number[]): void {
        this.selectedGrades = grades;
        this.pageIndex = 0;
        this.loadExamResults();
    }

    onSearch(): void {
        this.pageIndex = 0;
        this.loadExamResults();
    }

    onStudentCodeChange(): void {
        this.pageIndex = 0;
        this.loadExamResults();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.loadExamResults();
    }

    onPageChange(event: { pageIndex: number; pageSize: number }): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadExamResults();
    }

    onPageSizeChange(): void {
        this.pageIndex = 0; // Reset to first page when changing page size
        this.loadExamResults();
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    clearFilters(): void {
        this.searchText = '';
        this.studentCode = '';
        this.selectedDistrictIds = [];
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.selectedExamIds = [];
        this.selectedGrades = [];
        this.schools = [];
        this.teachers = [];
        this.pageIndex = 0;
        this.loadExamResults();
    }

    formatDate(date: string | Date | undefined): string {
        if (!date) return '';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('az-AZ');
    }

    getLevelBadgeClass(level: string): string {
        switch (level?.toLowerCase()) {
            case 'yüksək':
            case 'lisey':
            case 'lise':
                return 'bg-green-100 text-green-800';
            case 'orta':
                return 'bg-yellow-100 text-yellow-800';
            case 'aşağı':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    exportToExcel(): void {
        // TODO: Implement Excel export
        console.log('Excel export functionality will be implemented');
    }

    get canEditExamResults(): boolean {
        return this.authService.canEditExamResults();
    }

    get canDeleteExamResults(): boolean {
        return this.authService.canDeleteExamResults();
    }

    onEditResult(result: ExamResult): void {
        const dialogRef = this.dialog.open(ResultEditingDialogComponent, {
            width: '900px',
            disableClose: false,
            data: { result, canDelete: this.canDeleteExamResults }
        });
        dialogRef.afterClosed().subscribe((response: { action: string, data?: Partial<ExamResult> } | undefined) => {
            if (response?.action === 'save' && response.data) {
                this.updateResult(result._id, response.data);
            } else if (response?.action === 'delete') {
                this.deleteResult(result._id);
            }
        });
    }

    private updateResult(resultId: string, editedResult: Partial<ExamResult>): void {
        this.examResultsService.updateStudentResult(resultId, editedResult).subscribe({
            next: () => { this.loadExamResults(); },
            error: (error: any) => { console.error('Xəta!', error); }
        });
    }

    private deleteResult(resultId: string): void {
        this.examResultsService.deleteStudentResult(resultId).subscribe({
            next: () => { this.loadExamResults(); },
            error: (error: any) => { console.error('Xəta!', error); }
        });
    }
}
