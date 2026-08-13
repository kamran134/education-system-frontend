import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './file-upload-errors-dialog.component.html',
    styleUrls: ['./file-upload-errors-dialog.component.scss']
})
export class FileUploadErrorsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FileUploadErrorsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileUploadErrorsData
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
