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

    // Данные для фильтров
    districts: District[] = [];
    schools: School[] = [];
    allGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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
            grades: this.selectedGrades.length > 0 ? this.selectedGrades : undefined
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

    onFilterReset(): void {
        this.selectedDistrictIds = [];
        this.selectedSchoolIds = [];
        this.selectedGrades = [];
        this.schools = [];
        this.loadStatistics();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }
}
