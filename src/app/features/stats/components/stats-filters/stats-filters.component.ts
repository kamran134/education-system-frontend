import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { Exam } from '../../../../core/models/exam.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MonthNamePipe } from '../../../../shared/pipes/month-name.pipe';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSortModule } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { MonthYearPipe } from '../../../../shared/pipes/month-year.pipe';

@Component({
    selector: 'app-stats-filters',
    templateUrl: './stats-filters.component.html',
    styleUrls: ['./stats-filters.component.scss'],
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
        FormsModule
    ],
})
export class StatsFiltersComponent {
    @Input() selectedTab: string = 'students';
    @Input() districts: District[] = [];
    @Input() schools: School[] = [];
    @Input() teachers: Teacher[] = [];
    @Input() exams: Exam[] = [];
    @Input() gradesOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    // @Input() monthControl = new FormControl(new Date());
    @Input() selectedDistrictIds: string[] = [];
    @Input() selectedSchoolIds: string[] = [];
    @Input() selectedTeacherIds: string[] = [];
    @Input() selectedGrades: number[] = [];
    @Input() selectedExamId: string = '';

    @Output() monthUpdated = new EventEmitter<string>();
    @Output() districtChanged = new EventEmitter<string[]>();
    @Output() schoolChanged = new EventEmitter<string[]>();
    @Output() teacherChanged = new EventEmitter<string[]>();
    @Output() gradeChanged = new EventEmitter<number[]>();
    @Output() examChanged = new EventEmitter<string>();
    @Output() searchStringChanged = new EventEmitter<string>();

    searchString: string = '';
    private searchTerms = new Subject<string>();

    // Контролы для месяца и года
    monthControl = new FormControl(new Date().getMonth()); // 0-11
    yearControl = new FormControl(new Date().getFullYear());

    months = [
        { value: 0, name: 'Yanvar' },
        { value: 1, name: 'Fevral' },
        { value: 2, name: 'Mart' },
        { value: 3, name: 'Aprel' },
        { value: 4, name: 'May' },
        { value: 5, name: 'İyun' },
        { value: 6, name: 'İyul' },
        { value: 7, name: 'Avqust' },
        { value: 8, name: 'Sentyabr' },
        { value: 9, name: 'Oktyabr' },
        { value: 10, name: 'Noyabr' },
        { value: 11, name: 'Dekabr' }
    ];
    years: number[] = [];

    constructor() {
        this.setupSearch();
        this.setupMonthYearChange();
        this.setupYears();
    }

    setupYears() {
        const currentYear = new Date().getFullYear();
        for (let i: number = currentYear - 5; i <= currentYear + 5; i++) {
            this.years.push(i);
        }
    }

    setupMonthYearChange() {
        // Эмитим YYYY-MM при изменении месяца или года
        this.monthControl.valueChanges.subscribe(() => this.emitMonthYear());
        this.yearControl.valueChanges.subscribe(() => this.emitMonthYear());
        // Эмитим начальное значение
        this.emitMonthYear();
    }

    emitMonthYear() {
        const month = this.monthControl.value as number - 1;
        const year = this.yearControl.value;

        console.log('Month:', month, 'Year:', year);
        if (month != null && year != null) {
            const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
            console.log('Emitting month:', monthStr);
            this.monthUpdated.emit(monthStr);
        }
    }

    openDatepicker(datepicker: MatDatepicker<Date>) {
        datepicker.open();
    }

    onDistrictSelectChanged() {
        this.districtChanged.emit(this.selectedDistrictIds);
    }

    onSchoolSelectChanged() {
        this.schoolChanged.emit(this.selectedSchoolIds);
    }

    onTeacherSelectChanged() {
        this.teacherChanged.emit(this.selectedTeacherIds);
    }

    onGradeSelectChanged() {
        this.gradeChanged.emit(this.selectedGrades);
    }

    onExamSelectChanged() {
        this.examChanged.emit(this.selectedExamId);
    }

    onSearchChange(): void {
        console.log(this.searchString);
        this.searchTerms.next(this.searchString);
    }

    setupSearch(): void {
        this.searchTerms.pipe(
            debounceTime(300), // Задержка 300 мс
            distinctUntilChanged(), // Игнорировать повторяющиеся значения
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