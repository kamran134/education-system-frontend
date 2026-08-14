import { Component, Inject } from '@angular/core';

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideAngularModule, TriangleAlert, XCircle, School, Building2, Info, CheckCircle, UserX, Calculator } from 'lucide-angular';
import { ModalComponent, ModalButton } from '../ui/modal/modal.component';

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
    studentsWithIncorrectResults?: Array<{ code: number; reason: string }>;
  };
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

  readonly modalButtons: ModalButton[] = [
    { label: 'OK', variant: 'primary', action: () => this.onClose() }
  ];

  constructor(
    public dialogRef: DialogRef<void>,
    @Inject(DIALOG_DATA) public data: FileUploadErrorsData
  ) {}

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
