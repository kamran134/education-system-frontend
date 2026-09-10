import { Component, DestroyRef, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
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
import { ExcelService } from '../../../core/services/excel.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { IdUtil } from '../../../core/utils/id.util';
import { ResultEditingDialogComponent } from '../../students/components/result-editing/result-editing-dialog.component';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { UserSettings } from '../../../core/models/settings.model';

// UI Components
import { LucideAngularModule, Search, Download, Filter, X, Edit2 } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/form-controls/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/ui/form-controls/select/select.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../shared/components/ui/data-table/table-defaults';
import { FullscreenPanelComponent } from '../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';

@Component({
    selector: 'app-exam-results',
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        LucideAngularModule,
        ButtonComponent,
        InputComponent,
        SelectComponent,
        DataTableComponent,
        FullscreenPanelComponent
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

    // Data
    examResults: ExamResult[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    exams: Exam[] = [];

    // Pagination
    totalCount = 0;
    pageIndex = 0;
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    tableFullscreen = false;

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

    @ViewChild('totalScoreCell', { static: true }) totalScoreCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;
    @ViewChild('levelCell', { static: true }) levelCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;

    // Порядок и состав колонок по умолчанию (FIXES п.4 от 04.09.2026: «Şagirdlər, pilləsi və bal
    // faizləri ön planda»). Ключи совпадают с ключами вкладки examResults в roles-columns.component.ts —
    // это те же строки, что хранятся в user_settings.role_settings.
    private readonly defaultColumnOrder: string[] = [
        'studentData.code',
        'studentData.fullname',
        'grade',
        'level',
        'scorePercent',
        'totalScore',
        'exam.date',
        'studentData.school.name',
        'studentData.teacher.fullname',
        'studentData.district.name'
    ];

    // Порядок колонок, настроенный админом для роли пользователя (roles-columns.component.ts) —
    // null, пока настройки ещё не загружены или роль не настроена: тогда используется defaultColumnOrder.
    private columnOrder: string[] | null = null;

    private get columnCatalog(): Record<string, TableColumn> {
        return {
            'studentData.code': { key: 'studentData.code', label: 'İş nömrəsi', sortable: true, formatter: (v, row) => v || row.student },
            'studentData.fullname': { key: 'studentData.fullname', label: 'Soyadı, adı, ata adı', sortable: true },
            'grade': { key: 'grade', label: 'Sinif', sortable: true },
            'level': { key: 'level', label: 'Pillə', sortable: true, cellTemplate: this.levelCellTemplate },
            // Не сортируется — сортировка идёт на бэкенде по колонкам БД, а этой колонки в БД нет.
            'scorePercent': { key: 'scorePercent', label: 'Bal faizi', sortable: false, formatter: (_v, row) => this.formatScorePercent(row) },
            'totalScore': { key: 'totalScore', label: 'Ümumi bal', sortable: true, cellTemplate: this.totalScoreCellTemplate },
            'exam.date': { key: 'exam.date', label: 'Tarix', sortable: true, formatter: (v) => this.formatDate(v) },
            'studentData.school.name': { key: 'studentData.school.name', label: 'Məktəb', sortable: true },
            'studentData.teacher.fullname': { key: 'studentData.teacher.fullname', label: 'Müəllim', sortable: true },
            'studentData.district.name': { key: 'studentData.district.name', label: 'Təhsil sektoru', sortable: true }
        };
    }

    get displayedColumns(): TableColumn[] {
        const order = this.columnOrder?.length ? this.columnOrder : this.defaultColumnOrder;
        const catalog = this.columnCatalog;
        return order.map(key => catalog[key]).filter((c): c is TableColumn => !!c);
    }

    // Bal faizi — server hesablayır (student_results.score_percent, IMTAHAN_NOVLERI_TASK.md §5/§7):
    // total_score / Σ max_questions konfiqurasiyası əsasında, imtahan növünün bölməsindən.
    // Əvvəlki "ehtiyat 50 sual" məxrəci (lifeKnowledgeCount/logicCount doldurulmadığı üçün)
    // artıq lazım deyil — server hər nəticənin öz maxQuestions-unu istifadə edir.
    formatScorePercent(row: ExamResult): string {
        if (row.scorePercent == null) return '—';
        return `${Math.round(row.scorePercent)}%`;
    }

    get userRole(): string | null {
        return this.authService.getRole();
    }

    // Скрытие бессмысленных для роли фильтров (FIXES п.4 от 04.09.2026) — бэкенд и так сужает
    // выборку по роли, фронт лишь не показывает то, чем роль всё равно не управляет.
    get hideDistrictFilter(): boolean {
        return ['teacher', 'schoolDirector', 'districtRepresenter'].includes(this.userRole || '');
    }

    get hideSchoolFilter(): boolean {
        return ['teacher', 'schoolDirector'].includes(this.userRole || '');
    }

    get hideTeacherFilter(): boolean {
        return this.userRole === 'teacher';
    }

    get tableActions(): TableAction[] {
        return this.canEditExamResults
            ? [{ key: 'edit', label: 'Düzəliş et', icon: this.Edit2, variant: 'primary' }]
            : [];
    }

    // Sort
    sortColumn = '';
    sortDirection: 'asc' | 'desc' = 'desc';

    isExporting = false;

    private filterTrigger$ = new Subject<void>();
    private destroyRef = inject(DestroyRef);

    constructor(
        private examResultsService: ExamResultsService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private examService: ExamService,
        private dialog: Dialog,
        private authService: AuthService,
        private excelService: ExcelService,
        private dashboardService: DashboardService
    ) {}

    ngOnInit(): void {
        this.filterTrigger$.pipe(
            debounceTime(150),
            switchMap(() => {
                this.isLoading = true;
                const filters: FilterParams = {
                    page: this.pageIndex + 1,
                    size: this.pageSize,
                    search: this.searchText || undefined,
                    code: this.studentCode || undefined,
                    districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
                    schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
                    teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds : undefined,
                    examIds: this.selectedExamIds.length > 0 ? this.selectedExamIds.join(',') : undefined,
                    grades: this.selectedGrades.length > 0 ? this.selectedGrades.join(',') : undefined,
                    sortColumn: this.sortColumn || undefined,
                    sortDirection: this.sortDirection || undefined
                };
                return this.examResultsService.getExamResults(filters);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.examResults = response.data;
                this.totalCount = response.totalCount;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Nəticələrin yüklənməsində xəta:', error);
                this.isLoading = false;
            }
        });

        this.loadDistricts();
        this.loadExams();
        this.loadExamResults();
        this.loadColumnSettings();

        // schoolDirector: "Təhsil sektorları"/"Məktəblər" filtrləri gizlədilib (hideSchoolFilter),
        // ona görə normal zəncir (district → school → teacher) işə düşmür — müəllimlər siyahısını
        // özü yükləyirik (backend teacher.controller.getTeachers onsuz da direktoru öz məktəbi ilə
        // süzür, əlavə district/school id lazım deyil).
        if (!this.hideTeacherFilter && this.hideSchoolFilter) {
            this.loadTeachers();
        }
    }

    // Тот же приём, что stats.component.ts:loadSettings() (non-admin ветка) — глобальные
    // настройки по ролям, а не персональные (у exam-results нет отдельных «своих» колонок).
    private loadColumnSettings(): void {
        this.dashboardService.getGlobalColumns().subscribe({
            next: (settings: UserSettings) => {
                const roleKey = this.userRole as string;
                const roleData = (settings?.roleSettings as any)?.[roleKey];
                this.columnOrder = roleData?.examResults?.length ? roleData.examResults : null;
            },
            error: (error: Error) => {
                console.error('Error loading exam results column settings:', error);
            }
        });
    }

    get districtOptions(): SelectOption[] {
        return this.districts.map(district => ({
            value: district.id,
            label: district.name
        }));
    }

    get schoolOptions(): SelectOption[] {
        return this.schools.map(school => ({
            value: school.id,
            label: school.name
        }));
    }

    get teacherOptions(): SelectOption[] {
        return this.teachers.map(teacher => ({
            value: teacher.id,
            label: teacher.fullname
        }));
    }

    get examOptions(): SelectOption[] {
        return this.exams.map(exam => ({
            value: exam.id,
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
        this.filterTrigger$.next();
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

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
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
        if (this.isExporting) return;
        this.isExporting = true;
        const parts: string[] = [];

        if (this.selectedDistrictIds.length > 0) {
            const names = this.selectedDistrictIds
                .map(id => this.districts.find(d => IdUtil.equals(d.id, id))?.name)
                .filter((n): n is string => !!n)
                .join(', ');
            if (names) parts.push(names);
        }

        if (this.selectedGrades.length > 0) {
            parts.push(this.selectedGrades.join(', ') + ' sinif');
        }

        const filterLabel = parts.length > 0 ? parts.join(' | ') : 'İmtahan nəticələri';
        try {
            this.excelService.exportExamResultsStyled(this.examResults, filterLabel);
        } catch (err) {
            console.error('Excel export error:', err);
        } finally {
            this.isExporting = false;
        }
    }

    get canEditExamResults(): boolean {
        return this.authService.canEditExamResults();
    }

    get canDeleteExamResults(): boolean {
        return this.authService.canDeleteExamResults();
    }

    onTableAction(event: { action: string; item: ExamResult }): void {
        if (event.action === 'edit') {
            this.onEditResult(event.item);
        }
    }

    onEditResult(result: ExamResult): void {
        const dialogRef = this.dialog.open<any>(ResultEditingDialogComponent, {
            width: '900px',
            disableClose: false,
            data: { result, canDelete: this.canDeleteExamResults }
        });
        dialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response: { action: string, data?: Partial<ExamResult> } | undefined) => {
            if (response?.action === 'save' && response.data) {
                this.updateResult(result.id, response.data);
            } else if (response?.action === 'delete') {
                this.deleteResult(result.id);
            }
        });
    }

    private updateResult(resultId: string | number, editedResult: Partial<ExamResult>): void {
        this.examResultsService.updateStudentResult(resultId, editedResult).subscribe({
            next: () => { this.loadExamResults(); },
            error: (error: any) => { console.error('Xəta!', error); }
        });
    }

    private deleteResult(resultId: string | number): void {
        this.examResultsService.deleteStudentResult(resultId).subscribe({
            next: () => { this.loadExamResults(); },
            error: (error: any) => { console.error('Xəta!', error); }
        });
    }
}
