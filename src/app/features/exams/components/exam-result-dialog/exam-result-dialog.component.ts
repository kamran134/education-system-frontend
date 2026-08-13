import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MomentDateFormatPipe } from '../../../../shared/pipes/moment-date-format.pipe';
import { ExamService } from '../../services/exam.service';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

import { Error } from '../../../../core/models/error.model';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { LucideAngularModule, Upload, Save, Trash2 } from 'lucide-angular';
import { FileUploadErrorsDialogComponent, FileUploadErrorsData } from '../../../../shared/components/file-upload-errors-dialog/file-upload-errors-dialog.component';

@Component({
    selector: 'app-exam-result-dialog',
    imports: [MomentDateFormatPipe, ModalComponent, ButtonComponent, LucideAngularModule],
    templateUrl: './exam-result-dialog.component.html',
    styleUrls: ['./exam-result-dialog.component.scss']
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

    readonly Upload = Upload;
    readonly Save = Save;
    readonly Trash2 = Trash2;

    constructor(
        public dialogRef: MatDialogRef<ExamResultDialogComponent>,
        private examService: ExamService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    get modalButtons(): ModalButton[] {
        return [
            {
                label: 'Bağla',
                variant: 'outline',
                action: () => this.onClose()
            }
        ];
    }

    get fileName(): string {
        return this.file?.name || '';
    }

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
            this.examService.uploadResults(this.file, this.data.exam.id).subscribe({
                next: (response) => {
                    const validationErrors = response.validationErrors || {};

                    // Check if there are any validation errors
                    const hasErrors =
                        (validationErrors.incorrectStudentCodes && validationErrors.incorrectStudentCodes.length > 0) ||
                        (validationErrors.studentsWithoutTeacher && validationErrors.studentsWithoutTeacher.length > 0) ||
                        (validationErrors.studentsWithIncorrectResults && validationErrors.studentsWithIncorrectResults.length > 0);

                    if (hasErrors) {
                        // Show error dialog
                        const dialogData: FileUploadErrorsData = {
                            type: 'studentResults',
                            errors: validationErrors
                        };

                        const errorsDialogRef = this.dialog.open(FileUploadErrorsDialogComponent, {
                            width: '700px',
                            maxWidth: '90vw',
                            data: dialogData,
                            disableClose: true
                        });

                        // Close main dialog only after errors dialog is closed
                        errorsDialogRef.afterClosed().subscribe(() => {
                            this.dialogRef.close({ hasErrors: true });
                        });
                    } else if (!response.processedData || response.processedData.length === 0) {
                        // No errors but nothing was saved either
                        this.snackBar.open('Yüklənəcək etibarlı məlumat tapılmadı. Faylı yoxlayın.', 'Bağla', this.matSnackConfig);
                        this.dialogRef.close({ hasErrors: true });
                    } else {
                        // No errors, show success message with count and close immediately
                        this.snackBar.open(`${response.processedData.length} şagirdin nəticəsi uğurla yükləndi`, 'OK', this.matSnackConfig);
                        this.dialogRef.close({ hasErrors: false });
                    }
                },
                error: (error: Error) => {
                    this.snackBar.open(`Fayl yüklənərkən xəta baş verdi!\n${error.error.message}`, 'Bağla', this.matSnackConfig);
                }
            });
        }
    }

    onDelete(event: Event): void {
        event.preventDefault();
        this.examService.deleteResults(this.data.exam.id).subscribe({
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

    onModalClose(): void {
        this.onClose();
    }
}
