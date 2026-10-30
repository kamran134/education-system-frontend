import { Component, DestroyRef, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { ExamResultsService } from '../services/exam-results.service';
import { ExamResult } from '../../../core/models/examResult.model';
import { District } from '../../../core/models/district.model';
import { School } from '../../../core/models/school.model';
import { Teacher } from '../../../core/models/teacher.model';
import { Exam } from '../../../core/models/exam.model';
import { ExamType } from '../../../core/models/examType.model';
import { ExamTypeService } from '../../exam-types/services/exam-type.service';
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
import { DEFAULT_EXAM_RESULT_COLUMNS } from '../../../core/config/column-catalogs';
import { academicYearLabel, academicYearOfDate, getCurrentAcademicYear } from '../../../core/utils/academic-year.util';

// UI Components
import { LucideAngularModule, Search, Download, Filter, X, Edit2, ArrowLeft } from 'lucide-angular';
import { ConfirmDialogService } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/form-controls/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/ui/form-controls/select/select.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../shared/components/ui/data-table/table-defaults';
import { FilterMemoryService } from '../../../core/services/filter-memory.service';
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
    readonly ArrowLeft = ArrowLeft;

    // Data
    examResults: ExamResult[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    exams: Exam[] = [];
    examTypes: ExamType[] = [];

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
    // правки заказчика 20.09.2026 — селект типа экзамена, по умолчанию базовый.
    selectedExamTypeId: number | null = null;

    // Filter visibility
    showFilters = false;

    /** examTypeId/examIds read from the URL in applyQueryParamFilters(), see loadInitialResults(). */
    private urlExamTypeId: number | null = null;
    private examIdsFromUrl = false;

    @ViewChild('totalScoreCell', { static: true }) totalScoreCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;
    @ViewChild('levelCell', { static: true }) levelCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;
    @ViewChild('studentLinkCell', { static: true }) studentLinkCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;
    @ViewChild('selectCell', { static: true }) selectCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;
    @ViewChild('selectHeader', { static: true }) selectHeaderTemplate!: TemplateRef<unknown>;

    // Порядок и состав колонок по умолчанию (FIXES п.4 от 04.09.2026: «Şagirdlər, pilləsi və bal
    // faizləri ön planda»). Единый каталог ключей — core/config/column-catalogs.ts; это те же строки,
    // что хранятся в user_settings.role_settings и user_settings.exam_result_collumns.
    private readonly defaultColumnOrder: string[] = DEFAULT_EXAM_RESULT_COLUMNS;

    // Порядок колонок, настроенный админом для роли пользователя (roles-columns.component.ts) —
    // null, пока настройки ещё не загружены или роль не настроена: тогда используется defaultColumnOrder.
    private columnOrder: string[] | null = null;

    private get columnCatalog(): Record<string, TableColumn> {
        return {
            'studentData.code': { key: 'studentData.code', label: 'İş nömrəsi', sortable: true, formatter: (v, row) => v || row.student, cellTemplate: this.studentLinkCellTemplate },
            // YENI_DUZELISLER_2026-09-17 п.8: заголовок колонки упрощён, ключ не менялся (заказчик: «в /exam-results тоже»).
            'studentData.fullname': { key: 'studentData.fullname', label: 'Şagird', sortable: true, cellTemplate: this.studentLinkCellTemplate },
            'grade': { key: 'grade', label: 'Sinif', sortable: true },
            'level': { key: 'level', label: 'Pillə', sortable: true, cellTemplate: this.levelCellTemplate },
            // Не сортируется — сортировка идёт на бэкенде по колонкам БД, а этой колонки в БД нет.
            'scorePercent': { key: 'scorePercent', label: 'Bal faizi', sortable: false, formatter: (_v, row) => this.formatScorePercent(row) },
            'totalScore': { key: 'totalScore', label: 'Ümumi bal', sortable: true, cellTemplate: this.totalScoreCellTemplate },
            'exam.date': { key: 'exam.date', label: 'Tarix', sortable: true, formatter: (v) => this.formatDate(v) },
            'studentData.school.name': { key: 'studentData.school.name', label: 'Məktəb', sortable: true },
            // YENI_DUZELISLER_2026-09-17 п.3: "Müəllim" как заголовок колонки «учитель ученика» → "Layihə müəllimi".
            'studentData.teacher.fullname': { key: 'studentData.teacher.fullname', label: 'Layihə müəllimi', sortable: true },
            'studentData.district.name': { key: 'studentData.district.name', label: 'Təhsil sektoru', sortable: true }
        };
    }

    get displayedColumns(): TableColumn[] {
        const order = this.columnOrder?.length ? this.columnOrder : this.defaultColumnOrder;
        const catalog = this.columnCatalog;
        const columns = order.map(key => catalog[key]).filter((c): c is TableColumn => !!c);
        return this.selectionMode
            ? [{ key: '__select', label: '', width: '3rem', headerTemplate: this.selectHeaderTemplate, cellTemplate: this.selectCellTemplate }, ...columns]
            : columns;
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
    isDeletingFiltered = false;

    // «Seçilmişləri sil» (30.10.2026): checkboxes appear only after the quiet «Seçim rejimi» link below the
    // table is clicked — the page is shown live (Г3 E). The selection survives paging and sorting and is
    // dropped when the filter changes (selectionFilterKey), so it never holds rows the filter no longer shows.
    selectionMode = false;
    selectedResultIds = new Set<number>();
    isDeletingSelected = false;
    private selectionFilterKey = '';

    private filterTrigger$ = new Subject<void>();
    // Fires the "latest exam with results" probe; its result preselects the exam and starts the list load.
    private latestExamTrigger$ = new Subject<void>();
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
        private dashboardService: DashboardService,
        private confirmDialog: ConfirmDialogService,
        private toastService: ToastService,
        private examTypeService: ExamTypeService,
        private route: ActivatedRoute,
        private router: Router,
        private filterMemory: FilterMemoryService
    ) {}

    ngOnInit(): void {
        this.filterTrigger$.pipe(
            debounceTime(150),
            switchMap(() => {
                this.isLoading = true;
                const filterKey = JSON.stringify(this.buildFilterParams());
                if (filterKey !== this.selectionFilterKey) {
                    this.selectionFilterKey = filterKey;
                    this.selectedResultIds.clear();
                }
                this.syncStateToUrl();
                return this.examResultsService.getExamResults({
                    ...this.buildFilterParams(),
                    page: this.pageIndex + 1,
                    size: this.pageSize,
                    sortColumn: this.sortColumn || undefined,
                    sortDirection: this.sortDirection || undefined
                });
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

        this.latestExamTrigger$.pipe(
            switchMap(() => {
                this.isLoading = true;
                return this.examResultsService.getLatestExamId({ ...this.buildFilterParams(), examIds: undefined })
                    .pipe(catchError(() => of(null)));
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(examId => {
            this.selectedExamIds = examId != null ? [String(examId)] : [];
            this.pageIndex = 0;
            this.loadExamResults();
        });

        this.loadDistricts();
        this.loadExams();
        this.loadExamTypes();
        this.loadColumnSettings();

        // YENI_DUZELISLER_2026-09-17 п.7c: фильтр из ссылки профиля/меню владельца (districtIds/
        // schoolIds/teacherIds в queryParams) — читаем один раз, до первого filterTrigger$, по
        // образцу statistics-main.component.ts::applyQueryParamFilters(). Серверный скоуп по
        // ролям (examResults.controller.ts) остаётся как есть — здесь только предвыбор фронта.
        const hasQueryFilters = this.applyQueryParamFilters();
        if (hasQueryFilters || this.filterMemory.takeRestored()) this.showFilters = true;

        // Тот же приём каскада district → school → teacher, что и в onDistrictChange/onSchoolChange
        // ниже — но без повторного вызова loadExamResults() (первый запрос списка шлёт предвыбор экзамена, Г3 A).
        if (this.selectedDistrictIds.length > 0) {
            this.loadSchools();
        }
        if (this.selectedSchoolIds.length > 0) {
            this.loadTeachers();
        } else if (!this.hideTeacherFilter && this.hideSchoolFilter) {
            // schoolDirector: "Təhsil sektorları"/"Məktəblər" filtrləri gizlədilib (hideSchoolFilter),
            // ona görə normal zəncir (district → school → teacher) işə düşmür — müəllimlər siyahısını
            // özü yükləyirik (backend teacher.controller.getTeachers onsuz da direktoru öz məktəbi ilə
            // süzür, əlavə district/school id lazım deyil). schoolIds queryParams-dan gəlmişsə,
            // yuxarıdakı budaq artıq yükləyib — təkrar sorğu getmir.
            this.loadTeachers();
        }
        // The first list request is sent by the latest-exam preselect (see loadExamTypes), not here.
    }

    /** YENI_DUZELISLER_2026-09-17 п.7c: см. вызов в ngOnInit(). Возвращает true, если хоть один
     *  фильтр пришёл из ссылки — используется, чтобы сразу раскрыть панель фильтров. */
    private applyQueryParamFilters(): boolean {
        const params = this.route.snapshot.queryParams;
        let hasFilters = false;
        if (params['districtIds']) {
            this.selectedDistrictIds = String(params['districtIds']).split(',').filter((id: string) => id.trim() !== '');
            hasFilters = true;
        }
        if (params['schoolIds']) {
            this.selectedSchoolIds = String(params['schoolIds']).split(',').filter((id: string) => id.trim() !== '');
            hasFilters = true;
        }
        if (params['teacherIds']) {
            this.selectedTeacherIds = String(params['teacherIds']).split(',').filter((id: string) => id.trim() !== '');
            hasFilters = true;
        }
        // The rest is written by syncStateToUrl() — back from a student card or restored by
        // FilterMemoryService. examIds from the URL replace the latest-exam preselect (see loadExamTypes).
        if (params['examTypeId']) {
            const examTypeId = parseInt(params['examTypeId'], 10);
            if (!isNaN(examTypeId)) this.urlExamTypeId = examTypeId;
        }
        if (params['examIds']) {
            this.selectedExamIds = String(params['examIds']).split(',').filter((id: string) => id.trim() !== '');
            this.examIdsFromUrl = this.selectedExamIds.length > 0;
            hasFilters = true;
        }
        if (params['grades']) {
            this.selectedGrades = String(params['grades']).split(',').map(Number).filter((g: number) => !isNaN(g));
            hasFilters = true;
        }
        if (params['search']) {
            this.searchText = String(params['search']);
            hasFilters = true;
        }
        if (params['code']) {
            this.studentCode = String(params['code']);
            hasFilters = true;
        }
        if (params['page']) this.pageIndex = Math.max(0, (parseInt(params['page'], 10) || 1) - 1);
        if (params['size']) this.pageSize = parseInt(params['size'], 10) || TABLE_PAGE_SIZE_DEFAULT;
        if (params['sortColumn']) this.sortColumn = String(params['sortColumn']);
        if (params['sortDirection'] === 'asc' || params['sortDirection'] === 'desc') this.sortDirection = params['sortDirection'];
        return hasFilters;
    }

    /** Every list request writes the on-screen state into the URL (replaceUrl): location.back() from
     *  a student card returns to the same list, and FilterMemoryService remembers it for the menu. */
    private syncStateToUrl(): void {
        // The list request is debounced — don't rewrite the URL of a page the user already left.
        if (!this.router.url.startsWith('/exam-results')) return;
        const f = this.buildFilterParams();
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                districtIds: this.selectedDistrictIds.length ? this.selectedDistrictIds.join(',') : undefined,
                schoolIds: this.selectedSchoolIds.length ? this.selectedSchoolIds.join(',') : undefined,
                teacherIds: this.selectedTeacherIds.length ? this.selectedTeacherIds.join(',') : undefined,
                examTypeId: f.examTypeId,
                examIds: f.examIds,
                grades: f.grades,
                search: f.search,
                code: f.code,
                page: this.pageIndex ? this.pageIndex + 1 : undefined,
                size: this.pageSize === TABLE_PAGE_SIZE_DEFAULT ? undefined : this.pageSize,
                sortColumn: this.sortColumn || undefined,
                sortDirection: this.sortColumn ? this.sortDirection : undefined,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    // admin/superadmin берут свои колонки (user_settings.exam_result_collumns, Г2 п.3), остальные роли —
    // глобальные настройки по ролям, как в stats.component.ts:loadSettings() (non-admin ветка).
    private loadColumnSettings(): void {
        const role = this.userRole;
        if (role === 'admin' || role === 'superadmin') {
            this.dashboardService.getRatingColumns(this.authService.getUserId() || '').subscribe({
                next: (settings: UserSettings) => {
                    this.columnOrder = settings?.examResultCollumns?.length ? settings.examResultCollumns : null;
                },
                error: (error: Error) => {
                    console.error('Error loading exam results column settings:', error);
                }
            });
            return;
        }
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
        // правки заказчика 20.09.2026 — сузить список имтаханов до выбранного типа экзамена
        // (без выбранного типа — не фильтруем, все имтаханы).
        let exams = this.selectedExamTypeId != null
            ? this.exams.filter(exam => exam.examTypeId === this.selectedExamTypeId)
            : this.exams;
        // Г3 B: roles other than admin/superadmin see only the current academic year (the backend enforces it too).
        if (this.restrictToCurrentYear) {
            exams = exams.filter(exam => academicYearOfDate(exam.date) === getCurrentAcademicYear());
        }
        return exams.map(exam => ({
            value: exam.id,
            label: `${exam.name} (${new Date(exam.date).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })})`
        }));
    }

    /** Г3 B: every role except admin/superadmin is limited to the current academic year. */
    get restrictToCurrentYear(): boolean {
        return !this.authService.isAdminOrSuperAdmin();
    }

    readonly currentYearLabel = academicYearLabel(getCurrentAcademicYear());

    /** Selected exam(s) for the table header: name for one, count for several. */
    get selectedExamsLabel(): string {
        const n = this.selectedExamIds.length;
        if (n === 0) return '';
        if (n > 1) return `${n} imtahan`;
        return this.examOptions.find(o => String(o.value) === String(this.selectedExamIds[0]))?.label ?? '';
    }

    get examTypeOptions(): SelectOption[] {
        return this.examTypes.map(t => ({ value: t.id, label: t.nameAz }));
    }

    get selectedExamTypeName(): string {
        return this.examTypes.find(t => t.id === this.selectedExamTypeId)?.nameAz ?? '';
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

    // правки заказчика 20.09.2026 — default = базовый тип. Г3 A: первый запрос списка уходит
    // отсюда — после выбора типа и пробы «последний экзамен с результатами» (preselectLatestExam),
    // сразу с предвыбранным examIds. При ошибке загрузки типов бэкенд сам возьмёт базовый.
    loadExamTypes(): void {
        this.examTypeService.getExamTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (types) => {
                this.examTypes = types.filter(t => t.active);
                const base = this.examTypes.find(t => t.isBase);
                const fromUrl = this.examTypes.find(t => t.id === this.urlExamTypeId);
                this.selectedExamTypeId = fromUrl?.id ?? base?.id ?? this.examTypes[0]?.id ?? null;
                this.loadInitialResults();
            },
            error: (err: any) => {
                console.error('İmtahan növlərinin yüklənməsində xəta:', err);
                this.selectedExamTypeId = this.urlExamTypeId;
                this.loadInitialResults();
            }
        });
    }

    /** First list request: exams already chosen in the URL (back from a card, remembered filters)
     *  are kept as is; otherwise the latest exam is preselected (Г3 A). */
    private loadInitialResults(): void {
        if (this.examIdsFromUrl) this.loadExamResults();
        else this.preselectLatestExam();
    }

    /** Г3 A: preselect the latest exam (of the selected/base type) that has results in the caller's scope. */
    private preselectLatestExam(): void {
        this.latestExamTrigger$.next();
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

    onExamTypeChange(id: number | null): void {
        this.selectedExamTypeId = id;
        this.selectedExamIds = [];
        this.pageIndex = 0;
        this.preselectLatestExam();
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

    /** Г3 C: always the front page (/panel), not browser history. */
    goHome(): void {
        this.router.navigate(['/panel']);
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
        // правки заказчика 20.09.2026 — сброс типа экзамена возвращает к базовому, не к «всем».
        this.selectedExamTypeId = this.examTypes.find(t => t.isBase)?.id ?? this.examTypes[0]?.id ?? null;
        // Г3 A: reset = default state, i.e. the latest exam of the base type is preselected again.
        this.preselectLatestExam();
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

    /** The on-screen filter without paging/sorting — shared by the list and «Filtrə uyğun nəticələri sil». */
    private buildFilterParams(): FilterParams {
        return {
            search: this.searchText || undefined,
            code: this.studentCode || undefined,
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
            teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds : undefined,
            examIds: this.selectedExamIds.length > 0 ? this.selectedExamIds.join(',') : undefined,
            grades: this.selectedGrades.length > 0 ? this.selectedGrades.join(',') : undefined,
            examTypeId: this.selectedExamTypeId ?? undefined
        };
    }

    /** Bulk delete needs at least one exam in the filter (the backend refuses otherwise). */
    get canDeleteFiltered(): boolean {
        return this.canDeleteExamResults && this.selectedExamIds.length > 0 && this.totalCount > 0;
    }

    /** Customer request 29.10.2026: delete everything the filter shows, e.g. to re-upload a corrected file. */
    async onDeleteFiltered(): Promise<void> {
        if (!this.canDeleteFiltered || this.isDeletingFiltered) return;
        const selectedExams = new Set(this.selectedExamIds.map(String));
        const examNames = this.examOptions.filter(o => selectedExams.has(String(o.value))).map(o => o.label).join(', ');
        const confirmed = await this.confirmDialog.confirm({
            title: 'Filtrə uyğun nəticələri sil',
            message: `Seçilmiş filtrə uyğun ${this.totalCount} nəticə birdəfəlik silinəcək` +
                (examNames ? ` (imtahan: ${examNames})` : '') +
                '. Bu əməliyyat geri qaytarıla bilməz. Davam edilsin?',
            variant: 'danger',
            confirmText: 'Sil'
        });
        if (!confirmed) return;

        this.isDeletingFiltered = true;
        this.examResultsService.deleteFilteredResults(this.buildFilterParams()).subscribe({
            next: (response) => {
                this.isDeletingFiltered = false;
                this.selectedResultIds.clear();
                this.toastService.show(`${response?.deletedCount ?? 0} nəticə silindi`, 'success');
                this.pageIndex = 0;
                this.loadExamResults();
            },
            error: (error: any) => {
                this.isDeletingFiltered = false;
                this.toastService.show(error?.error?.message || 'Nəticələri silmək mümkün olmadı', 'error');
            }
        });
    }

    get canSelectResults(): boolean {
        return this.canDeleteExamResults && this.totalCount > 0;
    }

    toggleSelectionMode(): void {
        this.selectionMode = !this.selectionMode;
        this.selectedResultIds.clear();
    }

    isResultSelected(row: ExamResult): boolean {
        return this.selectedResultIds.has(row.id);
    }

    toggleResultSelected(row: ExamResult, checked: boolean): void {
        if (checked) this.selectedResultIds.add(row.id);
        else this.selectedResultIds.delete(row.id);
    }

    get allOnPageSelected(): boolean {
        return this.examResults.length > 0 && this.examResults.every(r => this.selectedResultIds.has(r.id));
    }

    get someOnPageSelected(): boolean {
        return !this.allOnPageSelected && this.examResults.some(r => this.selectedResultIds.has(r.id));
    }

    togglePageSelected(checked: boolean): void {
        for (const r of this.examResults) {
            if (checked) this.selectedResultIds.add(r.id);
            else this.selectedResultIds.delete(r.id);
        }
    }

    async onDeleteSelected(): Promise<void> {
        const count = this.selectedResultIds.size;
        if (!this.canDeleteExamResults || count === 0 || this.isDeletingSelected) return;
        const confirmed = await this.confirmDialog.confirm({
            title: 'Seçilmiş nəticələri sil',
            message: `Seçilmiş ${count} nəticə birdəfəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz. Davam edilsin?`,
            variant: 'danger',
            confirmText: 'Sil'
        });
        if (!confirmed) return;

        this.isDeletingSelected = true;
        this.examResultsService.deleteSelectedResults(Array.from(this.selectedResultIds)).subscribe({
            next: (response) => {
                this.isDeletingSelected = false;
                this.selectedResultIds.clear();
                this.toastService.show(`${response?.deletedCount ?? 0} nəticə silindi`, 'success');
                this.loadExamResults();
            },
            error: (error: any) => {
                this.isDeletingSelected = false;
                this.toastService.show(error?.error?.message || 'Nəticələri silmək mümkün olmadı', 'error');
            }
        });
    }

    private deleteResult(resultId: string | number): void {
        this.examResultsService.deleteStudentResult(resultId).subscribe({
            next: () => { this.loadExamResults(); },
            error: (error: any) => { console.error('Xəta!', error); }
        });
    }
}
