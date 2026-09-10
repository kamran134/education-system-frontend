import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef, Dialog } from '@angular/cdk/dialog';
import { MomentDateFormatPipe } from '../../../../shared/pipes/moment-date-format.pipe';
import { ExamService } from '../../services/exam.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';

import { Error } from '../../../../core/models/error.model';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { LucideAngularModule, Upload, Save, Trash2, FileDown } from 'lucide-angular';
import { FileUploadErrorsDialogComponent, FileUploadErrorsData } from '../../../../shared/components/file-upload-errors-dialog/file-upload-errors-dialog.component';

@Component({
    selector: 'app-exam-result-dialog',
    imports: [FormsModule, MomentDateFormatPipe, ModalComponent, ButtonComponent, SelectComponent, LucideAngularModule],
    templateUrl: './exam-result-dialog.component.html',
    styleUrls: ['./exam-result-dialog.component.scss']
})
export class ExamResultDialogComponent implements OnInit {
    file: File | null = null;

    readonly Upload = Upload;
    readonly Save = Save;
    readonly Trash2 = Trash2;
    readonly FileDown = FileDown;

    // IMTAHAN_NOVLERI_TASK.md §7: şablon GET /exams/:id/results-template.xlsx?grade=N sinfə görə
    // toplanır (bölmənin fənlərinə görə), ona görə endirmədən əvvəl sinif seçilir.
    readonly gradeOptions: SelectOption[] = Array.from({ length: 11 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }));
    templateGrade = 1;
    downloadingTemplate = false;

    constructor(
        public dialogRef: DialogRef<{ hasErrors: boolean } | undefined>,
        private examService: ExamService,
        private toastService: ToastService,
        private dialog: Dialog,
        @Inject(DIALOG_DATA) public data: any) {}

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

                        const errorsDialogRef = this.dialog.open<any>(FileUploadErrorsDialogComponent, {
                            width: '700px',
                            maxWidth: '90vw',
                            data: dialogData,
                            disableClose: true
                        });

                        // Close main dialog only after errors dialog is closed
                        errorsDialogRef.closed.subscribe(() => {
                            this.dialogRef.close({ hasErrors: true });
                        });
                    } else if (!response.processedData || response.processedData.length === 0) {
                        // No errors but nothing was saved either
                        this.toastService.show('Yüklənəcək etibarlı məlumat tapılmadı. Faylı yoxlayın.', 'warning');
                        this.dialogRef.close({ hasErrors: true });
                    } else {
                        // No errors, show success message with count and close immediately
                        this.toastService.show(`${response.processedData.length} şagirdin nəticəsi uğurla yükləndi`, 'success');
                        this.dialogRef.close({ hasErrors: false });
                    }
                },
                error: (error: Error) => {
                    this.toastService.show(`Fayl yüklənərkən xəta baş verdi!\n${error.error.message}`, 'error');
                }
            });
        }
    }

    /** "Şablonu yüklə" — GET /exams/:id/results-template.xlsx?grade=N (IMTAHAN_NOVLERI_TASK.md §7).
     *  Формат шаблона собирается сервером из набора предметов секции, в которую попадает
     *  выбранный класс, — если секция не настроена, бэк вернёт понятную ошибку на аз. */
    onDownloadTemplate(): void {
        if (this.downloadingTemplate) return;
        this.downloadingTemplate = true;
        this.examService.downloadResultsTemplate(this.data.exam.id, this.templateGrade).subscribe({
            next: (blob) => {
                this.downloadingTemplate = false;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `netice-sablonu-${this.data.exam.id}-sinif-${this.templateGrade}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (error: any) => {
                this.downloadingTemplate = false;
                // responseType: 'blob' — HttpClient JSON-xəta gövdəsini parse etmir, error.error
                // burada Blob-dur, mətn deyil. Server mesajını oxumaq üçün onu ayrıca oxumaq lazımdır.
                if (error?.error instanceof Blob) {
                    error.error.text().then((text: string) => {
                        try {
                            const parsed = JSON.parse(text);
                            this.toastService.show(parsed?.message || 'Şablon yüklənərkən xəta baş verdi', 'error');
                        } catch {
                            this.toastService.show('Şablon yüklənərkən xəta baş verdi', 'error');
                        }
                    });
                } else {
                    this.toastService.show('Şablon yüklənərkən xəta baş verdi', 'error');
                }
            }
        });
    }

    onDelete(event: Event): void {
        event.preventDefault();
        this.examService.deleteResults(this.data.exam.id).subscribe({
            next: (response) => {
                this.toastService.show(response.message || 'Nəticələr uğurla silindi', 'success')
            },
            error: (error: Error) => {
                this.toastService.show(`Nəticələr silinərkən xəta baş verdi!\n${error.error.message}`, 'error');
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
