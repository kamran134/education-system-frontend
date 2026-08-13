import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../../../shared/constants/snack-bar.config';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Core models and services
import { Exam, ExamResponse } from '../../../../core/models/exam.model';
import { FilterParams } from '../../../../core/models/filterParams.model';

// Services
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';

// UI Components
import { LucideAngularModule, Plus, RefreshCw, Edit, Trash2, Calendar, ChevronDown, ChevronUp, BookOpen } from 'lucide-angular';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';

// Dialogs
import { ExamAddDialogComponent } from '../exam-add-dialog/exam-add-dialog.component';
import { ExamEditingDialogComponent } from '../exam-editing-dialog/exam-editing-dialog.component';
import { ExamResultDialogComponent } from '../exam-result-dialog/exam-result-dialog.component';
import { BookletUploadDialogComponent } from '../booklet-upload-dialog/booklet-upload-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-exams-list',
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
export class ExamsListComponent implements OnInit, OnDestroy {
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

    // Sorting
    sortColumn = 'date';
    sortDirection: 'asc' | 'desc' = 'desc';

    // Filters
    searchString: string = '';
    selectedYear: number | null = null;
    selectedMonth: number | null = null;

    // Search debounce
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

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
            key: 'edit',
            label: 'Redaktə et',
            icon: Edit,
            variant: 'outline',
            condition: () => this.authService.canEditExams()
        },
        {
            key: 'view',
            label: 'Nəticələri yüklə',
            icon: Calendar,
            variant: 'primary'
        },
        {
            key: 'booklet-upload',
            label: 'Cavabları yüklə',
            icon: BookOpen,
            variant: 'secondary'
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
    readonly BookOpen = BookOpen;

    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    constructor(
        private examService: ExamService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();
        this.generateYearOptions();
        this.setupSearchDebounce();

        // Trigger initial load through search subject if search exists, otherwise direct load
        if (this.searchString) {
            this.searchSubject.next(this.searchString);
        } else {
            this.loadExams();
        }
    }

    private setupSearchDebounce(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(searchTerm => {
            this.searchString = searchTerm;
            this.pageIndex = 0;
            this.loadExams();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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

        // if (this.authService.canDeleteExams() && this.isAdminOrSuperAdmin()) {
        //     this.actionButtons.push({
        //         label: 'Bütün imtahanları sil',
        //         icon: this.Trash2,
        //         action: () => this.onAllExamsDelete(),
        //         variant: 'secondary'
        //     });
        // }
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

    get canEditExams(): boolean {
        return this.authService.canEditExams();
    }

    get canDeleteExams(): boolean {
        return this.authService.canDeleteExams();
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
        // Handle search filter
        if (filterData.search !== undefined) {
            // Emit to subject instead of directly loading
            this.searchSubject.next(filterData.search || '');
            return; // Don't call loadExams, let the debounce handle it
        }

        // Handle year filter
        if (filterData.year !== undefined) {
            this.selectedYear = filterData.year || null;
        }

        // Handle month filter
        if (filterData.month !== undefined) {
            this.selectedMonth = filterData.month || null;
        }

        // Reset pagination and reload data
        this.pageIndex = 0;
        this.loadExams();
    }

    onTableAction(event: { action: string; item: any }): void {
        switch (event.action) {
            case 'edit':
                this.onEditExam(event.item);
                break;
            case 'view':
                this.openExamDetails(event.item);
                break;
            case 'booklet-upload':
                this.openBookletUploadDialog(event.item);
                break;
        }
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadExams();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0; // Reset to first page when sorting
        this.loadExams();
    }

    loadExams(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
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
                // Форматируем дату как строку YYYY-MM-DD чтобы избежать смещения timezone
                if (result.date instanceof Date) {
                    const y = result.date.getFullYear();
                    const m = String(result.date.getMonth() + 1).padStart(2, '0');
                    const d = String(result.date.getDate()).padStart(2, '0');
                    result.date = `${y}-${m}-${d}`;
                }
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

    openBookletUploadDialog(exam: Exam): void {
        this.dialog.open(BookletUploadDialogComponent, {
            width: '700px',
            data: { exam },
        });
    }

    onEditExam(exam: Exam): void {
        const dialogRef = this.dialog.open(ExamEditingDialogComponent, {
            width: '600px',
            disableClose: false,
            data: {
                exam: { ...exam },
                isEditing: true,
                canDelete: this.canDeleteExams
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.action === 'save') {
                this.examService.updateExam(exam.id, result.data).subscribe({
                    next: () => {
                        this.snackBar.open('İmtahan uğurla redaktə edildi', 'OK', this.matSnackConfig);
                        this.loadExams();
                    },
                    error: (err: any) => {
                        this.snackBar.open('İmtahan redaktə edilməsində xəta baş verdi', 'Bağla', this.matSnackConfig);
                    }
                });
            } else if (result?.action === 'delete') {
                this.onExamDelete(exam);
            }
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
                this.examService.deleteExam(exam.id).subscribe({
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
