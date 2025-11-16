import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Core models and services
import { Exam, ExamResponse } from '../../../../core/models/exam.model';
import { FilterParams } from '../../../../core/models/filterParams.model';

// Services
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';

// UI Components
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

// Dialogs
import { ExamAddDialogComponent } from '../exam-add-dialog/exam-add-dialog.component';
import { ExamResultDialogComponent } from '../exam-result-dialog/exam-result-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-exams-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent
    ],
    templateUrl: './exams-list.component.html',
    styleUrls: ['./exams-list.component.scss']
})
export class ExamsListComponent implements OnInit {
    // Data
    exams: Exam[] = [];
    
    // State
    isLoading = false;
    hasError = false;
    errorMessage = '';
    
    // Pagination
    totalCount = 0;
    pageSize = 25;
    pageIndex = 0;
    
    // Filters
    searchString: string = '';
    selectedYear: number | null = null;
    selectedMonth: number | null = null;
    
    // Filter options
    availableYears: number[] = [];
    availableMonths = [
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
    
    // UI State
    filtersExpanded = false;
    
    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'code', label: 'İmtahan kodu', sortable: true, type: 'text' },
        { key: 'name', label: 'İmtahan adı', sortable: true, type: 'text' },
        { key: 'date', label: 'İmtahan tarixi', sortable: true, type: 'date' }
    ];
    
    tableActions: TableAction[] = [
        {
            key: 'view',
            label: 'Nəticələri yüklə',
            icon: Calendar,
            variant: 'primary'
        }
    ];
    
    actionButtons: ActionButton[] = [];
    
    // Icons
    readonly Plus = Plus;
    readonly RefreshCw = RefreshCw;
    readonly Calendar = Calendar;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;
    
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    };

    constructor(
        private examService: ExamService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();
        this.generateYearOptions();
        this.loadExams();
    }

    private setupActionButtons(): void {
        this.actionButtons = [];
        
        if (this.authService.canCreateExams()) {
            this.actionButtons.push({
                label: 'Yeni imtahan',
                icon: this.Plus,
                action: () => this.openAddExamDialog(),
                variant: 'primary'
            });
        }
        
        if (this.authService.canDeleteExams() && this.isAdminOrSuperAdmin()) {
            this.actionButtons.push({
                label: 'Bütün imtahanları sil',
                icon: this.Trash2,
                action: () => this.onAllExamsDelete(),
                variant: 'secondary'
            });
        }
    }

    private generateYearOptions(): void {
        const currentYear = new Date().getFullYear();
        this.availableYears = [];
        for (let year = currentYear - 5; year <= currentYear + 1; year++) {
            this.availableYears.push(year);
        }
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    getMonthName(monthValue: number | null): string {
        if (!monthValue) return '';
        const month = this.availableMonths.find(m => m.value === monthValue);
        return month ? month.label : '';
    }

    onFilterChange(filterData: any): void {
        console.log('Filter change triggered:', filterData);
        
        // Handle search filter
        if (filterData.search !== undefined) {
            this.searchString = filterData.search || '';
            console.log('Search updated:', this.searchString);
        }

        // Handle year filter
        if (filterData.year !== undefined) {
            this.selectedYear = filterData.year || null;
            console.log('Year updated:', this.selectedYear);
        }

        // Handle month filter
        if (filterData.month !== undefined) {
            this.selectedMonth = filterData.month || null;
            console.log('Month updated:', this.selectedMonth);
        }

        // Reset pagination and reload data
        this.pageIndex = 0;
        console.log('Loading exams with filters:', {
            search: this.searchString,
            year: this.selectedYear,
            month: this.selectedMonth
        });
        this.loadExams();
    }

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'view':
                this.openExamDetails(event.item);
                break;
        }
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadExams();
    }

    loadExams(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize
        };

        // Добавляем параметры только если они не пустые
        if (this.searchString && this.searchString.trim() !== '') {
            params.search = this.searchString.trim();
        }

        if (this.selectedYear) {
            params.year = this.selectedYear.toString();
        }

        if (this.selectedMonth) {
            params.month = this.selectedMonth.toString();
        }

        this.isLoading = true;
        this.examService.getExams(params).subscribe({
            next: (response: ExamResponse) => {
                this.exams = response.data;
                this.totalCount = response.totalCount;
                this.isLoading = false;
                this.hasError = false; // Сбрасываем флаг ошибки при успешной загрузке
            },
            error: (err: any) => {
                console.error('Error loading exams:', err);
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `Error fetching exams: ${err.message || 'Неизвестная ошибка'}`;
            }
        });
    }

    openAddExamDialog(): void {
        const dialogRef = this.dialog.open(ExamAddDialogComponent, {
            width: '600px',
            data: { name: '', code: '', date: '' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.examService.addExam(result).subscribe({
                    next: () => {
                        this.snackBar.open('İmtahan uğurla əlavə edildi', 'OK', this.matSnackConfig);
                        this.loadExams();
                    },
                    error: (err: any) => {
                        this.snackBar.open('İmtahan əlavə edilməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    openExamDetails(exam: Exam): void {
        const dialogRef = this.dialog.open(ExamResultDialogComponent, {
            width: '1200px',
            data: { exam: exam }
        });

        dialogRef.afterClosed().subscribe(result => {
            // Handle any results from the dialog if needed
        });
    }

    onExamDelete(exam: Exam): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'İmtahanı sil',
                message: 'Bu imtahanı və onun bütün nəticələrini silmək istədiyinizə əminsinizmi?'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.examService.deleteExam(exam._id).subscribe({
                    next: () => {
                        this.snackBar.open('İmtahan uğurla silindi', 'OK', this.matSnackConfig);
                        this.loadExams();
                    },
                    error: (err: any) => {
                        this.snackBar.open('İmtahan silinməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }

    onAllExamsDelete(): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Bütün imtahanları sil',
                message: 'Bütün imtahanları və onların nəticələrini silmək istədiyinizə əminsinizmi? Bu əməliyyat geri qaytarıla bilməz!'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.examService.deleteAllExams().subscribe({
                    next: () => {
                        this.snackBar.open('Bütün imtahanlar uğurla silindi', 'OK', this.matSnackConfig);
                        this.loadExams();
                    },
                    error: (err: any) => {
                        this.snackBar.open('İmtahanlar silinməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            }
        });
    }
}