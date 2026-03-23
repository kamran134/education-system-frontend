import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService } from '../../services/statistics.service';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { StatisticsFilter, StatisticsResponse } from '../../../../core/models/statistics.model';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { SelectComponent } from '../../../../shared/components/ui/form-controls/select/select.component';
import { LucideAngularModule, Filter, ChevronDown, ChevronUp } from 'lucide-angular';

@Component({
    selector: 'app-statistics-main',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectComponent, LucideAngularModule],
    templateUrl: './statistics-main.component.html',
    styleUrl: './statistics-main.component.scss'
})
export class StatisticsMainComponent implements OnInit {
    readonly Filter = Filter;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;

    private statisticsService = inject(StatisticsService);
    private districtService = inject(DistrictService);
    private schoolService = inject(SchoolService);

    statistics: StatisticsResponse | null = null;
    isLoading = false;
    filtersExpanded = true;

    // Фильтры
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedGrades: number[] = [];
    selectedMonth: number | null = null;
    selectedYear: number = new Date().getFullYear();

    // Данные для фильтров
    districts: District[] = [];
    schools: School[] = [];
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

    years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    // Options для select компонентов
    get districtOptions() {
        return this.districts.map(d => ({ label: d.name, value: d._id }));
    }

    get schoolOptions() {
        return this.schools.map(s => ({ label: s.name, value: s._id }));
    }

    get gradeOptions() {
        return this.allGrades.map(g => ({ label: g.toString(), value: g }));
    }

    get monthOptions() {
        return this.months.map(m => ({ label: m.label, value: m.value }));
    }

    get yearOptions() {
        return this.years.map(y => ({ label: y.toString(), value: y }));
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

    get averageScore(): number {
        if (!this.displayedStats || this.selectedMonth !== null) return 0;
        return (this.displayedStats as any).averageScore || 0;
    }

    ngOnInit(): void {
        this.loadDistricts();
        this.loadStatistics();
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

    loadStatistics(): void {
        this.isLoading = true;

        const filters: StatisticsFilter = {
            districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
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

    onDistrictChange(): void {
        this.selectedSchoolIds = [];
        this.loadSchools();
        this.loadStatistics();
    }

    onSchoolChange(): void {
        this.loadStatistics();
    }

    onGradeChange(): void {
        this.loadStatistics();
    }

    onMonthChange(): void {
        this.loadStatistics();
    }

    onYearChange(): void {
        this.loadStatistics();
    }

    onFilterReset(): void {
        this.selectedDistrictIds = [];
        this.selectedSchoolIds = [];
        this.selectedGrades = [];
        this.selectedMonth = null;
        this.selectedYear = new Date().getFullYear();
        this.schools = [];
        this.loadStatistics();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }
}
