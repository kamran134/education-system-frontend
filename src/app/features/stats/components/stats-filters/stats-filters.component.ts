import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { District } from '../../../../core/models/district.model';
import { Region } from '../../../../core/models/region.model';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { Exam } from '../../../../core/models/exam.model';
import { MonthNamePipe } from '../../../../shared/pipes/month-name.pipe';
import { getCurrentAcademicYear, academicYearLabel, FIRST_TRACKED_ACADEMIC_YEAR } from '../../../../core/utils/academic-year.util';

import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

// UI Components
import { LucideAngularModule, Search, Filter, ChevronDown, ChevronUp } from 'lucide-angular';
import { SelectComponent } from '../../../../shared/components/ui/form-controls/select/select.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';

@Component({
    selector: 'app-stats-filters',
    templateUrl: './stats-filters.component.html',
    styleUrls: ['./stats-filters.component.scss'],
    imports: [
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    SelectComponent,
    InputComponent
]
})
export class StatsFiltersComponent implements OnInit, OnChanges {
    // Icons
    readonly Search = Search;
    readonly Filter = Filter;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;

    @Input() selectedTab: string = 'developingStudents';
    @Input() regions: Region[] = [];
    @Input() districts: District[] = [];
    @Input() schools: School[] = [];
    @Input() teachers: Teacher[] = [];
    @Input() exams: Exam[] = [];
    @Input() gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    @Input() selectedRegionIds: string[] = [];
    @Input() selectedDistrictIds: string[] = [];
    @Input() selectedSchoolIds: string[] = [];
    @Input() selectedTeacherIds: string[] = [];
    @Input() selectedGrades: number[] = [];
    @Input() selectedLevels: string[] = [];
    @Input() selectedExamIds: string[] | [] = [];
    @Input() selectedMonth: string = new Date().getFullYear() + '-0';

    // Role-based filter visibility — filter is hidden entirely when the role's value
    // is always fixed to a single option (e.g. a teacher can't filter by teacher)
    @Input() hideRegionFilter: boolean = false;
    @Input() hideDistrictFilter: boolean = false;
    @Input() hideSchoolFilter: boolean = false;
    @Input() hideTeacherFilter: boolean = false;
    @Input() hideGradeFilter: boolean = false;
    @Input() hideLevelFilter: boolean = false;
    @Input() hideExamFilter: boolean = false;
    @Input() hideSearchFilter: boolean = false;

    @Output() monthUpdated = new EventEmitter<string>();
    @Output() regionChanged = new EventEmitter<string[]>();
    @Output() districtChanged = new EventEmitter<string[]>();
    @Output() schoolChanged = new EventEmitter<string[]>();
    @Output() teacherChanged = new EventEmitter<string[]>();
    @Output() gradeChanged = new EventEmitter<number[]>();
    @Output() levelChanged = new EventEmitter<string[]>();
    @Output() examChanged = new EventEmitter<string[]>();
    @Output() searchStringChanged = new EventEmitter<string>();
    @Output() academicYearUpdated = new EventEmitter<number>();

    searchString: string = '';
    private searchTerms = new Subject<string>();
    filtersExpanded: boolean = true;

    // Контролы для месяца и года
    monthControl = new FormControl(Number(this.selectedMonth.substring(5))); // 0-11
    yearControl = new FormControl(new Date().getFullYear());

    academicYearControl = new FormControl(Math.max(getCurrentAcademicYear(), FIRST_TRACKED_ACADEMIC_YEAR));
    academicYears: { value: number; label: string }[] = [];
    // examControl = new FormControl<Exam[] | undefined>(undefined);

    months = [
        { value: 0, name: 'Seçin' }, // Добавляем опцию "Выберите"
        { value: 1, name: 'Yanvar' },
        { value: 2, name: 'Fevral' },
        { value: 3, name: 'Mart' },
        { value: 4, name: 'Aprel' },
        { value: 5, name: 'May' },
        { value: 6, name: 'İyun' },
        { value: 7, name: 'İyul' },
        { value: 8, name: 'Avqust' },
        { value: 9, name: 'Sentyabr' },
        { value: 10, name: 'Oktyabr' },
        { value: 11, name: 'Noyabr' },
        { value: 12, name: 'Dekabr' }
    ];
    years: number[] = [];

    // Options for select components
    get monthOptions() {
        return this.months.map(month => ({ label: month.name, value: month.value }));
    }

    get yearOptions() {
        return this.years.map(year => ({ label: year.toString(), value: year }));
    }

    get regionOptions() {
        return (this.regions || []).map(region => ({ label: region.name, value: region.id }));
    }

    get districtOptions() {
        return (this.districts || []).map(district => ({ label: district.name, value: district.id }));
    }

    get schoolOptions() {
        return (this.schools || []).map(school => ({ label: school.name, value: school.id }));
    }

    get teacherOptions() {
        return (this.teachers || []).map(teacher => ({ label: teacher.fullname, value: teacher.id }));
    }

    get gradeOptionsForSelect() {
        return (this.gradesOptions || []).map(grade => ({ label: grade.toString(), value: grade }));
    }

    get examOptions() {
        return (this.exams || []).map(exam => ({ label: exam.name, value: exam.id }));
    }

    readonly levelOptions = [
        { label: 'E', value: 'E' },
        { label: 'D', value: 'D' },
        { label: 'C', value: 'C' },
        { label: 'B', value: 'B' },
        { label: 'A', value: 'A' },
        { label: 'Lisey', value: 'Lisey' }
    ];

    private destroyRef = inject(DestroyRef);

    constructor() {
        this.setupSearch();
        this.setupMonthYearChange();
        this.setupYears();
        this.setupAcademicYears();
    }

    ngOnInit() {
        // Component initialized
    }

    ngOnChanges(changes: SimpleChanges) {
        // Trigger change detection when input data changes
        if (changes['regions'] || changes['districts'] || changes['schools'] || changes['teachers'] || changes['exams']) {
            // Data has been updated, component will re-render
        }
    }

    setupYears() {
        const currentYear = new Date().getFullYear();
        for (let i: number = currentYear - 5; i <= currentYear + 5; i++) {
            this.years.push(i);
        }
    }

    setupAcademicYears() {
        const current = Math.max(getCurrentAcademicYear(), FIRST_TRACKED_ACADEMIC_YEAR);
        // от новейшего к старому: свежий год — первый в списке, он же значение по умолчанию
        for (let y = current; y >= FIRST_TRACKED_ACADEMIC_YEAR; y--) {
            this.academicYears.push({ value: y, label: academicYearLabel(y) });
        }
        this.academicYearControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(year => {
                if (year != null) {
                    this.academicYearUpdated.emit(year);
                }
            });
    }

    get academicYearOptions() {
        return this.academicYears;
    }

    setupMonthYearChange() {
        // Эмитим YYYY-MM при изменении месяца или года
        this.monthControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emitMonthYear());
        this.yearControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emitMonthYear());
        // Эмитим начальное значение
        this.emitMonthYear();
    }

    emitMonthYear() {
        const month = this.monthControl.value as number;
        const year = this.yearControl.value;

        if (month != null && year != null) {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            this.monthUpdated.emit(monthStr);
        }
    }



    onExamSelectChanged(examIds?: string[]) {
        if (examIds !== undefined) {
            this.selectedExamIds = examIds;
        }
        this.examChanged.emit(this.selectedExamIds);
    }

    onRegionSelectChanged(regionIds?: string[]) {
        if (regionIds !== undefined) {
            this.selectedRegionIds = regionIds;
        }
        this.regionChanged.emit(this.selectedRegionIds);
    }

    onDistrictSelectChanged(districtIds?: string[]) {
        if (districtIds !== undefined) {
            this.selectedDistrictIds = districtIds;
        }
        this.districtChanged.emit(this.selectedDistrictIds);
    }

    onSchoolSelectChanged(schoolIds?: string[]) {
        if (schoolIds !== undefined) {
            this.selectedSchoolIds = schoolIds;
        }
        this.schoolChanged.emit(this.selectedSchoolIds);
    }

    onTeacherSelectChanged(teacherIds?: string[]) {
        if (teacherIds !== undefined) {
            this.selectedTeacherIds = teacherIds;
        }
        this.teacherChanged.emit(this.selectedTeacherIds);
    }

    onGradeSelectChanged(grades?: number[]) {
        if (grades !== undefined) {
            this.selectedGrades = grades;
        }
        this.gradeChanged.emit(this.selectedGrades);
    }

    onLevelSelectChanged(levels?: string[]) {
        if (levels !== undefined) {
            this.selectedLevels = levels;
        }
        this.levelChanged.emit(this.selectedLevels);
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    onSearchChange(): void {
        console.log(this.searchString);
        this.searchTerms.next(this.searchString);
    }

    setupSearch(): void {
        this.searchTerms.pipe(
            debounceTime(300), // Задержка 300 мс
            distinctUntilChanged(), // Игнорировать повторяющиеся значения
            takeUntilDestroyed(this.destroyRef),
            switchMap((term: string) => {
                if (term.trim().length >= 3) {
                    this.searchStringChanged.emit(term);
                }
                else {
                    this.searchStringChanged.emit('');
                }
                return term;
            })
        ).subscribe({
            next: () => {
                console.log('Success');
            },
            error: (error) => {
                console.error('Error in search:', error);
            },
            complete: () => {
                console.log('Search completed');
            }
        });
    }
}
