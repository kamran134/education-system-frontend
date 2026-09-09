import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ExamTypeService } from '../exam-types/services/exam-type.service';
import { ExamType } from '../../core/models/examType.model';
import { StatsService } from '../stats/services/stats.service';
import { StudentService } from '../students/services/student.service';
import { FilterParams } from '../../core/models/filterParams.model';
import { Student } from '../../core/models/student.model';
import { ResponseHandlerUtil } from '../../core/utils/response-handler.util';
import { ToastService } from '../../shared/components/ui/toast/toast.service';
import { getCurrentAcademicYear, academicYearLabel, FIRST_TRACKED_ACADEMIC_YEAR } from '../../core/utils/academic-year.util';

import { TabsComponent, TabItem } from '../../shared/components/ui/tabs/tabs.component';
import { DataTableComponent, TableColumn, PaginationEvent } from '../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../shared/components/ui/data-table/table-defaults';
import { StudentsYearTabComponent } from '../stats/components/students-year-tab/students-year-tab.component';
import { TeachersYearTabComponent } from '../stats/components/teachers-year-tab/teachers-year-tab.component';
import { SchoolsYearTabComponent } from '../stats/components/schools-year-tab/schools-year-tab.component';
import { DistrictsYearTabComponent } from '../stats/components/districts-year-tab/districts-year-tab.component';
import { RegionsYearTabComponent } from '../stats/components/regions-year-tab/regions-year-tab.component';

/**
 * IMTAHAN_NOVLERI_TASK.md §6 — "Страница рейтингов по типам". Те же четыре номинации, что и
 * на /stats (İnkişaf edən şagirdlər, Ayın şagirdləri, Respublika üzrə ayın şagirdləri,
 * İlin şagirdləri), плюс годовые по учителям/школам/районам/регионам — но с обязательным
 * селектом типа экзамена. /stats и его восемь вкладок (stats.component.ts) НЕ трогаются вообще
 * (§6 ТЗ, "что не трогаем") — это отдельная страница, читающая те же /api/stats/* эндпоинты,
 * которые в шаге 3 получили необязательный examTypeId (default = базовый тип). Базовый тип в
 * селекте этой страницы тоже присутствует — страница универсальная.
 *
 * Три помесячные номинации (İnkişaf/Ayın/Respublika) не поддерживают серверную пагинацию у
 * существующих эндпоинтов (/stats/students/*) — рендерятся целиком, без постраничной разбивки,
 * как и на /stats. Годовые (студенты/учителя/школы/районы/регионы) переиспользуют готовые
 * *-year-tab презентеры из features/stats (чисто презентационные компоненты, без побочной
 * логики) — тот же способ показа, тот же Excel/сортировка/пагинация, что и на /stats.
 */

type TabKey = 'developing' | 'month' | 'monthRepublic' | 'studentsYear' | 'teachersYear' | 'schoolsYear' | 'districtsYear' | 'regionsYear';

const MONTH_TAB_KEYS: TabKey[] = ['developing', 'month', 'monthRepublic'];

const TAB_ITEMS: { key: TabKey; label: string }[] = [
    { key: 'developing', label: 'İnkişaf edən şagirdlər' },
    { key: 'month', label: 'Ayın şagirdləri' },
    { key: 'monthRepublic', label: 'Respublika üzrə ayın şagirdləri' },
    { key: 'studentsYear', label: 'İlin şagirdləri' },
    { key: 'teachersYear', label: 'İlin müəllimləri' },
    { key: 'schoolsYear', label: 'İlin məktəbləri' },
    { key: 'districtsYear', label: 'İlin rayonları' },
    { key: 'regionsYear', label: 'İlin regionları' },
];

const STUDENT_RESULT_COLUMNS: TableColumn[] = [
    { key: 'code', label: 'Şagird kodu', field: 'studentData.code' },
    { key: 'lastName', label: 'Soyadı', field: 'studentData.lastName' },
    { key: 'firstName', label: 'Adı', field: 'studentData.firstName' },
    { key: 'middleName', label: 'Atasının adı', field: 'studentData.middleName' },
    { key: 'grade', label: 'Sinfi' },
    { key: 'teacher', label: 'Müəllimi', field: 'studentData.teacher.fullname', formatter: (v) => v || 'Müəllim tapılmadı' },
    { key: 'school', label: 'Məktəbi', field: 'studentData.school.name', formatter: (v) => v || 'Məktəb tapılmadı' },
    { key: 'district', label: 'Təhsil sektoru', field: 'studentData.district.name', formatter: (v) => v || 'Təhsil sektoru tapılmadı' },
    { key: 'totalScore', label: 'Ümumi bal' },
    { key: 'level', label: 'Pillə' },
    { key: 'score', label: 'Reytinq xalı' },
    { key: 'exam', label: 'İmtahan', field: 'examData.name', formatter: (v) => v || '—' },
];

@Component({
    selector: 'app-type-ratings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TabsComponent,
        DataTableComponent,
        StudentsYearTabComponent,
        TeachersYearTabComponent,
        SchoolsYearTabComponent,
        DistrictsYearTabComponent,
        RegionsYearTabComponent,
    ],
    templateUrl: './type-ratings.component.html',
})
export class TypeRatingsComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    examTypes: ExamType[] = [];
    selectedExamTypeId: number | null = null;

    readonly tabItems: TabItem[] = TAB_ITEMS.map((t) => ({ label: t.label }));
    activeTabIndex = 0;
    get activeTab(): TabKey { return TAB_ITEMS[this.activeTabIndex].key; }
    get isMonthTab(): boolean { return MONTH_TAB_KEYS.includes(this.activeTab); }

    // Помесячные номинации
    month: string = this.defaultMonth();
    monthColumns = STUDENT_RESULT_COLUMNS;
    monthRows: any[] = [];
    isLoadingMonth = false;

    // Годовые номинации
    academicYear: number = getCurrentAcademicYear();
    readonly academicYears: number[] = this.buildAcademicYearOptions();

    students: Student[] = [];
    teachers: any[] = [];
    schools: any[] = [];
    districts: any[] = [];
    regions: any[] = [];
    totalCount = 0;
    pageIndex = 0;
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    sortColumn = 'score';
    sortDirection: 'asc' | 'desc' = 'desc';
    isLoadingYear = false;

    readonly studentsYearColumns = [
        'place', 'districtPlace', 'code', 'lastName', 'firstName', 'middleName',
        'grade', 'teacher', 'school', 'district', 'score', 'averageScore', 'participationCount',
    ];
    readonly teachersYearColumns = ['place', 'districtPlace', 'code', 'fullName', 'school', 'district', 'score', 'averageScore', 'studentCount'];
    readonly schoolsYearColumns = ['place', 'districtPlace', 'code', 'name', 'district', 'score', 'averageScore', 'studentCount'];
    readonly districtsYearColumns = ['place', 'code', 'name', 'score', 'averageScore', 'studentCount'];
    readonly regionsYearColumns = ['place', 'code', 'name', 'score', 'averageScore', 'studentCount', 'districtCount'];

    constructor(
        private examTypeService: ExamTypeService,
        private statsService: StatsService,
        private studentService: StudentService,
        private toastService: ToastService,
    ) {}

    ngOnInit(): void {
        this.examTypeService.getExamTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (types) => {
                this.examTypes = types.filter((t) => t.active);
                const base = this.examTypes.find((t) => t.isBase);
                this.selectedExamTypeId = base?.id ?? this.examTypes[0]?.id ?? null;
                this.reload();
            },
            error: (err: any) => {
                this.toastService.show(err?.error?.message ?? 'İmtahan növləri yüklənərkən xəta baş verdi', 'error');
            },
        });
    }

    private defaultMonth(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    private buildAcademicYearOptions(): number[] {
        const current = getCurrentAcademicYear();
        const years: number[] = [];
        for (let y = current; y >= FIRST_TRACKED_ACADEMIC_YEAR; y--) years.push(y);
        return years;
    }

    readonly academicYearLabel = academicYearLabel;

    onExamTypeChange(): void {
        this.reload();
    }

    onTabChange(index: number): void {
        this.activeTabIndex = index;
        this.pageIndex = 0;
        this.sortColumn = 'score';
        this.sortDirection = 'desc';
        this.reload();
    }

    onMonthChange(): void {
        this.reload();
    }

    onAcademicYearChange(): void {
        this.pageIndex = 0;
        this.reload();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.reload();
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.reload();
    }

    reload(): void {
        if (this.selectedExamTypeId == null) return;
        switch (this.activeTab) {
            case 'developing': return this.loadMonthNomination((p) => this.statsService.getDevelopingStudentsStats(p));
            case 'month': return this.loadMonthNomination((p) => this.statsService.getStudentsOfMonthStats(p));
            case 'monthRepublic': return this.loadMonthNomination((p) => this.statsService.getStudentsOfMonthByRepublicStats(p));
            case 'studentsYear': return this.loadStudentsYear();
            case 'teachersYear': return this.loadEntityYear('teachers');
            case 'schoolsYear': return this.loadEntityYear('schools');
            case 'districtsYear': return this.loadEntityYear('districts');
            case 'regionsYear': return this.loadEntityYear('regions');
        }
    }

    private baseParams(): FilterParams {
        return { examTypeId: this.selectedExamTypeId ?? undefined };
    }

    private loadMonthNomination(call: (params: FilterParams) => import('rxjs').Observable<any[]>): void {
        this.isLoadingMonth = true;
        call({ ...this.baseParams(), month: this.month }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (rows) => {
                this.isLoadingMonth = false;
                this.monthRows = rows || [];
            },
            error: (err: any) => {
                this.isLoadingMonth = false;
                this.monthRows = [];
                if (!(err?.status === 404)) {
                    this.toastService.show(err?.error?.message ?? 'Məlumat yüklənərkən xəta baş verdi', 'error');
                }
            },
        });
    }

    private loadStudentsYear(): void {
        this.isLoadingYear = true;
        const params: FilterParams = {
            ...this.baseParams(),
            page: this.pageIndex + 1,
            size: this.pageSize,
            academicYear: this.academicYear,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
        };
        this.studentService.getStudents(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (response: any) => {
                this.isLoadingYear = false;
                this.students = response?.data ?? [];
                this.totalCount = response?.totalCount ?? 0;
            },
            error: (err: any) => {
                this.isLoadingYear = false;
                this.toastService.show(err?.error?.message ?? 'Şagirdlər yüklənərkən xəta baş verdi', 'error');
            },
        });
    }

    private loadEntityYear(kind: 'teachers' | 'schools' | 'districts' | 'regions'): void {
        this.isLoadingYear = true;
        const params: FilterParams = {
            ...this.baseParams(),
            page: this.pageIndex + 1,
            size: this.pageSize,
            academicYear: this.academicYear,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
        };
        const call = kind === 'teachers' ? this.statsService.getTeachersStats(params)
            : kind === 'schools' ? this.statsService.getSchoolsStats(params)
            : kind === 'districts' ? this.statsService.getDistrictsStats(params)
            : this.statsService.getRegionsStats(params);

        call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (response: any) => {
                this.isLoadingYear = false;
                const statsData = ResponseHandlerUtil.extractPaginatedData<any>(response);
                this[kind] = statsData.data || [];
                this.totalCount = statsData.totalCount || 0;
            },
            error: (err: any) => {
                this.isLoadingYear = false;
                this.toastService.show(err?.error?.message ?? 'Məlumat yüklənərkən xəta baş verdi', 'error');
            },
        });
    }
}
