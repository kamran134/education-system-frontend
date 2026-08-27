import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StatisticsService } from '../../services/statistics.service';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { StatisticsFilter, StatisticsResponse, InkishafStatistics } from '../../../../core/models/statistics.model';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { SelectComponent } from '../../../../shared/components/ui/form-controls/select/select.component';
import { LucideAngularModule, Filter, ChevronDown, ChevronUp, X } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';

@Component({
    selector: 'app-statistics-main',
    imports: [CommonModule, FormsModule, SelectComponent, LucideAngularModule, FullscreenPanelComponent],
    templateUrl: './statistics-main.component.html',
    styleUrl: './statistics-main.component.scss'
})
export class StatisticsMainComponent implements OnInit {
    readonly Filter = Filter;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;
    readonly X = X;

    private statisticsService = inject(StatisticsService);
    private districtService = inject(DistrictService);
    private schoolService = inject(SchoolService);
    private teacherService = inject(TeacherService);
    private authService = inject(AuthService);
    private route = inject(ActivatedRoute);

    statistics: StatisticsResponse | null = null;
    isLoading = false;
    filtersExpanded = true;
    monthlyTableFullscreen = false;

    // İnkişaf statistikası
    inkishafStatistics: InkishafStatistics | null = null;
    inkishafMinParticipations: number = 2;
    inkishafLoading = false;

    get isAdminUser(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    /**
     * Роли-владельцы (BASE_FIXES_TASK.md §1.3): фильтры district/school/teacher прибиваются
     * к их собственной сущности и блокируются — /statistics открыт им, но только на свою
     * область видимости, не на всю республику. forced*Ids хранятся отдельно от selected*Ids,
     * потому что onFilterReset() должен возвращать именно к ним, а не к пустому фильтру.
     */
    lockDistrictFilter = false;
    lockSchoolFilter = false;
    lockTeacherFilter = false;
    private forcedDistrictIds: string[] = [];
    private forcedSchoolIds: string[] = [];
    private forcedTeacherIds: string[] = [];

    /** У student своей области видимости для /statistics нет (BASE_FIXES_TASK.md §1.2) —
     *  ему сюда попадать не полагается, roleGuard закрывает роут раньше этой проверки. */
    private resolveOwnerScope$(): Observable<void> {
        const role = this.authService.getRole();
        const entityId = this.authService.getCurrentUserValue()?.profile?.entityId;
        if (!entityId) return of(void 0);

        switch (role) {
            case 'districtRepresenter':
                this.lockDistrictFilter = true;
                this.forcedDistrictIds = [String(entityId)];
                return of(void 0);

            // Своего фильтра региона на этой странице нет — регион сводится к списку районов,
            // входящих в него.
            case 'regionRepresenter':
                this.lockDistrictFilter = true;
                return this.districtService.getDistricts({ regionIds: [String(entityId)], page: 1, size: 1000 }).pipe(
                    map((response) => {
                        const data = ResponseHandlerUtil.extractPaginatedData<District>(response);
                        this.forcedDistrictIds = (data.data || []).map((d) => String(d.id));
                    }),
                    catchError(() => of(void 0))
                );

            case 'schoolDirector':
                this.lockDistrictFilter = true;
                this.lockSchoolFilter = true;
                return this.schoolService.getSchoolById(entityId).pipe(
                    map((school: School) => {
                        this.forcedSchoolIds = [String(entityId)];
                        this.forcedDistrictIds = school.district ? [String(school.district.id)] : [];
                    }),
                    catchError(() => of(void 0))
                );

            case 'teacher':
                this.lockDistrictFilter = true;
                this.lockSchoolFilter = true;
                this.lockTeacherFilter = true;
                return this.teacherService.getTeacherById(entityId).pipe(
                    map((teacher: Teacher) => {
                        this.forcedTeacherIds = [String(entityId)];
                        this.forcedSchoolIds = teacher.school ? [String(teacher.school.id)] : [];
                        this.forcedDistrictIds = teacher.district ? [String(teacher.district.id)] : [];
                    }),
                    catchError(() => of(void 0))
                );

            default:
                return of(void 0);
        }
    }

    get inkishafParticipationOptions(): { label: string; value: number }[] {
        const max = this.inkishafStatistics?.maxParticipations ?? 2;
        const upperBound = Math.max(max, this.inkishafMinParticipations);
        return Array.from({ length: upperBound - 1 }, (_, i) => ({
            label: `${i + 2}`,
            value: i + 2
        }));
    }

    // Фильтры
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];
    selectedGrades: number[] = [];
    selectedMonth: number | null = null;
    selectedYear: number = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1;

    // Данные для фильтров
    districts: District[] = [];
    schools: School[] = [];
    // Учитель — только в рамках выбранной школы (backend /teachers/filter фильтрует только по
    // schoolIds, без districtIds), список пуст и select задизейблен, пока школа не выбрана —
    // тот же паттерн каскада, что у districts→schools (PROFILES_V2_TASK.md §4.4).
    teachers: Teacher[] = [];
    allGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    months = [
        { value: 1, label: 'Yanvar' },
        { value: 2, label: 'Fevral' },
        { value: 3, label: 'Mart' },
        { value: 4, label: 'Aprel' },
        { value: 5, label: 'May' },
        { value: 6, label: 'İyun' },
        { value: 7, label: 'İyul' },
        { value: 8, label: 'Avqust' },
        { value: 9, label: 'Sentyabr' },
        { value: 10, label: 'Oktyabr' },
        { value: 11, label: 'Noyabr' },
        { value: 12, label: 'Dekabr' }
    ];

    private readonly currentAcademicYear = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    years = Array.from({ length: 6 }, (_, i) => this.currentAcademicYear - i);

    get availableYears(): number[] {
        return this.isAdminUser ? this.years : [this.currentAcademicYear];
    }

    // Options для select компонентов
    // value как строка, не d.id напрямую: selected*Ids типизированы string[] (как и
    // StatisticsFilter/FilterParams), а queryParams всегда приходят строками — при числовых
    // value SelectComponent.isSelected() делает строгое сравнение (===/Array.includes) и не
    // находит совпадения с предзаполненными строками, чек-лист выглядит пустым, хотя фильтр
    // в запрос уходит верно (PROFILES_V2_TASK.md §4.4, поймано при живой проверке).
    get districtOptions() {
        return this.districts.map(d => ({ label: d.name, value: String(d.id) }));
    }

    get schoolOptions() {
        return this.schools.map(s => ({ label: s.name, value: String(s.id) }));
    }

    get teacherOptions() {
        return this.teachers.map(t => ({ label: t.fullname, value: String(t.id) }));
    }

    get gradeOptions() {
        return this.allGrades.map(g => ({ label: g.toString(), value: g }));
    }

    get monthOptions() {
        return this.months.map(m => ({ label: m.label, value: m.value }));
    }

    get yearOptions() {
        return this.availableYears.map(y => ({ label: `${y}-${y + 1}`, value: y }));
    }

    get inkishafTitle(): string {
        if (this.selectedMonth !== null) {
            const monthName = this.months.find(m => m.value === this.selectedMonth)?.label;
            return `${monthName} ayı üzrə inkişaf statistikası`;
        }
        return 'İnkişaf statistikası';
    }

    get statisticsTitle(): string {
        if (this.selectedMonth !== null) {
            const monthName = this.months.find(m => m.value === this.selectedMonth)?.label;
            return `${monthName} ayı üçün statistika`;
        }
        return 'İllik statistika';
    }

    // Получаем статистику для отображения (годовая или за выбранный месяц)
    get displayedStats() {
        if (!this.statistics) return null;

        if (this.selectedMonth !== null) {
            // Учебный год: месяцы 9-12 принадлежат году начала, 1-8 — году+1
            const calendarYear = this.selectedMonth >= 9 ? this.selectedYear : this.selectedYear + 1;
            const expectedKey = `${calendarYear}-${String(this.selectedMonth).padStart(2, '0')}`;
            return this.statistics.monthly.find(m => m.month === expectedKey) || null;
        }

        // Иначе возвращаем годовую статистику
        return this.statistics.yearly;
    }

    get totalCount(): number {
        if (!this.displayedStats) return 0;
        if (this.selectedMonth !== null) {
            return (this.displayedStats as any).totalResults || 0;
        }
        return (this.displayedStats as any).totalStudents || 0;
    }

    ngOnInit(): void {
        if (!this.isAdminUser) {
            this.inkishafMinParticipations = 3;
            this.selectedYear = this.currentAcademicYear;
        }

        // Ссылка «Ətraflı statistika» с профилей учителя/школы/района (PROFILES_V2_TASK.md §4.4)
        // приходит сюда с district/school/teacherIds в queryParams — раньше эта страница их
        // вообще не читала, фильтр молча терялся и открывалась статистика по всей республике.
        this.applyQueryParamFilters();

        // Область видимости роли-владельца всегда перекрывает queryParams (BASE_FIXES_TASK.md
        // §1.3) — своя сущность и так ровно то, что «Ətraflı statistika» присылает в ссылке,
        // а прямой заход на /statistics без queryParams иначе показал бы всю республику.
        this.resolveOwnerScope$().subscribe(() => {
            if (this.forcedDistrictIds.length > 0) this.selectedDistrictIds = this.forcedDistrictIds;
            if (this.forcedSchoolIds.length > 0) this.selectedSchoolIds = this.forcedSchoolIds;
            if (this.forcedTeacherIds.length > 0) this.selectedTeacherIds = this.forcedTeacherIds;

            this.loadDistricts();
            if (this.selectedDistrictIds.length > 0) {
                this.loadSchools();
            }
            if (this.selectedSchoolIds.length > 0) {
                this.loadTeachers();
            }
            this.loadStatistics();
            this.loadInkishafStatistics();
        });
    }

    private applyQueryParamFilters(): void {
        const params = this.route.snapshot.queryParams;
        if (params['districtIds']) {
            this.selectedDistrictIds = String(params['districtIds']).split(',').filter((id: string) => id.trim() !== '');
        }
        if (params['schoolIds']) {
            this.selectedSchoolIds = String(params['schoolIds']).split(',').filter((id: string) => id.trim() !== '');
        }
        if (params['teacherIds']) {
            this.selectedTeacherIds = String(params['teacherIds']).split(',').filter((id: string) => id.trim() !== '');
        }
        if (params['year'] && this.isAdminUser) {
            const year = parseInt(params['year'], 10);
            if (!isNaN(year)) this.selectedYear = year;
        }
    }

    loadDistricts(): void {
        this.districtService.getDistricts({ page: 1, size: 1000 }).subscribe({
            next: (response) => {
                const data = ResponseHandlerUtil.extractPaginatedData<District>(response);
                this.districts = data.data || [];
            },
            error: (error) => console.error('Error loading districts:', error)
        });
    }

    loadSchools(): void {
        const params: any = { page: 1, size: 10000 };
        if (this.selectedDistrictIds.length > 0) {
            params.districtIds = this.selectedDistrictIds.join(',');
        }

        this.schoolService.getSchools(params).subscribe({
            next: (response) => {
                const data = ResponseHandlerUtil.extractPaginatedData<School>(response);
                this.schools = data.data || [];
            },
            error: (error) => console.error('Error loading schools:', error)
        });
    }

    loadTeachers(): void {
        if (this.selectedSchoolIds.length === 0) {
            this.teachers = [];
            return;
        }

        this.teacherService.getTeachersForFilter({ schoolIds: this.selectedSchoolIds.join(',') })
            .subscribe({
                next: (teachers) => {
                    this.teachers = Array.isArray(teachers) ? teachers : [];
                },
                error: (error) => {
                    this.teachers = [];
                    console.error('Error loading teachers:', error);
                }
            });
    }

    loadStatistics(): void {
        this.isLoading = true;

        const filters: StatisticsFilter = {
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
            teacherIds: this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds : undefined,
            grades: this.selectedGrades.length > 0 ? this.selectedGrades : undefined,
            month: this.selectedMonth !== null ? this.selectedMonth : undefined,
            year: this.selectedYear
        };

        this.statisticsService.getStatistics(filters).subscribe({
            next: (response) => {
                this.statistics = ResponseHandlerUtil.extractData<StatisticsResponse>(response);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading statistics:', error);
                this.isLoading = false;
            }
        });
    }

    loadInkishafStatistics(): void {
        this.inkishafLoading = true;

        this.statisticsService.getInkishafStatistics({
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
            grades: this.selectedGrades.length > 0 ? this.selectedGrades : undefined,
            year: this.selectedYear,
            minParticipations: this.inkishafMinParticipations
        }).subscribe({
            next: (response) => {
                this.inkishafStatistics = ResponseHandlerUtil.extractData<InkishafStatistics>(response);
                this.inkishafLoading = false;
            },
            error: (error) => {
                console.error('Error loading inkishaf statistics:', error);
                this.inkishafLoading = false;
            }
        });
    }

    onInkishafParticipationsChange(): void {
        this.loadInkishafStatistics();
    }

    onDistrictChange(): void {
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.teachers = [];
        this.loadSchools();
        this.loadStatistics();
        this.loadInkishafStatistics();
    }

    onSchoolChange(): void {
        this.selectedTeacherIds = [];
        this.loadTeachers();
        this.loadStatistics();
        this.loadInkishafStatistics();
    }

    /** Inkişaf statistikası (getInkishafStatistics) teacherIds не поддерживает — только
     *  districtIds/schoolIds/grades/year (InkishafFilter, statistics.model.ts). Учитель — самый
     *  узкий фильтр, statistics.service.pg.ts::applyStudentFilters уже AND'ит его со schoolIds. */
    onTeacherChange(): void {
        this.loadStatistics();
    }

    onGradeChange(): void {
        this.loadStatistics();
        this.loadInkishafStatistics();
    }

    onMonthChange(): void {
        this.loadStatistics();
    }

    onMonthReset(): void {
        this.selectedMonth = null;
        this.loadStatistics();
    }

    onYearChange(): void {
        this.loadStatistics();
        this.loadInkishafStatistics();
    }

    onFilterReset(): void {
        // Роль-владелец сбрасывается к своей области видимости, а не к пустому фильтру —
        // иначе задизейбленные district/school/teacher-селекты после сброса показывали бы
        // пустой выбор, а запрос молча ушёл бы по всей республике (BASE_FIXES_TASK.md §1.3).
        this.selectedDistrictIds = [...this.forcedDistrictIds];
        this.selectedSchoolIds = [...this.forcedSchoolIds];
        this.selectedTeacherIds = [...this.forcedTeacherIds];
        this.selectedGrades = [];
        this.selectedMonth = null;
        this.selectedYear = this.currentAcademicYear;
        this.inkishafMinParticipations = 2;
        this.schools = [];
        this.teachers = [];
        if (this.selectedDistrictIds.length > 0) this.loadSchools();
        if (this.selectedSchoolIds.length > 0) this.loadTeachers();
        this.loadStatistics();
        this.loadInkishafStatistics();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }
}
