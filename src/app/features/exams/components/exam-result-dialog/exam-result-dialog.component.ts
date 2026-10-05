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
import { LucideAngularModule, Upload, Save, Trash2, FileDown, Loader2 } from 'lucide-angular';
import { FileUploadErrorsDialogComponent, FileUploadErrorsData } from '../../../../shared/components/file-upload-errors-dialog/file-upload-errors-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { ExamTypeService } from '../../../exam-types/services/exam-type.service';
import { ExamType, ExamTypeSection } from '../../../../core/models/examType.model';
import { ExamResultsService } from '../../../exam-results/services/exam-results.service';
import { saveBlobResponse, blobErrorMessage } from '../../../../core/utils/blob-download.util';
import { ImportIssueRow } from '../../../../core/services/excel.service';

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
    readonly Loader2 = Loader2;

    // The template is per section of the exam's type (one file = one section, audit decision Р2),
    // so the admin picks a section, not a bare grade 1-11.
    examType: ExamType | null = null;
    sectionOptions: SelectOption[] = [];
    templateSectionId: number | null = null;
    /** Results already loaded for this exam; null until known. */
    existingResultsCount: number | null = null;
    downloadingTemplate = false;
    // A large import takes a while; without this a second click starts a parallel import of the same file.
    uploading = false;
    deleting = false;

    constructor(
        public dialogRef: DialogRef<{ hasErrors: boolean } | undefined>,
        private examService: ExamService,
        private toastService: ToastService,
        private dialog: Dialog,
        private examTypeService: ExamTypeService,
        private examResultsService: ExamResultsService,
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
        this.examTypeService.getExamTypes().subscribe({
            next: (types) => {
                this.examType = (types || []).find(t => t.id === this.data.exam.examTypeId) ?? null;
                const sections = this.examType?.sections ?? [];
                this.sectionOptions = sections.map(s => ({
                    value: s.id,
                    label: `${s.nameAz} (${s.gradeFrom}-${s.gradeTo})`,
                    disabled: s.subjects.length === 0
                }));
                this.templateSectionId = sections.find(s => s.subjects.length > 0)?.id ?? null;
            },
            error: () => { this.examType = null; }
        });
        this.loadExistingResultsCount();
    }

    get selectedSection(): ExamTypeSection | null {
        return this.examType?.sections.find(s => s.id === this.templateSectionId) ?? null;
    }

    private loadExistingResultsCount(): void {
        this.examResultsService.getExamResults({ examIds: String(this.data.exam.id), page: 1, size: 1 }).subscribe({
            next: (res) => { this.existingResultsCount = res?.totalCount || 0; },
            error: () => { this.existingResultsCount = null; }
        });
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.file = input.files[0];
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        if (this.file && !this.uploading) {
            this.uploading = true;
            const uploadedFileName = this.file.name;
            this.examService.uploadResults(this.file, this.data.exam.id).subscribe({
                next: (response) => {
                    this.uploading = false;
                    // The Postgres backend returns these lists at the top level of `data`
                    // (studentResult.service.pg.ts::processStudentResultsFromExcel); the old Mongo
                    // one nested them under `validationErrors`, which is why errors went unseen.
                    const validationErrors: FileUploadErrorsData['errors'] = {
                        incorrectStudentCodes: response.incorrectStudentCodes || [],
                        studentsWithoutTeacher: response.studentsWithoutTeacher || [],
                        studentsWithIncorrectResults: response.studentsWithIncorrectResults || [],
                        questionCountWarnings: response.questionCountWarnings || []
                    };
                    // processedCount since the batched import (audit group 2); processedData kept as a
                    // fallback for an older backend still being deployed.
                    const processedCount: number = response.processedCount ?? response.processedData?.length ?? 0;
                    const sectionSuffix = response.sectionName ? ` (${response.sectionName})` : '';

                    const hasErrors =
                        validationErrors.incorrectStudentCodes!.length > 0 ||
                        validationErrors.studentsWithoutTeacher!.length > 0 ||
                        validationErrors.studentsWithIncorrectResults!.length > 0;
                    const hasWarnings = validationErrors.questionCountWarnings!.length > 0;

                    if (hasErrors || hasWarnings) {
                        const dialogData: FileUploadErrorsData = {
                            type: 'studentResults',
                            errors: validationErrors,
                            processedCount,
                            report: {
                                issues: response.issues ?? this.issuesFromLegacyLists(validationErrors),
                                examName: this.data.exam.name,
                                fileName: uploadedFileName
                            }
                        };

                        const errorsDialogRef = this.dialog.open<any>(FileUploadErrorsDialogComponent, {
                            width: '700px',
                            maxWidth: '90vw',
                            data: dialogData,
                            disableClose: true
                        });

                        // Close main dialog only after errors dialog is closed
                        errorsDialogRef.closed.subscribe(() => {
                            this.dialogRef.close({ hasErrors });
                        });
                    } else if (processedCount === 0) {
                        // No errors but nothing was saved either
                        this.toastService.show('Yüklənəcək etibarlı məlumat tapılmadı. Faylı yoxlayın.', 'warning');
                        this.dialogRef.close({ hasErrors: true });
                    } else {
                        // No errors, show success message with count and close immediately
                        this.toastService.show(`${processedCount} şagirdin nəticəsi uğurla yükləndi${sectionSuffix}`, 'success');
                        this.dialogRef.close({ hasErrors: false });
                    }
                },
                error: (error: Error) => {
                    this.uploading = false;
                    this.toastService.show(`Fayl yüklənərkən xəta baş verdi!\n${error?.error?.message || ''}`, 'error');
                }
            });
        }
    }

    /** Report lines from the per-kind lists, for a backend that doesn't send `issues` yet (rollout window). */
    private issuesFromLegacyLists(errors: FileUploadErrorsData['errors']): ImportIssueRow[] {
        const base = { column: null, columnName: null, fullname: null, value: null };
        return [
            ...(errors.studentsWithIncorrectResults || []).map(e => ({ ...base, row: e.row ?? 0, code: e.code, kind: 'Sətir', message: e.reason, severity: 'error' as const })),
            ...(errors.incorrectStudentCodes || []).map(code => ({ ...base, row: 0, code, kind: 'Şagird kodu', message: 'Şagird kodu 10 rəqəmli olmalıdır', severity: 'error' as const })),
            ...(errors.studentsWithoutTeacher || []).map(code => ({ ...base, row: 0, code, kind: 'Layihə müəllimi', message: 'Layihə müəllimi tapılmadı — nəticə yüklənmədi', severity: 'error' as const })),
            ...(errors.questionCountWarnings || []).map(w => ({ ...base, row: w.row, code: w.code, kind: 'Sual sayı', message: `${w.subject}: sual sayı ${w.count}, faylda adətən ${w.usual}`, severity: 'warning' as const })),
        ];
    }

    /** "Şablonu yüklə" — GET /exams/:id/results-template.xlsx?grade=N (IMTAHAN_NOVLERI_TASK.md §7).
     *  Формат шаблона собирается сервером из набора предметов секции, в которую попадает
     *  выбранный класс, — если секция не настроена, бэк вернёт понятную ошибку на аз. */
    onDownloadTemplate(): void {
        const section = this.selectedSection;
        if (this.downloadingTemplate || !section) return;
        this.downloadingTemplate = true;
        // The exam route resolves the section by grade — any grade of the section will do.
        this.examService.downloadResultsTemplate(this.data.exam.id, section.gradeFrom).subscribe({
            next: (response) => {
                this.downloadingTemplate = false;
                saveBlobResponse(response, `netice-sablonu-${this.data.exam.id}-${section.id}.xlsx`);
            },
            error: async (error: any) => {
                this.downloadingTemplate = false;
                this.toastService.show(await blobErrorMessage(error, 'Şablon yüklənərkən xəta baş verdi'), 'error');
            }
        });
    }

    onDelete(event: Event): void {
        event.preventDefault();
        if (this.deleting) return;

        // cdk ConfirmDialogComponent, not ConfirmDialogService: the service's overlay is z-[300]
        // and would render underneath this cdk dialog (cdk overlay container is z-index 1000).
        const confirmRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
            width: '450px',
            data: {
                title: 'Nəticələri sil',
                text: `"${this.data.exam.name}" imtahanının BÜTÜN nəticələri silinəcək. Bu əməliyyat geri qaytarıla bilməz. Davam edilsin?`
            }
        });

        confirmRef.closed.subscribe((confirmed) => {
            if (!confirmed) return;
            this.deleting = true;
            this.examService.deleteResults(this.data.exam.id).subscribe({
                next: (response) => {
                    this.deleting = false;
                    const count = response?.deletedCount;
                    this.toastService.show(count ? `${count} nəticə silindi` : 'Nəticələr uğurla silindi', 'success');
                    this.existingResultsCount = 0;
                },
                error: (error: Error) => {
                    this.deleting = false;
                    this.toastService.show(`Nəticələr silinərkən xəta baş verdi!\n${error?.error?.message || ''}`, 'error');
                }
            });
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
