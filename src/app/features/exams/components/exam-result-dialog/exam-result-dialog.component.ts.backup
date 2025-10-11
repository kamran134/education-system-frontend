import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MomentDateFormatPipe } from '../../../../shared/pipes/moment-date-format.pipe';
import { MatButtonModule } from '@angular/material/button';
import { ExamService } from '../../services/exam.service';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Error } from '../../../../core/models/error.model';

@Component({
    selector: 'app-exam-result-dialog',
    standalone: true,
    imports: [CommonModule, MomentDateFormatPipe, MatDialogModule, MatButtonModule, MatIcon],
    templateUrl: './exam-result-dialog.component.html',
    styleUrl: './exam-result-dialog.component.scss',
})
export class ExamResultDialogComponent implements OnInit {
    file: File | null = null;
    horizontalPosition: MatSnackBarHorizontalPosition = 'center';
    verticalPosition: MatSnackBarVerticalPosition = 'top';
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition
    }
    
    constructor(
        public dialogRef: MatDialogRef<ExamResultDialogComponent>,
        private examService: ExamService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    ngOnInit(): void {
        console.log(this.data);
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.file = input.files[0];
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        if (this.file) {
            this.examService.uploadResults(this.file, this.data.exam._id).subscribe({
                next: (response) => {
                    const { incorrectStudentCodes, studentsWithoutTeacher } = response;
                    this.snackBar.open(response.message || 'Fayl uğurla yükləndi', 'OK', this.matSnackConfig);
                    this.dialogRef.close({ incorrectStudentCodes, studentsWithoutTeacher });
                },
                error: (error: Error) => {
                    this.snackBar.open(`Fayl yüklənərkən xəta baş verdi!\n${error.error.message}`, 'Bağla', this.matSnackConfig);
                }
            });
        }
    }

    onDelete(event: Event): void {
        event.preventDefault();
        this.examService.deleteResults(this.data.exam._id).subscribe({
            next: (response) => {
                this.snackBar.open(response.message || 'Nəticələr uğurla silindi', 'OK', this.matSnackConfig)
            },
            error: (error: Error) => {
                this.snackBar.open(`Nəticələr silinərkən xəta baş verdi!\n${error.error.message}`, 'Bağla', this.matSnackConfig);
            }
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
