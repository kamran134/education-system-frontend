import { Component, Inject } from '@angular/core';

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideAngularModule, TriangleAlert, XCircle, School, Building2, Info, CheckCircle, UserX, Calculator } from 'lucide-angular';
import { ModalComponent, ModalButton } from '../ui/modal/modal.component';
import { ExcelService, ImportIssueRow } from '../../../core/services/excel.service';

export interface FileUploadErrorsData {
  type: 'teachers' | 'schools' | 'studentResults';
  errors: {
    incorrectTeacherCodes?: number[];
    missingSchoolCodes?: number[];
    teacherCodesWithoutSchoolCodes?: number[];
    existingTeacherCodes?: number[];

    incorrectSchoolCodes?: number[];
    missingDistrictCodes?: number[];
    schoolCodesWithoutDistrictCodes?: number[];
    existingSchoolCodes?: number[];

    incorrectStudentCodes?: number[];
    studentsWithoutTeacher?: number[];
    // row — Excel row number (backend ImportRowIssue); code is null when the code cell itself was bad.
    studentsWithIncorrectResults?: Array<{ row?: number; code: number | null; reason: string }>;
    questionCountWarnings?: Array<{ row: number; code: number; subject: string; count: number; usual: number }>;
  };
  /** Rows that did import — shown so a partial import isn't read as a total failure. */
  processedCount?: number;
  /** Full per-cell report (backend `issues`) — enables the "download as Excel" button. */
  report?: { issues: ImportIssueRow[]; examName: string; fileName: string };
}

@Component({
    selector: 'app-file-upload-errors-dialog',
    imports: [LucideAngularModule, ModalComponent],
    templateUrl: './file-upload-errors-dialog.component.html'
})
export class FileUploadErrorsDialogComponent {
  readonly TriangleAlert = TriangleAlert;
  readonly XCircle = XCircle;
  readonly School = School;
  readonly Building2 = Building2;
  readonly Info = Info;
  readonly CheckCircle = CheckCircle;
  readonly UserX = UserX;
  readonly Calculator = Calculator;

  readonly modalButtons: ModalButton[];

  constructor(
    public dialogRef: DialogRef<void>,
    @Inject(DIALOG_DATA) public data: FileUploadErrorsData,
    private excelService: ExcelService
  ) {
    // The list here is gone after a reload — the Excel report is what the district keeps and works from.
    this.modalButtons = data.report && data.report.issues.length > 0
      ? [
          { label: 'Xətaları Excel-ə yüklə', variant: 'primary', action: () => this.downloadReport() },
          { label: 'Bağla', variant: 'outline', action: () => this.onClose() }
        ]
      : [{ label: 'OK', variant: 'primary', action: () => this.onClose() }];
  }

  downloadReport(): void {
    const report = this.data.report;
    if (!report) return;
    this.excelService.exportImportIssues(report.issues, {
      examName: report.examName,
      fileName: report.fileName,
      processedCount: this.data.processedCount ?? 0
    });
  }

  get hasErrors(): boolean {
    const errors = this.data.errors;
    return !!(
      errors.incorrectTeacherCodes?.length ||
      errors.missingSchoolCodes?.length ||
      errors.teacherCodesWithoutSchoolCodes?.length ||
      errors.existingTeacherCodes?.length ||
      errors.incorrectSchoolCodes?.length ||
      errors.missingDistrictCodes?.length ||
      errors.schoolCodesWithoutDistrictCodes?.length ||
      errors.existingSchoolCodes?.length ||
      errors.incorrectStudentCodes?.length ||
      errors.studentsWithoutTeacher?.length ||
      errors.studentsWithIncorrectResults?.length
    );
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
