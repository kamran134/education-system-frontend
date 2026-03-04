import { Component, OnInit } from '@angular/core';
import { MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { Exam, ExamData } from '../../../../core/models/exam.model';
import { MatDialog } from '@angular/material/dialog';
import { ExamAddDialogComponent } from '../exam-add-dialog/exam-add-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ExamResultDialogComponent } from '../exam-result-dialog/exam-result-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-exams-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatSnackBarModule,
        MatIconModule,
        MatButtonModule,
        MatPaginator,
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatCardModule
    ],
    templateUrl: './exams-list.component.html',
    styleUrl: './exams-list.component.scss'
})
export class ExamsListComponent implements OnInit {
    constructor(private examService: ExamService, private authService: AuthService, private dialog: MatDialog) {}

    displayedColumns: string[] = ['name', 'code', 'date', 'actions'];

    exams: Exam[] = [];
    totalCount: number = 0;
    pageSize: number = 10;
    pageIndex: number = 0;
    isLoading = false;
    hasError = false;
    errorMessage = '';
    matSnackConfig: MatSnackBarConfig = {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
    }
    selectedDistrictIds: string[] = [];
    incorrectStudentCodes: number[] = [];
    studentsWithoutTeacher: number[] = [];

    ngOnInit(): void {
        this.loadExams();
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    loadExams(): void {
        const params: FilterParams = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            districtIds: this.selectedDistrictIds.join(",")
        };

        this.isLoading = true;
        this.examService.getExams(params)
            .subscribe({
                next: (data: ExamData) => {
                    this.exams = data.data;
                    this.totalCount = data.totalCount;
                    this.isLoading = false;
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = `Error fetching exams: ${err.message}`;
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadExams();
    }

    openAddExamDialog() {
        const dialogRef = this.dialog.open(ExamAddDialogComponent, {
            width: '400px',
            data: { name: '', code: '', date: '' },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Форматируем дату как строку YYYY-MM-DD чтобы избежать смещения timezone
                if (result.date instanceof Date) {
                    const y = result.date.getFullYear();
                    const m = String(result.date.getMonth() + 1).padStart(2, '0');
                    const d = String(result.date.getDate()).padStart(2, '0');
                    result.date = `${y}-${m}-${d}`;
                }
                this.examService.addExam(result).subscribe(() => {
                    this.ngOnInit();
                });
            }
        });
    }

    openExamDetails(exam: Exam) {
        const dialogRef = this.dialog.open(ExamResultDialogComponent, {
            width: '1000px',
            data: { exam: exam },
        });

        dialogRef.afterClosed().subscribe(result => {
            this.incorrectStudentCodes = result.incorrectStudentCodes;
            this.studentsWithoutTeacher = result.studentsWithoutTeacher;
        });
    }

    onExamDelete(event: MouseEvent, exam: Exam) {
        event.stopPropagation();

        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'İmtahanı və onun nəticələrini silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.examService.deleteExam(exam._id).subscribe({
                    next: (data) => {
                        this.loadExams();
                    },
                    error: (error) => {
                        console.error(error);
                    }
                });
            }
        });
    }

    onAllExamsDelete() {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'Bütün imtahanları və onların nəticələrini silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.examService.deleteAllExams().subscribe({
                    next: (data) => {
                        this.loadExams();
                    },
                    error: (error) => {
                        console.error(error);
                    }
                });
            }
        });
    }

    onExportAllResultsJson(): void {
        this.examService.exportResultsAsJson().subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = 'results_all.json';
                anchor.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error: any) => {
                console.error('Export xətası:', error);
            }
        });
    }
}
