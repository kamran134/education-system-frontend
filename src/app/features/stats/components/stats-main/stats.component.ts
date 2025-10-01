import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { StatsService } from '../../services/stats.service';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { Error } from '../../../../core/models/error.model';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationExtras, Params, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { Stats } from '../../../../core/models/stats.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MonthNamePipe } from '../../../../shared/pipes/month-name.pipe';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Exam, ExamResponse } from '../../../../core/models/exam.model';
import { ExamService } from '../../../exams/services/exam.service';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { District, DistrictResponse } from '../../../../core/models/district.model';
import { School, SchoolResponse } from '../../../../core/models/school.model';
import { Teacher, TeacherResponse } from '../../../../core/models/teacher.model';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { SchoolService } from '../../../schools/services/school.service';
import { DistrictService } from '../../../districts/services/district.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../../students/services/student.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { StatsFiltersComponent } from "../stats-filters/stats-filters.component";
import { StatsPagination } from '../../../../core/models/pagination.model';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../../../core/services/excel.service';
import { MomentDateFormatPipe } from '../../../../shared/pipes/moment-date-format.pipe';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { UserSettings } from '../../../../core/models/settings.model';
import { BehaviorSubject } from 'rxjs';
import { StudentsMonthTabComponent } from '../students-month-tab/students-month-tab.component';
import { StudentsYearTabComponent } from '../students-year-tab/students-year-tab.component';
import { TeachersYearTabComponent } from "../teachers-year-tab/teachers-year-tab.component";
import { SchoolsYearTabComponent } from "../schools-year-tab/schools-year-tab.component";
import { DistrictsYearTabComponent } from "../districts-year-tab/districts-year-tab.component";

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [
    MatGridListModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatInputModule,
    MatTabsModule,
    MatSortModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    StatsFiltersComponent,
    StudentsMonthTabComponent,
    StudentsYearTabComponent,
    TeachersYearTabComponent,
    SchoolsYearTabComponent,
    DistrictsYearTabComponent
],
    providers: [MonthNamePipe, MomentDateFormatPipe],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
    @ViewChild('teacherSort') teacherSort!: MatSort;
    @ViewChild('schoolSort') schoolSort!: MatSort;
    @ViewChild('studentSort') studentSort!: MatSort;
    @ViewChild('districtSort') districtSort!: MatSort;
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }
    isloading: boolean = false;
    isUpdating: boolean = false;
    stats: Stats = {
        studentsOfMonth: [],
        studentsOfMonthByRepublic: [],
        developingStudents: [],
        students: [],
        teachers: [],
        schools: [],
        districts: [],
        studentsRating: []
    };
    totalCounts: StatsPagination = {
        studentsTotalCount: 0,
        allStudentsTotalCount: 0,
        allTeachersTotalCount: 0,
        allSchoolsTotalCount: 0,
        allDistrictsTotalCount: 0
    };
    selectedTab: 'students' | 'allStudents' | 'allTeachers' | 'allSchools' | 'allDistricts' = 'students';
    monthStudentColumns: string[] = [];
    studentColumns: string[] = [];
    teacherColumns: string[] = ['code', 'fullName', 'school', 'district', 'studentCount', 'score', 'averageScore', 'place'];
    schoolColumns: string[] = ['code', 'name', 'district', 'studentCount', 'score', 'averageScore', 'place'];
    districtColumns: string[] = ['code', 'name', 'studentCount', 'score', 'averageScore', 'place'];
    developingStudentsLabel$ = new BehaviorSubject<string>('Cari ayda inkişaf edən şagirdlər');
    studentsOfMonthLabel$ = new BehaviorSubject<string>('Cari ayın şagirdləri');
    studentsOfMonthByRepublicLabel$ = new BehaviorSubject<string>('Respublika üzrə cari ayın şagirdləri');

    private readonly availableStudentColumns: string[] = [
        'place', 'code', 'lastName', 'firstName', 'middleName', 'grade', 'teacher', 'school', 'district', 'totalScore', 'averageScore',
    ];
    private readonly availableTeacherColumns: string[] = ['code', 'fullName', 'school', 'district', 'studentCount', 'score', 'averageScore', 'place'];
    private readonly availableSchoolColumns: string[] = ['code', 'name', 'district', 'studentCount', 'score', 'averageScore', 'place'];
    private readonly availableDistrictColumns: string[] = ['code', 'name', 'studentCount', 'score', 'averageScore', 'place'];

    selectedMonth: string = new Date().getFullYear() + '-0'; // Формат: 'MM-YYYY-DD', где MM - месяц, YYYY - год, DD - день
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    selectedExams: Exam[] | undefined = undefined;
    selectedExamIds: string[] = [];
    selectedTabIndex: number = 0;
    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    students: Student[] = [];
    totalCount: number = 0;
    pageSize: number = 100;
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
    sortActive: string = 'averageScore';

    isAdminOrSuperAdmin$ = this.authService.isAdminOrSuperAdmin$;
    authorizedUserRole: string | null = null;

    constructor(
        private authService: AuthService,
        private statsService: StatsService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private studentService: StudentService,
        private examService: ExamService,
        private excelService: ExcelService,
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private monthNamePipe: MonthNamePipe,
        private dashboardService: DashboardService
    ) { }

    ngOnInit(): void {
        this.authService.isLoggedIn$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.authorizedUserRole = this.authService.getRole();
                this.loadSettings();
                this.loadExams();
                this.loadDistricts();
                // Не загружаем школы и учителей сразу, только по необходимости

                this.route.queryParams.subscribe((params: Params) => {
                    this.selectedDistrictIds = params['districtIds'] ? params['districtIds'].split(',') : [];
                    this.selectedSchoolIds = params['schoolIds'] ? params['schoolIds'].split(',') : [];
                    this.selectedTeacherIds = params['teacherIds'] ? params['teacherIds'].split(',') : [];
                    this.selectedGrades = params['grades'] ? params['grades'].split(',').map(Number) : [];
                    this.selectedExamIds = params['examIds'] ? params['examIds'].split(',') : [];
                    this.selectedMonth = params['month'] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                    this.selectedTab = params['tab'] || 'students';
                    this.sortActive = params['sortActive'] || 'averageScore';
                    this.sortDirection = params['sortDirection'] || 'desc';
                    this.pageSize = params['pageSize'] ? +params['pageSize'] : 100;
                    this.studentsPageSize = params['studentsPageSize'] ? +params['studentsPageSize'] : 1000;
                    this.pageIndex = params['pageIndex'] ? +params['pageIndex'] : 0;

                    if (this.selectedTab === 'students') {
                        this.selectedTabIndex = 0;
                        this.loadMonthStudentsStats();
                    } else if (this.selectedTab === 'allStudents') {
                        this.selectedTabIndex = 1;
                        this.loadAllStudentsStats();
                    } else if (this.selectedTab === 'allTeachers') {
                        this.selectedTabIndex = 2;
                        this.loadTeachersStats();
                    } else if (this.selectedTab === 'allSchools') {
                        this.selectedTabIndex = 3;
                        this.loadSchoolsStats();
                    } else if (this.selectedTab === 'allDistricts') {
                        this.selectedTabIndex = 4;
                        this.loadDistrictsStats();
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
        this.dashboardService.getRatingColumns(this.authService.getUserId() || '')
            .subscribe({
                next: (settings: UserSettings) => {
                    this.monthStudentColumns = settings.studentCollumns || this.availableStudentColumns;
                    this.studentColumns = settings.allStudentCollumns || this.availableStudentColumns;
                    this.teacherColumns = settings.allTeacherCollumns || this.availableTeacherColumns;
                    this.schoolColumns = settings.allSchoolCollumns || this.availableSchoolColumns;
                    this.districtColumns = settings.allDistrictCollumns || this.availableDistrictColumns;
                },
                error: (error: Error) => {
                    console.error('Error loading settings:', error);
                }
            });
    }

    loadMonthStudentsStats(): void {
        // Не загружаем, если не на вкладке студентов по месяцам
        if (this.selectedTabIndex !== 0) {
            return;
        }
        
        // Проверяем, что месяц выбран (не равен "YYYY-0") или есть выбранные экзамены
        const monthPart = this.selectedMonth.split('-')[1];
        if (monthPart === '0' && this.selectedExamIds.length === 0) {
            this.snackBar.open('Ay və ya imtahan seçilməyib', 'Bağla', this.matSnackConfig);
            return;
        }

        this.isloading = true;
        // Не очищаем весь объект stats, только обнуляем поля для месячной статистики
        this.stats.studentsOfMonth = [];
        this.stats.studentsOfMonthByRepublic = [];
        this.stats.developingStudents = [];

        const params: FilterParams = {
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            examIds: this.selectedExamIds.join(',') || '',
            month: this.selectedMonth,
        };

        this.statsService.getStudentsStats(params).subscribe({
            next: (response) => {
                this.isloading = false;
                this.stats = { ...ResponseHandlerUtil.extractData<any>(response) };
            },
            error: (error: any) => {
                this.isloading = false;
                // Не показываем ошибку для 404 на stats/students, чтобы избежать спама
                if (error.status !== 404) {
                    this.snackBar.open(error.error?.message || 'Xəta baş verdi', 'Bağla', this.matSnackConfig);
                }
            }
        })
    }

    loadAllStudentsStats(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.studentsPageSize,
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
            examIds: this.selectedExamIds.join(',') || '',
        };
        
        this.isloading = true;
        // Не очищаем весь объект stats, только обнуляем students
        this.stats.students = [];

        this.studentService.getStudents(params).subscribe({
            next: (response) => {
                this.isloading = false;
                const paginatedData = ResponseHandlerUtil.extractPaginatedData<Student>(response);
                this.stats.students = paginatedData.data;
                this.studentsDataSource.data = paginatedData.data;
                this.totalCounts.allStudentsTotalCount = paginatedData.totalCount;
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
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
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
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
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
            sortColumn: this.sortActive || 'averageScore',
            sortDirection: this.sortDirection || 'desc',
            code: this.searchString || undefined,
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


    // Filters

    loadTeachers(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            schoolIds: this.selectedSchoolIds.join(","),
            districtIds: this.selectedDistrictIds.join(","),
            sortColumn: 'fullname',
            sortDirection: 'asc'
        }

        this.teacherService.getTeachersForFilter(params)
            .subscribe({
                next: (response: TeacherResponse) => {
                    const data = ResponseHandlerUtil.extractData<Teacher[]>(response);
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
            districtIds: this.selectedDistrictIds.join(","),
            sortColumn: 'name',
            sortDirection: 'asc',
        }

        this.schoolService.getSchoolsForFilter(params)
            .subscribe({
                next: (response: SchoolResponse) => {
                    const data = ResponseHandlerUtil.extractData<School[]>(response);
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

    updateMonth(month: string) {
        this.selectedMonth = month;
        this.selectedExams = [];
        this.selectedExamIds = [];
        this.loadMonthStudentsStats();
        this.developingStudentsLabel$.next(`${this.monthNamePipe.transform(month)} ayında inkişaf edən şagirdlər`);
        this.studentsOfMonthLabel$.next(`${this.monthNamePipe.transform(month)} ayında ayın şagirdləri`);
        this.studentsOfMonthByRepublicLabel$.next(`${this.monthNamePipe.transform(month)} ayında respublika üzrə ayın şagirdləri`);
    }

    onTabChange(event: any): void {
        this.isloading = true;

        if (event.index === 0) {
            this.selectedTab = 'students';
            // Для месячной статистики загружаем школы и учителей для фильтров
            this.loadSchools();
            this.loadTeachers();
            this.loadMonthStudentsStats();
        } else if (event.index === 1) {
            this.selectedTab = 'allStudents';
            // Для годовой статистики студентов тоже нужны фильтры
            this.loadSchools();
            this.loadTeachers();
            this.loadAllStudentsStats();
        } else if (event.index === 2) {
            this.selectedTab = 'allTeachers';
            // Для учителей нужны школы для фильтров
            this.loadSchools();
            this.loadTeachersStats();
        } else if (event.index === 3) {
            this.selectedTab = 'allSchools'
            this.loadSchoolsStats();
        } else if (event.index === 4) {
            this.selectedTab = 'allDistricts'
            this.loadDistrictsStats();
        }
    }

    onDistrictSelectChanged(districtIds: string[]) {
        this.selectedDistrictIds = districtIds;
        if (this.selectedTab === 'students') {
            this.loadSchools();
            this.loadTeachers();
            this.loadMonthStudentsStats();
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
        if (this.selectedTab === 'students') {
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
        if (this.selectedTab === 'students') {
            this.loadMonthStudentsStats();
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        }
    }

    onGradeSelectChanged(grades: number[]) {
        this.selectedGrades = grades;
        if (this.selectedTab === 'students') {
            this.loadMonthStudentsStats();
        }
        else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        }
    }

    onExamSelectChanged(examIds: string[]) {
        this.selectedExamIds = examIds;
        this.selectedMonth = `${new Date().getFullYear()}-0`; // Сбрасываем месяц при смене экзамена
        if (this.selectedTab === 'students') {
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
            districtIds: this.selectedDistrictIds.join(","),
            schoolIds: this.selectedSchoolIds.join(","),
            teacherIds: this.selectedTeacherIds.join(","),
            grades: this.selectedGrades.join(","),
            examIds: this.selectedExamIds.length > 0 ? this.selectedExamIds.join(',') : '',
            month: this.selectedMonth,
            source: 'stats',
            tab: this.selectedTab,
            sortActive: this.sortActive,
            sortDirection: this.sortDirection,
            pageSize: this.pageSize,
            studentsPageSize: this.studentsPageSize,
            pageIndex: this.pageIndex
        };

        const navigationExtras: NavigationExtras = {
            queryParams: queryParams,
            replaceUrl: true
        };

        this.router.navigate(['/students', studentId], navigationExtras);
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
            if (this.selectedTab === 'students') {
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
        }
    }

    onSearchChange(searchString: string) {
        this.pageIndex = 0; // Сбрасываем страницу
        this.searchString = searchString;
        if (this.selectedTab === 'students') {
            this.loadMonthStudentsStats();
        } else if (this.selectedTab === 'allStudents') {
            this.loadAllStudentsStats();
        } else if (this.selectedTab === 'allTeachers') {
            this.loadTeachersStats();
        } else if (this.selectedTab === 'allSchools') {
            this.loadSchoolsStats();
        } else if (this.selectedTab === 'allDistricts') {
            this.loadDistrictsStats();
        }
    }

    exportToExcel(tableName: 'developingStudents' | 'studentsOfMonth' | 'studentsOfMonthByRepublic' | 'allStudents' | 'allTeachers' | 'allSchools' | 'allDistricts' | string) {
        const workbook = XLSX.utils.book_new();
        let sheetName: string = '';
        let result: XLSX.WorkSheet = {};

        switch (tableName) {
            case 'developingStudents': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatStudentData(this.stats.developingStudents || []));
                sheetName = `İE şagirdlər (${this.selectedMonth})`;
                break;
            }
            case 'studentsOfMonth': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatStudentData(this.stats.studentsOfMonth || []));
                sheetName = `AŞ (${this.selectedMonth})`;
                break;
            }
            case 'studentsOfMonthByRepublic': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatStudentData(this.stats.studentsOfMonthByRepublic || []));
                sheetName = `AŞ respublika üzrə (${this.selectedMonth})`;
                break;
            }
            case 'allStudents': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatAllStudentData(this.stats.students || []));
                sheetName = 'İlin şagirdləri';
                break;
            }
            case 'allTeachers': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatTeacherData(this.stats.teachers || []));
                sheetName = 'İlin müəllimləri';
                break;
            }
            case 'allSchools': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatSchoolData(this.stats.schools || []));
                sheetName = 'İlin məktəbləri';
                break;
            }
            case 'allDistricts': {
                result = XLSX.utils.json_to_sheet(this.excelService.formatDistrictData(this.stats.districts || []));
                sheetName = 'İlin rayonları / şəhərləri';
                break;
            }
        }

        this.excelService.formatHeaders(result);
        XLSX.utils.book_append_sheet(workbook, result, sheetName);
        XLSX.writeFile(workbook, `${sheetName}.xlsx`);
    }
}
