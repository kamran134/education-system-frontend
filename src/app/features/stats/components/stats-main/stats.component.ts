import { ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatsService } from '../../services/stats.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../../../shared/constants/snack-bar.config';
import { Error } from '../../../../core/models/error.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationExtras, Params, Router, RouterModule } from '@angular/router';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { Stats } from '../../../../core/models/stats.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MonthNamePipe } from '../../../../shared/pipes/month-name.pipe';
import { Exam, ExamResponse } from '../../../../core/models/exam.model';
import { ExamService } from '../../../exams/services/exam.service';
import { Sort } from '@angular/material/sort';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { Region, RegionResponse } from '../../../../core/models/region.model';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { SchoolService } from '../../../schools/services/school.service';
import { DistrictService } from '../../../districts/services/district.service';
import { RegionService } from '../../../regions/services/region.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../../students/services/student.service';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { StatsFiltersComponent } from "../stats-filters/stats-filters.component";
import { StatsPagination } from '../../../../core/models/pagination.model';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../../../core/services/excel.service';
import { MomentDateFormatPipe } from '../../../../shared/pipes/moment-date-format.pipe';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { UserSettings } from '../../../../core/models/settings.model';
import { BehaviorSubject } from 'rxjs';
import { DevelopingStudentsTabComponent } from '../developing-students-tab/developing-students-tab.component';
import { MonthStudentsTabComponent } from '../month-students-tab/month-students-tab.component';
import { RepublicMonthStudentsTabComponent } from '../republic-month-students-tab/republic-month-students-tab.component';
import { StudentsYearTabComponent } from '../students-year-tab/students-year-tab.component';
import { TeachersYearTabComponent } from "../teachers-year-tab/teachers-year-tab.component";
import { SchoolsYearTabComponent } from "../schools-year-tab/schools-year-tab.component";
import { DistrictsYearTabComponent } from "../districts-year-tab/districts-year-tab.component";
import { RegionsYearTabComponent } from "../regions-year-tab/regions-year-tab.component";
import { PermissionsService } from '../../../../core/services/permissions.service';

// UI Components
import { LucideAngularModule, Home, RefreshCw, Loader, AlertCircle } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';

@Component({
    selector: 'app-stats',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        LucideAngularModule,
        ButtonComponent,
        StatsFiltersComponent,
        DevelopingStudentsTabComponent,
        MonthStudentsTabComponent,
        RepublicMonthStudentsTabComponent,
        StudentsYearTabComponent,
        TeachersYearTabComponent,
        SchoolsYearTabComponent,
        DistrictsYearTabComponent,
        RegionsYearTabComponent
    ],
    providers: [MonthNamePipe, MomentDateFormatPipe],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit, OnDestroy {
    @ViewChild('teacherSort') teacherSort!: MatSort;
    @ViewChild('schoolSort') schoolSort!: MatSort;
    @ViewChild('studentSort') studentSort!: MatSort;
    @ViewChild('districtSort') districtSort!: MatSort;

    // Icons
    readonly Home = Home;
    readonly RefreshCw = RefreshCw;
    readonly Loader = Loader;
    readonly AlertCircle = AlertCircle;

    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;
    isloading: boolean = false;
    isUpdating: boolean = false;
    isUpdatingAll: boolean = false;
    stats: Stats = {
        studentsOfMonth: [],
        studentsOfMonthByRepublic: [],
        developingStudents: [],
        students: [],
        teachers: [],
        schools: [],
        districts: [],
        regions: [],
        studentsRating: []
    };
    totalCounts: StatsPagination = {
        studentsTotalCount: 0,
        allStudentsTotalCount: 0,
        allTeachersTotalCount: 0,
        allSchoolsTotalCount: 0,
        allDistrictsTotalCount: 0,
        allRegionsTotalCount: 0
    };
    selectedTab: 'developingStudents' | 'studentsOfMonth' | 'studentsOfMonthByRepublic' | 'allStudents' | 'allTeachers' | 'allSchools' | 'allDistricts' | 'allRegions' = 'developingStudents';
    developingStudentColumns: string[] = [];
    monthStudentColumns: string[] = [];
    studentColumns: string[] = [];
    teacherColumns: string[] = ['districtPlace', 'place', 'filterPlace', 'code', 'fullName', 'school', 'district', 'studentCount', 'score', 'averageScore'];
    schoolColumns: string[] = ['districtPlace', 'place', 'filterPlace', 'code', 'name', 'district', 'studentCount', 'score', 'averageScore'];
    districtColumns: string[] = ['place', 'filterPlace', 'code', 'name', 'studentCount', 'score', 'averageScore'];
    regionColumns: string[] = ['place', 'filterPlace', 'code', 'name', 'districtCount', 'studentCount', 'score', 'averageScore'];
    developingStudentsLabel$ = new BehaviorSubject<string>('Cari ayda inkişaf edən şagirdlər');
    studentsOfMonthLabel$ = new BehaviorSubject<string>('Cari ayın şagirdləri');
    studentsOfMonthByRepublicLabel$ = new BehaviorSubject<string>('Respublika üzrə cari ayın şagirdləri');

    private readonly availableDevelopingStudentColumns: string[] = [
        'level', 'code', 'lastName', 'firstName', 'middleName', 'grade', 'teacher', 'school', 'district', 'totalScore', 'averageScore',
    ];
    private readonly availableStudentColumns: string[] = [
        'place', 'districtPlace', 'filterPlace', 'code', 'lastName', 'firstName', 'middleName', 'grade', 'teacher', 'school', 'district', 'score', 'averageScore', 'participationCount',
    ];
    private readonly availableTeacherColumns: string[] = ['districtPlace', 'place', 'filterPlace', 'code', 'fullName', 'school', 'district', 'studentCount', 'score', 'averageScore'];
    private readonly availableSchoolColumns: string[] = ['districtPlace', 'place', 'filterPlace', 'code', 'name', 'district', 'studentCount', 'score', 'averageScore'];
    private readonly availableDistrictColumns: string[] = ['place', 'filterPlace', 'code', 'name', 'studentCount', 'score', 'averageScore'];
    private readonly availableRegionColumns: string[] = ['place', 'filterPlace', 'code', 'name', 'districtCount', 'studentCount', 'score', 'averageScore'];

    selectedMonth: string = new Date().getFullYear() + '-0'; // Формат: 'MM-YYYY-DD', где MM - месяц, YYYY - год, DD - день
    selectedAcademicYear: number = (() => { const now = new Date(); return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1; })();
    selectedRegionIds: string[] = [];
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    selectedLevels: string[] = [];
    selectedExams: Exam[] | undefined = undefined;
    selectedExamIds: string[] = [];
    selectedTabIndex: number = 0;

    // Все возможные табы
    private allTabs = [
        { label: 'İnkişaf edən şagirdlər', key: 'developingStudents', permission: 'showStudentsTab' },
        { label: 'Ayın şagirdləri', key: 'studentsOfMonth', permission: 'showStudentsTab' },
        { label: 'Respublika üzrə ayın şagirdləri', key: 'studentsOfMonthByRepublic', permission: 'showStudentsTab' },
        { label: 'İlin şagirdləri', key: 'allStudents', permission: 'showStudentsTab' },
        { label: 'İlin müəllimləri', key: 'allTeachers', permission: 'showTeachersTab' },
        { label: 'İlin məktəbləri', key: 'allSchools', permission: 'showSchoolsTab' },
        { label: 'İlin rayonları / şəhərləri', key: 'allDistricts', permission: 'showDistrictsTab' },
        { label: 'İlin regional idarələri', key: 'allRegions', permission: 'showRegionsTab' }
    ];

    // Геттер для фильтрации табов по правам доступа
    get tabs() {
        return this.allTabs.filter(tab =>
            this.permissions.canShowUI(tab.permission as any)
        );
    }
    regions: Region[] = [];
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    students: Student[] = [];
    totalCount: number = 0;
    pageSize: number = 1000;
    studentsPageSize: number = 1000;
    pageIndex: number = 0;
    exams: Exam[] = [];
    errorMessage: string = '';
    gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    studentsDataSource = new MatTableDataSource(this.stats.students);
    teachersDataSource = new MatTableDataSource(this.stats.teachers);
    schoolsDataSource = new MatTableDataSource(this.stats.schools);
    districtsDataSource = new MatTableDataSource(this.districts);
    darkMode: boolean = false;
    searchString: string = '';
    sortDirection: 'asc' | 'desc' | '' = 'desc';
    sortActive: string = 'score';

    // Navigation history for back button functionality
    private navigationHistory: Array<{
        tabIndex: number;
        regionIds: string[];
        districtIds: string[];
        schoolIds: string[];
        teacherIds: string[];
    }> = [];

    isAdminOrSuperAdmin$ = this.authService.isAdminOrSuperAdmin$;
    authorizedUserRole: string | null = null;

    // Данные текущего пользователя
    currentUser: any = null;
    currentUserName: string = '';
    currentSchoolName: string = '';
    currentDistrictName: string = '';
    currentRegionName: string = '';

    constructor(
        private authService: AuthService,
        private statsService: StatsService,
        private districtService: DistrictService,
        private regionService: RegionService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private studentService: StudentService,
        private examService: ExamService,
        private excelService: ExcelService,
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private monthNamePipe: MonthNamePipe,
        private dashboardService: DashboardService,
        public permissions: PermissionsService
    ) { }

    private destroyRef = inject(DestroyRef);

    // Helper function to check if current tab is a student month tab
    isStudentMonthTab(): boolean {
        return ['developingStudents', 'studentsOfMonth', 'studentsOfMonthByRepublic'].includes(this.selectedTab);
    }

    ngOnInit(): void {
        this.authService.isLoggedIn$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.authorizedUserRole = this.authService.getRole();
                this.loadCurrentUserData();
                this.loadSettings();
                this.loadExams();
                this.loadRegions();
                // Не загружаем районы/школы/учителей сразу — районы зависят от возможного
                // restored regionIds из query-параметров, см. подписку ниже

                this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => {
                    // Restore filters
                    this.selectedRegionIds = params['regionIds'] ? params['regionIds'].split(',').filter((id: string) => id.trim() !== '') : [];
                    this.selectedDistrictIds = params['districtIds'] ? params['districtIds'].split(',').filter((id: string) => id.trim() !== '') : [];
                    this.selectedSchoolIds = params['schoolIds'] ? params['schoolIds'].split(',').filter((id: string) => id.trim() !== '') : [];
                    this.selectedTeacherIds = params['teacherIds'] ? params['teacherIds'].split(',').filter((id: string) => id.trim() !== '') : [];
                    this.selectedGrades = params['grades'] ? params['grades'].split(',').map(Number).filter((g: number) => !isNaN(g)) : [];
                    this.selectedExamIds = params['examIds'] ? params['examIds'].split(',').filter((id: string) => id.trim() !== '') : [];
                    this.searchString = params['search'] || '';

                    // Список районов зависит от возможного restored regionIds
                    this.loadDistricts();

                    // Restore month and tab
                    this.selectedMonth = params['month'] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                    this.selectedTab = params['tab'] || 'developingStudents';

                    // Restore sort and pagination
                    this.sortActive = params['sortActive'] || 'averageScore';
                    this.sortDirection = params['sortDirection'] || 'desc';
                    this.pageSize = params['pageSize'] ? +params['pageSize'] : 1000;
                    this.studentsPageSize = params['studentsPageSize'] ? +params['studentsPageSize'] : 1000;
                    this.pageIndex = params['pageIndex'] ? +params['pageIndex'] : 0;

                    // Map tab to correct tab index and load data
                    if (this.selectedTab === 'developingStudents') {
                        this.selectedTabIndex = 0;
                        this.loadSchools();
                        this.loadTeachers();
                        this.loadDevelopingStudentsStats();
                    } else if (this.selectedTab === 'studentsOfMonth') {
                        this.selectedTabIndex = 1;
                        this.loadSchools();
                        this.loadTeachers();
                        this.loadStudentsOfMonthStats();
                    } else if (this.selectedTab === 'studentsOfMonthByRepublic') {
                        this.selectedTabIndex = 2;
                        this.loadSchools();
                        this.loadTeachers();
                        this.loadStudentsOfMonthByRepublicStats();
                    } else if (this.selectedTab === 'allStudents') {
                        this.selectedTabIndex = 3;
                        this.loadSchools();
                        this.loadTeachers();
                        this.loadAllStudentsStats();
                    } else if (this.selectedTab === 'allTeachers') {
                        this.selectedTabIndex = 4;
                        this.loadSchools();
                        this.loadTeachersStats();
                    } else if (this.selectedTab === 'allSchools') {
                        this.selectedTabIndex = 5;
                        this.loadSchoolsStats();
                    } else if (this.selectedTab === 'allDistricts') {
                        this.selectedTabIndex = 6;
                        this.loadDistrictsStats();
                    } else if (this.selectedTab === 'allRegions') {
                        this.selectedTabIndex = 7;
                        this.loadRegionsStats();
                    }

                    const monthPart = this.selectedMonth.split('-')[1];
                    if (monthPart !== '0') {
                        this.developingStudentsLabel$.next(`${this.monthNamePipe.transform(this.selectedMonth)} ayında inkişaf edən şagirdlər`);
                        this.studentsOfMonthLabel$.next(`${this.monthNamePipe.transform(this.selectedMonth)} ayında ayın şagirdləri`);
                        this.studentsOfMonthByRepublicLabel$.next(`${this.monthNamePipe.transform(this.selectedMonth)} ayında respublika üzrə ayın şagirdləri`);
                    }
                });
            }
            else {
                this.router.navigate(['/login']);
            }
        });
    }

    // CHANGE: Метод для загрузки настроек из localStorage
    private loadSettings() {
        const role = this.authService.getCurrentUserValue()?.role;
        const isAdmin = role === 'admin' || role === 'superadmin' || role === 'moderator';

        if (isAdmin) {
            // Admin loads their own personal settings
            this.dashboardService.getRatingColumns(this.authService.getUserId() || '')
                .subscribe({
                    next: (settings: UserSettings) => {
                        this.developingStudentColumns = settings.developingStudentCollumns || this.availableDevelopingStudentColumns;
                        this.monthStudentColumns = settings.studentCollumns || this.availableStudentColumns;
                        this.studentColumns = settings.allStudentCollumns || this.availableStudentColumns;
                        this.teacherColumns = settings.allTeacherCollumns || this.availableTeacherColumns;
                        this.schoolColumns = settings.allSchoolCollumns || this.availableSchoolColumns;
                        this.districtColumns = settings.allDistrictCollumns || this.availableDistrictColumns;
                        this.regionColumns = settings.allRegionCollumns || this.availableRegionColumns;
                    },
                    error: (error: Error) => {
                        console.error('Error loading settings:', error);
                    }
                });
        } else {
            // Non-admin roles load global role-specific columns from roleSettings
            this.dashboardService.getGlobalColumns().subscribe({
                next: (settings: UserSettings) => {
                    const roleKey = role as string;
                    const roleData = (settings?.roleSettings as any)?.[roleKey];
                    if (!roleData) return;

                    const pick = (tabKey: string, fallback: string[]) => {
                        const cols: string[] = roleData[tabKey];
                        return cols && cols.length > 0 ? cols : fallback;
                    };

                    this.developingStudentColumns = pick('developingStudents', this.availableDevelopingStudentColumns);
                    this.monthStudentColumns      = pick('monthStudents', this.availableStudentColumns);
                    this.studentColumns           = pick('allStudents', this.availableStudentColumns);
                    this.teacherColumns           = pick('allTeachers', this.availableTeacherColumns);
                    this.schoolColumns            = pick('allSchools', this.availableSchoolColumns);
                    this.districtColumns          = pick('allDistricts', this.availableDistrictColumns);
                    this.regionColumns            = pick('allRegions', this.availableRegionColumns);
                },
                error: (error: Error) => {
                    console.error('Error loading global settings:', error);
                }
            });
        }
    }

    // Загрузка данных текущего пользователя для отображения заголовков
    private loadCurrentUserData(): void {
        // Сначала проверяем, есть ли уже данные в AuthService
        const cachedUser = this.authService.getCurrentUserValue();

        if (cachedUser) {
            // Используем кешированные данные, не делаем запрос
            this.currentUser = cachedUser;
            this.setupUserContext();
        } else {
            // Только если данных нет - делаем запрос
            this.authService.getCurrentUser().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.currentUser = response.data;
                        this.setupUserContext();
                    }
                },
                error: (error) => {
                    console.error('Error loading current user:', error);
                }
            });
        }
    }

    // Настройка контекста пользователя (заголовки, фильтры)
    private setupUserContext(): void {
        if (!this.currentUser) return;

        const role = this.currentUser.role;

        if (role === 'schoolDirector' && this.currentUser.schoolId) {
            // Для директора школы - загружаем данные школы
            this.schoolService.getSchoolById(this.currentUser.schoolId).subscribe({
                next: (school) => {
                    this.currentSchoolName = school.name;
                    if (school.district) {
                        this.currentDistrictName = school.district.name;
                    }
                    // Автоматически устанавливаем фильтры для директора
                    this.selectedSchoolIds = [this.currentUser.schoolId];
                    if (school.district?.id) {
                        this.selectedDistrictIds = [school.district.id];
                    }
                    // Reload current tab now that filters are set
                    this.reloadCurrentTab();
                },
                error: (error) => console.error('Error loading school data:', error)
            });
        } else if (role === 'regionRepresenter' && this.currentUser.regionId) {
            // Для представителя региона - загружаем данные региона
            this.regionService.getRegionById(this.currentUser.regionId).subscribe({
                next: (region) => {
                    this.currentRegionName = region.name;
                    // Автоматически устанавливаем фильтр для представителя региона
                    this.selectedRegionIds = [this.currentUser.regionId];
                    this.loadDistricts();
                    // Reload current tab now that filters are set
                    this.reloadCurrentTab();
                },
                error: (error) => console.error('Error loading region data:', error)
            });
        } else if (role === 'districtRepresenter' && this.currentUser.districtId) {
            // Для представителя района - загружаем данные района
            this.districtService.getDistrictById(this.currentUser.districtId).subscribe({
                next: (district) => {
                    this.currentDistrictName = district.name;
                    // Автоматически устанавливаем фильтр для представителя района
                    this.selectedDistrictIds = [this.currentUser.districtId];
                    // Reload current tab now that filters are set
                    this.reloadCurrentTab();
                },
                error: (error) => console.error('Error loading district data:', error)
            });
        } else if (role === 'teacher' && this.currentUser.teacherId) {
            // Для учителя - загружаем данные учителя
            this.teacherService.getTeacherById(this.currentUser.teacherId).subscribe({
                next: (teacher) => {
                    this.currentUserName = teacher.fullname;
                    // Автоматически устанавливаем фильтры для учителя
                    this.selectedTeacherIds = [this.currentUser.teacherId];
                    if (teacher.school?.id) {
                        this.selectedSchoolIds = [teacher.school.id];
                        this.currentSchoolName = teacher.school.name;
                    }
                    if (teacher.district?.id) {
                        this.selectedDistrictIds = [teacher.district.id];
                        this.currentDistrictName = teacher.district.name;
                    }
                    // Reload current tab now that filters are set
                    this.reloadCurrentTab();
                },
                error: (error) => console.error('Error loading teacher data:', error)
            });
        }
    }

    // Перезагружает данные текущей вкладки после установки ролевых фильтров
    private reloadCurrentTab(): void {
        switch (this.selectedTab) {
            case 'allTeachers':               this.loadTeachersStats(); break;
            case 'allSchools':                this.loadSchoolsStats(); break;
            case 'allDistricts':              this.loadDistrictsStats(); break;
            case 'allRegions':                this.loadRegionsStats(); break;
            case 'allStudents':               this.loadAllStudentsStats(); break;
            case 'developingStudents':        this.loadDevelopingStudentsStats(); break;
            case 'studentsOfMonth':           this.loadStudentsOfMonthStats(); break;
            case 'studentsOfMonthByRepublic': this.loadStudentsOfMonthByRepublicStats(); break;
        }
    }

    // Геттеры для отображения заголовков страницы
    get pageTitle(): string {
        const role = this.authorizedUserRole;

        if (role === 'schoolDirector') {
            return this.currentDistrictName && this.currentSchoolName
                ? `${this.currentDistrictName} rayon ${this.currentSchoolName}`
                : 'Məktəb direktoru';
        } else if (role === 'teacher') {
            return this.currentUserName
                ? `Layihə müəllimi: ${this.currentUserName}`
                : 'Müəllim';
        } else if (role === 'districtRepresenter') {
            return this.currentDistrictName
                ? `${this.currentDistrictName} rayon`
                : 'Rayon nümayəndəsi';
        } else if (role === 'regionRepresenter') {
            return this.currentRegionName
                ? this.currentRegionName
                : 'Regional təhsil idarəsi nümayəndəsi';
        }

        return '';
    }

    // Проверка, должны ли быть отключены фильтры
    get shouldDisableFilters(): boolean {
        const role = this.authorizedUserRole;
        return role === 'schoolDirector' || role === 'teacher' || role === 'districtRepresenter' || role === 'regionRepresenter';
    }

    // Методы для проверки конкретных фильтров
    get shouldDisableRegionFilter(): boolean {
        const role = this.authorizedUserRole;
        return role === 'schoolDirector' || role === 'teacher' || role === 'districtRepresenter' || role === 'regionRepresenter';
    }

    get shouldDisableDistrictFilter(): boolean {
        const role = this.authorizedUserRole;
        return role === 'schoolDirector' || role === 'teacher' || role === 'districtRepresenter';
    }

    get shouldDisableSchoolFilter(): boolean {
        const role = this.authorizedUserRole;
        return role === 'schoolDirector' || role === 'teacher';
    }

    get shouldDisableTeacherFilter(): boolean {
        const role = this.authorizedUserRole;
        return role === 'teacher';
    }

    // Метод для загрузки развивающихся студентов
    loadDevelopingStudentsStats(): void {
        // Проверяем, что месяц выбран (не равен "YYYY-0") или есть выбранные экзамены
        const monthPart = this.selectedMonth.split('-')[1];
        if (monthPart === '0' && this.selectedExamIds.length === 0) {
            this.snackBar.open('Ay və ya imtahan seçilməyib', 'Bağla', this.matSnackConfig);
            return;
        }

        this.isloading = true;
        this.stats.developingStudents = [];

        const params: FilterParams = {
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            levels: this.selectedLevels.join(","),
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            examIds: this.selectedExamIds.join(',') || '',
            month: this.selectedMonth,
        };

        this.statsService.getDevelopingStudentsStats(params).subscribe({
            next: (response) => {
                this.isloading = false;
                this.stats.developingStudents = ResponseHandlerUtil.extractData<any[]>(response) || [];
            },
            error: (error: any) => {
                this.isloading = false;
                if (error.status !== 404) {
                    this.snackBar.open(error.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
                }
            }
        });
    }

    // Метод для загрузки студентов месяца по районам
    loadStudentsOfMonthStats(): void {
        // Проверяем, что месяц выбран (не равен "YYYY-0") или есть выбранные экзамены
        const monthPart = this.selectedMonth.split('-')[1];
        if (monthPart === '0' && this.selectedExamIds.length === 0) {
            this.snackBar.open('Ay və ya imtahan seçilməyib', 'Bağla', this.matSnackConfig);
            return;
        }

        this.isloading = true;
        this.stats.studentsOfMonth = [];

        const params: FilterParams = {
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            levels: this.selectedLevels.join(","),
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            examIds: this.selectedExamIds.join(',') || '',
            month: this.selectedMonth,
        };

        this.statsService.getStudentsOfMonthStats(params).subscribe({
            next: (response) => {
                this.isloading = false;
                this.stats.studentsOfMonth = ResponseHandlerUtil.extractData<any[]>(response) || [];
            },
            error: (error: any) => {
                this.isloading = false;
                if (error.status !== 404) {
                    this.snackBar.open(error.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
                }
            }
        });
    }

    // Метод для загрузки студентов месяца по республике
    loadStudentsOfMonthByRepublicStats(): void {
        // Проверяем, что месяц выбран (не равен "YYYY-0") или есть выбранные экзамены
        const monthPart = this.selectedMonth.split('-')[1];
        if (monthPart === '0' && this.selectedExamIds.length === 0) {
            this.snackBar.open('Ay və ya imtahan seçilməyib', 'Bağla', this.matSnackConfig);
            return;
        }

        this.isloading = true;
        this.stats.studentsOfMonthByRepublic = [];

        const params: FilterParams = {
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            levels: this.selectedLevels.join(","),
            sortColumn: this.sortActive || 'score',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            examIds: this.selectedExamIds.join(',') || '',
            month: this.selectedMonth,
        };

        this.statsService.getStudentsOfMonthByRepublicStats(params).subscribe({
            next: (response) => {
                this.isloading = false;
                this.stats.studentsOfMonthByRepublic = ResponseHandlerUtil.extractData<any[]>(response) || [];
            },
            error: (error: any) => {
                this.isloading = false;
                if (error.status !== 404) {
                    this.snackBar.open(error.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
                }
            }
        });
    }

    // Общий метод для совместимости (можно удалить позже)
    loadMonthStudentsStats(): void {
        // Вызываем соответствующий метод в зависимости от активного таба
        if (this.selectedTabIndex === 0) {
            this.loadDevelopingStudentsStats();
        } else if (this.selectedTabIndex === 1) {
            this.loadStudentsOfMonthStats();
        } else if (this.selectedTabIndex === 2) {
            this.loadStudentsOfMonthByRepublicStats();
        }
    }

    loadAllStudentsStats(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.studentsPageSize,
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'score',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            examIds: this.selectedExamIds.join(',') || '',
            academicYear: this.selectedAcademicYear,
        };

        this.isloading = true;
        this.stats.students = [];

        this.studentService.getStudents(params).subscribe({
            next: (response) => {
                this.isloading = false;
                const paginatedData = ResponseHandlerUtil.extractPaginatedData<Student>(response);
                this.stats.students = paginatedData.data || [];
                this.totalCounts.allStudentsTotalCount = paginatedData.totalCount || 0;
            },
            error: (error: Error) => {
                this.isloading = false;
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
            }
        });
    }

    loadStatsByExam(): void {
        this.isloading = true;
        // Не очищаем весь объект stats, только обнуляем нужные поля
        this.stats.studentsOfMonth = [];
        this.stats.studentsOfMonthByRepublic = [];
        this.stats.developingStudents = [];

        if (!this.selectedExams) {
            this.isloading = false;
            this.snackBar.open('İmtahan seçilməyib', 'Bağla', this.matSnackConfig);
            return;
        }
        this.statsService.getStatsByExam(this.selectedExams).subscribe({
            next: (response) => {
                this.isloading = false;
                this.stats = ResponseHandlerUtil.extractData<any>(response);
            },
            error: (error: Error) => {
                this.isloading = false;
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
            }
        });
    }

    loadTeachersStats(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'score',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            academicYear: this.selectedAcademicYear,
        }

        this.statsService.getTeachersStats(params).subscribe({
            next: (response: any) => {
                this.isloading = false;
                const statsData = ResponseHandlerUtil.extractPaginatedData<Teacher>(response);
                this.stats = {
                    ...this.stats, teachers: statsData.data || []
                };
                this.totalCounts.allTeachersTotalCount = statsData.totalCount || 0;
                this.teachersDataSource.data = this.stats.teachers || [];
            },
            error: (error: Error) => {
                this.isloading = false;
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
            }
        });
    }

    loadSchoolsStats(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'score',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            academicYear: this.selectedAcademicYear,
        }

        this.statsService.getSchoolsStats(params).subscribe({
            next: (response) => {
                this.isloading = false;
                const statsData = ResponseHandlerUtil.extractPaginatedData<School>(response);
                this.stats = { ...this.stats, schools: statsData.data || [] };
                this.totalCounts.allSchoolsTotalCount = statsData.totalCount || 0;
                this.schoolsDataSource.data = this.stats.schools || [];
            },
            error: (error: Error) => {
                this.isloading = false;
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
            }
        });
    }

    loadDistrictsStats(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            regionIds: this.selectedRegionIds.join(","),
            sortColumn: this.sortActive || 'score',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            academicYear: this.selectedAcademicYear,
        }

        this.statsService.getDistrictsStats(params).subscribe({
            next: (response: any) => {
                this.isloading = false;
                const statsData = ResponseHandlerUtil.extractPaginatedData<District>(response);
                this.stats = { ...this.stats, districts: statsData.data || [] };
                this.totalCounts.allDistrictsTotalCount = statsData.totalCount || 0;
                this.districtsDataSource.data = this.stats.districts || [];
            },
            error: (error: Error) => {
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
            }
        });
    }

    loadRegionsStats(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            sortColumn: this.sortActive || 'score',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            academicYear: this.selectedAcademicYear,
        }

        this.statsService.getRegionsStats(params).subscribe({
            next: (response: any) => {
                this.isloading = false;
                const statsData = ResponseHandlerUtil.extractPaginatedData<Region>(response);
                this.stats = { ...this.stats, regions: statsData.data || [] };
                this.totalCounts.allRegionsTotalCount = statsData.totalCount || 0;
            },
            error: (error: Error) => {
                this.isloading = false;
                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
            }
        });
    }


    onAcademicYearChanged(year: number): void {
        this.selectedAcademicYear = year;
        if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        } else if (this.selectedTab === 'allTeachers') {
            this.loadTeachersStats();
        } else if (this.selectedTab === 'allSchools') {
            this.loadSchoolsStats();
        } else if (this.selectedTab === 'allDistricts') {
            this.loadDistrictsStats();
        } else if (this.selectedTab === 'allRegions') {
            this.loadRegionsStats();
        }
    }

    // Filters

    loadTeachers(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            regionIds: this.selectedRegionIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            sortColumn: 'fullname',
            sortDirection: 'asc'
        }

        this.teacherService.getTeachersForFilter(params)
            .subscribe({
                next: (data: Teacher[]) => {
                    this.teachers = Array.isArray(data) ? data : [];
                },
                error: (error: Error) => {
                    this.teachers = [];
                    this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                }
            });

    }

    loadSchools(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            regionIds: this.selectedRegionIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            sortColumn: 'name',
            sortDirection: 'asc',
        }

        this.schoolService.getSchoolsForFilter(params)
            .subscribe({
                next: (data: School[]) => {
                    this.schools = Array.isArray(data) ? data : [];
                },
                error: (error: Error) => {
                    this.schools = [];
                    this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                }
            });

    }

    loadDistricts(): void {
        const params: FilterParams = {
            regionIds: this.selectedRegionIds.join(","),
            sortColumn: 'name',
            sortDirection: 'asc'
        }

        this.districtService.getDistricts(params)
            .subscribe({
                next: (response: DistrictResponse) => {
                    const data = ResponseHandlerUtil.extractData<District[]>(response);
                    this.districts = Array.isArray(data) ? data : [];
                },
                error: (error: Error) => {
                    this.districts = [];
                    this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                }
            });
    }

    loadRegions(): void {
        this.regionService.getRegionsForFilter()
            .subscribe({
                next: (data: Region[]) => {
                    this.regions = Array.isArray(data) ? data : [];
                },
                error: (error: Error) => {
                    this.regions = [];
                    this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                }
            });
    }

    loadExams(): void {
        this.examService.getExamsForFilter()
            .subscribe({
                next: (response: ExamResponse) => {
                    const data = ResponseHandlerUtil.extractData<Exam[]>(response);
                    this.exams = Array.isArray(data) ? data : [];
                },
                error: (error: any) => {
                    this.exams = [];
                    this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                }
            });
    }


    // Button Handlers

    updateStats(): void {
        this.isUpdating = true;
        this.statsService.updateStats().subscribe({
            next: (response) => {
                this.isUpdating = false;
                this.snackBar.open('Statistika yeniləndi', 'OK', this.matSnackConfig);
            },
            error: (error: Error) => {
                this.isUpdating = false;
                this.snackBar.open(`${error.error.message}`, 'Bağla', this.matSnackConfig);
            }
        });
    }

    updateAllStats(): void {
        this.isUpdatingAll = true;
        this.snackBar.open('Bütün tədris ili üçün statistika yenilənir. Bu bir neçə dəqiqə çəkə bilər...', 'OK', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });

        this.statsService.updateAllStats().subscribe({
            next: (response) => {
                this.isUpdatingAll = false;
                this.snackBar.open('Bütün tədris ili üçün statistika uğurla yeniləndi!', 'OK', this.matSnackConfig);
                this.loadMonthStudentsStats();
            },
            error: (error: Error) => {
                this.isUpdatingAll = false;
                this.snackBar.open(`Xəta: ${error.error.message}`, 'Bağla', this.matSnackConfig);
            }
        });
    }

    updateMonth(month: string) {
        this.selectedMonth = month;
        this.selectedExams = [];
        this.selectedExamIds = [];
        // Вызываем соответствующий метод в зависимости от активного таба
        if (this.selectedTabIndex === 0) {
            this.loadDevelopingStudentsStats();
        } else if (this.selectedTabIndex === 1) {
            this.loadStudentsOfMonthStats();
        } else if (this.selectedTabIndex === 2) {
            this.loadStudentsOfMonthByRepublicStats();
        }
        this.developingStudentsLabel$.next(`${this.monthNamePipe.transform(month)} ayında inkişaf edən şagirdlər`);
        this.studentsOfMonthLabel$.next(`${this.monthNamePipe.transform(month)} ayında ayın şagirdləri`);
        this.studentsOfMonthByRepublicLabel$.next(`${this.monthNamePipe.transform(month)} ayında respublika üzrə ayın şagirdləri`);
    }

    onTabChange(event: any): void {
        this.isloading = true;

        if (event.index === 0) {
            this.selectedTab = 'developingStudents';
            // Для месячной статистики загружаем школы и учителей для фильтров
            this.loadSchools();
            this.loadTeachers();
            this.loadDevelopingStudentsStats();
        } else if (event.index === 1) {
            this.selectedTab = 'studentsOfMonth';
            // Для месячной статистики загружаем школы и учителей для фильтров
            this.loadSchools();
            this.loadTeachers();
            this.loadStudentsOfMonthStats();
        } else if (event.index === 2) {
            this.selectedTab = 'studentsOfMonthByRepublic';
            // Для месячной статистики загружаем школы и учителей для фильтров
            this.loadSchools();
            this.loadTeachers();
            this.loadStudentsOfMonthByRepublicStats();
        } else if (event.index === 3) {
            this.selectedTab = 'allStudents';
            // Сбрасываем сортировку для рейтинга по умолчанию (по баллу от большего к меньшему)
            this.sortActive = 'score';
            this.sortDirection = 'desc';
            // Для годовой статистики студентов тоже нужны фильтры
            this.loadSchools();
            this.loadTeachers();
            this.loadAllStudentsStats();
        } else if (event.index === 4) {
            this.selectedTab = 'allTeachers';
            // Сбрасываем сортировку для рейтинга по умолчанию (по баллу от большего к меньшему)
            this.sortActive = 'score';
            this.sortDirection = 'desc';
            // Для учителей нужны школы для фильтров
            this.loadSchools();
            this.loadTeachersStats();
        } else if (event.index === 5) {
            this.selectedTab = 'allSchools'
            // Сбрасываем сортировку для рейтинга по умолчанию (по баллу от большего к меньшему)
            this.sortActive = 'score';
            this.sortDirection = 'desc';
            this.loadSchoolsStats();
        } else if (event.index === 6) {
            this.selectedTab = 'allDistricts'
            // Сбрасываем сортировку для рейтинга по умолчанию (по баллу от большего к меньшему)
            this.sortActive = 'score';
            this.sortDirection = 'desc';
            this.loadDistrictsStats();
        } else if (event.index === 7) {
            this.selectedTab = 'allRegions'
            // Сбрасываем сортировку для рейтинга по умолчанию (по баллу от большего к меньшему)
            this.sortActive = 'score';
            this.sortDirection = 'desc';
            this.loadRegionsStats();
        }
    }

    onRegionSelectChanged(regionIds: string[]) {
        this.selectedRegionIds = regionIds;
        // Выбор региона сужает список районов в соседнем селекте (иерархия сверху вниз,
        // по образцу связки район→школа)
        this.selectedDistrictIds = [];
        this.loadDistricts();

        if (this.isStudentMonthTab()) {
            this.loadSchools();
            this.loadTeachers();
            if (this.selectedTabIndex === 0) {
                this.loadDevelopingStudentsStats();
            } else if (this.selectedTabIndex === 1) {
                this.loadStudentsOfMonthStats();
            } else if (this.selectedTabIndex === 2) {
                this.loadStudentsOfMonthByRepublicStats();
            }
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadSchools();
            this.loadTeachers();
            this.loadAllStudentsStats();
        }
        else if (this.selectedTab === 'allTeachers') {
            this.loadSchools();
            this.loadTeachersStats();
        }
        else if (this.selectedTab === 'allSchools') {
            this.loadSchoolsStats();
        }
        else if (this.selectedTab === 'allDistricts') {
            this.loadDistrictsStats();
        }
    }

    onDistrictSelectChanged(districtIds: string[]) {
        this.selectedDistrictIds = districtIds;
        if (this.isStudentMonthTab()) {
            this.loadSchools();
            this.loadTeachers();
            // Вызываем соответствующий метод в зависимости от активного таба
            if (this.selectedTabIndex === 0) {
                this.loadDevelopingStudentsStats();
            } else if (this.selectedTabIndex === 1) {
                this.loadStudentsOfMonthStats();
            } else if (this.selectedTabIndex === 2) {
                this.loadStudentsOfMonthByRepublicStats();
            }
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadSchools();
            this.loadTeachers();
            this.loadAllStudentsStats();
        }
        else if (this.selectedTab === 'allTeachers') {
            this.loadSchools();
            this.loadTeachersStats();
        }
        else if (this.selectedTab === 'allSchools') {
            this.loadSchoolsStats();
        }
    }

    onSchoolSelectChanged(schoolIds: string[]) {
        this.selectedSchoolIds = schoolIds;
        if (this.isStudentMonthTab()) {
            this.loadTeachers();
            this.loadMonthStudentsStats();
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadTeachers();
            this.loadAllStudentsStats();
        }
        else if (this.selectedTab === 'allTeachers') {
            this.loadTeachersStats();
        }
    }

    onTeacherSelectChanged(teacherIds: string[]) {
        this.selectedTeacherIds = teacherIds;
        if (this.isStudentMonthTab()) {
            this.loadMonthStudentsStats();
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        }
    }

    onGradeSelectChanged(grades: number[]) {
        this.selectedGrades = grades;
        if (this.isStudentMonthTab()) {
            this.loadMonthStudentsStats();
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        }
    }

    onLevelSelectChanged(levels: string[]) {
        this.selectedLevels = levels;
        if (this.isStudentMonthTab()) {
            this.loadMonthStudentsStats();
        }
    }

    onExamSelectChanged(examIds: string[]) {
        this.selectedExamIds = examIds;
        this.selectedMonth = `${new Date().getFullYear()}-0`; // Сбрасываем месяц при смене экзамена
        if (this.isStudentMonthTab()) {
            this.loadMonthStudentsStats();

            if (this.selectedExams && this.selectedExams.length > 0) {
                this.developingStudentsLabel$.next(`${this.selectedExams.map(exam => exam.name).join(', ')} üzrə inkişaf edən şagirdlər`);
                this.studentsOfMonthLabel$.next(`${this.selectedExams.map(exam => exam.name).join(', ')} üzrə ayın şagirdləri`);
                this.studentsOfMonthByRepublicLabel$.next(`${this.selectedExams.map(exam => exam.name).join(', ')} üzrə respublika üzrə ayın şagirdləri`);
            }
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        }
    }

    openStudentDetails(studentId: string): void {
        const queryParams = {
            regionIds: this.selectedRegionIds.length > 0 ? this.selectedRegionIds.join(",") : undefined,
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds.join(",") : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds.join(",") : undefined,
            teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds.join(",") : undefined,
            grades: this.selectedGrades.length > 0 ? this.selectedGrades.join(",") : undefined,
            examIds: this.selectedExamIds.length > 0 ? this.selectedExamIds.join(',') : undefined,
            search: this.searchString || undefined,
            month: this.selectedMonth,
            source: 'stats',
            tab: this.selectedTab,
            sortActive: this.sortActive,
            sortDirection: this.sortDirection,
            pageSize: this.pageSize,
            studentsPageSize: this.studentsPageSize,
            pageIndex: this.pageIndex
        };

        this.router.navigate(['/students', studentId], { queryParams });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.isloading = true;

        if (this.selectedTab === 'allStudents') {
            this.studentsPageSize = event.pageSize;
            this.loadAllStudentsStats();
        }
        else if (this.selectedTab === 'allTeachers') {
            this.pageSize = event.pageSize;
            this.loadTeachersStats();
        }
        else if (this.selectedTab === 'allSchools') {
            this.pageSize = event.pageSize;
            this.loadSchoolsStats();
        }
    }

    onSortChange(sortState: Sort): void {
        this.pageIndex = 0; // Сбрасываем страницу

        this.sortDirection = sortState.direction;
        this.sortActive = sortState.active;
        if (sortState.direction) {
            if (this.isStudentMonthTab()) {
                this.loadMonthStudentsStats();
                // if (this.stats.developingStudents && this.stats.developingStudents.length > 0) {
                //     const key = this.sortActive as keyof Student;
                //     console.log('Sorting developingStudents by key:', key, 'Direction:', this.sortDirection);
                //     this.stats.developingStudents = this.stats.developingStudents.sort((a, b) => {
                //         if (a.studentData && b.studentData) {
                //             if (this.sortDirection === 'asc') {
                //                 return a.studentData[key]! > b.studentData[key]! ? 1 : -1;
                //             } else if (this.sortDirection === 'desc') {
                //                 return a.studentData[key]! < b.studentData[key]! ? 1 : -1;
                //             }
                //         }
                //     return 0;
                //     });
                // }
            }
            else if (this.selectedTab === 'allStudents') {
                this.loadAllStudentsStats();
            }
            else if (this.selectedTab === 'allTeachers') {

                this.loadTeachersStats();
            }
            else if (this.selectedTab === 'allSchools') {
                this.loadSchoolsStats();
            }
            else if (this.selectedTab === 'allDistricts') {
                this.loadDistrictsStats();
            }
            else if (this.selectedTab === 'allRegions') {
                this.loadRegionsStats();
            }
        } else {
            if (this.selectedTab === 'allStudents') {
                this.loadAllStudentsStats();
            }
            else if (this.selectedTab === 'allTeachers') {
                this.loadTeachersStats();
            }
            else if (this.selectedTab === 'allSchools') {
                this.loadSchoolsStats();
            }
            else if (this.selectedTab === 'allDistricts') {
                this.loadDistrictsStats();
            }
            else if (this.selectedTab === 'allRegions') {
                this.loadRegionsStats();
            }
        }
    }

    onSearchChange(searchString: string) {
        this.pageIndex = 0; // Сбрасываем страницу
        this.searchString = searchString;
        if (this.isStudentMonthTab()) {
            this.loadMonthStudentsStats();
        } else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        } else if (this.selectedTab === 'allTeachers') {
            this.loadTeachersStats();
        } else if (this.selectedTab === 'allSchools') {
            this.loadSchoolsStats();
        } else if (this.selectedTab === 'allDistricts') {
            this.loadDistrictsStats();
        } else if (this.selectedTab === 'allRegions') {
            this.loadRegionsStats();
        }
    }

    exportToExcel(tableName: 'developingStudents' | 'studentsOfMonth' | 'studentsOfMonthByRepublic' | 'allStudents' | 'allTeachers' | 'allSchools' | 'allDistricts' | 'allRegions' | string) {
        const workbook = XLSX.utils.book_new();
        let sheetName: string = '';
        let result: XLSX.WorkSheet = {};

        switch (tableName) {
            case 'developingStudents': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatStudentData(this.stats.developingStudents || [], this.developingStudentColumns));
                sheetName = `İE şagirdlər (${this.selectedMonth})`;
                break;
            }
            case 'studentsOfMonth': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatStudentData(this.stats.studentsOfMonth || [], this.monthStudentColumns));
                sheetName = `AŞ (${this.selectedMonth})`;
                break;
            }
            case 'studentsOfMonthByRepublic': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatStudentData(this.stats.studentsOfMonthByRepublic || [], this.monthStudentColumns));
                sheetName = `AŞ respublika üzrə (${this.selectedMonth})`;
                break;
            }
            case 'allStudents': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatAllStudentData(this.stats.students || [], this.studentColumns));
                sheetName = 'İlin şagirdləri';
                break;
            }
            case 'allTeachers': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatTeacherData(this.stats.teachers || [], this.teacherColumns));
                sheetName = 'İlin müəllimləri';
                break;
            }
            case 'allSchools': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatSchoolData(this.stats.schools || [], this.schoolColumns));
                sheetName = 'İlin məktəbləri';
                break;
            }
            case 'allDistricts': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatDistrictData(this.stats.districts || [], this.districtColumns));
                sheetName = 'İlin rayonları / şəhərləri';
                break;
            }
            case 'allRegions': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatRegionData(this.stats.regions || [], this.regionColumns));
                sheetName = 'İlin regional idarələri';
                break;
            }
        }

        this.excelService.formatHeaders(result);
        XLSX.utils.book_append_sheet(workbook, result, sheetName);
        XLSX.writeFile(workbook, `${sheetName}.xlsx`);
    }

    selectTab(index: number): void {
        this.selectedTabIndex = index;
        const tabKey = this.tabs[index].key;
        this.onTabChange({ index, tab: { textLabel: this.tabs[index].label } });
    }

    getTabClasses(index: number): string {
        const baseClasses = 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none cursor-pointer transition-colors';

        if (index === this.selectedTabIndex) {
            return `${baseClasses} border-blue-500 text-blue-600`;
        } else {
            return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
        }
    }

    // Navigation between stats tabs with filtering
    onRegionRowClick(regionId: string): void {
        // Save current state to history before navigating
        this.navigationHistory.push({
            tabIndex: this.selectedTabIndex,
            regionIds: [...this.selectedRegionIds],
            districtIds: [...this.selectedDistrictIds],
            schoolIds: [...this.selectedSchoolIds],
            teacherIds: [...this.selectedTeacherIds]
        });

        // Navigate to Districts Year tab (index 6) with region filter
        this.selectedRegionIds = [regionId];
        this.selectedDistrictIds = [];
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.loadDistricts();
        this.selectTab(6); // Districts Year tab
    }

    onDistrictRowClick(districtId: string): void {
        // Save current state to history before navigating
        this.navigationHistory.push({
            tabIndex: this.selectedTabIndex,
            regionIds: [...this.selectedRegionIds],
            districtIds: [...this.selectedDistrictIds],
            schoolIds: [...this.selectedSchoolIds],
            teacherIds: [...this.selectedTeacherIds]
        });

        // Navigate to Schools Year tab (index 5) with district filter
        this.selectedDistrictIds = [districtId];
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.selectTab(5); // Schools Year tab
    }

    onSchoolRowClick(schoolId: string): void {
        // Save current state to history before navigating
        this.navigationHistory.push({
            tabIndex: this.selectedTabIndex,
            regionIds: [...this.selectedRegionIds],
            districtIds: [...this.selectedDistrictIds],
            schoolIds: [...this.selectedSchoolIds],
            teacherIds: [...this.selectedTeacherIds]
        });

        // Navigate to Teachers Year tab (index 4) with school filter
        this.selectedSchoolIds = [schoolId];
        this.selectedTeacherIds = [];
        this.selectTab(4); // Teachers Year tab
    }

    onTeacherRowClick(teacherId: string): void {
        // Save current state to history before navigating
        this.navigationHistory.push({
            tabIndex: this.selectedTabIndex,
            regionIds: [...this.selectedRegionIds],
            districtIds: [...this.selectedDistrictIds],
            schoolIds: [...this.selectedSchoolIds],
            teacherIds: [...this.selectedTeacherIds]
        });

        // Navigate to Students Year tab (index 3) with teacher filter
        this.selectedTeacherIds = [teacherId];
        this.selectTab(3); // Students Year tab
    }

    // Check if we can navigate back
    canGoBack(): boolean {
        return this.navigationHistory.length > 0;
    }

    // Navigate back to previous tab with restored filters
    goBack(): void {
        if (this.navigationHistory.length === 0) {
            return;
        }

        const previousState = this.navigationHistory.pop()!;

        // Restore filter state
        this.selectedRegionIds = previousState.regionIds;
        this.selectedDistrictIds = previousState.districtIds;
        this.selectedSchoolIds = previousState.schoolIds;
        this.selectedTeacherIds = previousState.teacherIds;
        this.loadDistricts();

        // Navigate to previous tab
        this.selectTab(previousState.tabIndex);
    }

    ngOnDestroy(): void {
        console.log('StatsComponent destroyed - stopping all requests');
        // Можно добавить отписку от активных подписок если нужно
    }
}
