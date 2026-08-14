import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ExamResult } from '../../../../core/models/examResult.model';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-result-editing',
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent,
        SelectComponent
    ],
    templateUrl: './result-editing-dialog.component.html',
    styleUrl: './result-editing-dialog.component.scss'
})
export class ResultEditingDialogComponent {
    editedResult: Partial<ExamResult>;
    levelOptions: SelectOption[] = [
        { value: 'Lisey', label: 'Lisey' },
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
        { value: 'C', label: 'C' },
        { value: 'D', label: 'D' },
        { value: 'E', label: 'E' }
    ];
    gradeOptions: SelectOption[] = [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' },
        { value: 6, label: '6' },
        { value: 7, label: '7' },
        { value: 8, label: '8' },
        { value: 9, label: '9' },
        { value: 10, label: '10' },
        { value: 11, label: '11' }
    ];

    constructor(
        public dialogRef: DialogRef<{ action: 'save' | 'delete', data?: any } | undefined>,
        @Inject(DIALOG_DATA) public data: { result: ExamResult, canDelete?: boolean },
        private authService: AuthService
    ) {
        // Create a copy of the result for editing
        this.editedResult = {
            grade: data.result.grade,
            disciplines: data.result.disciplines ? { ...data.result.disciplines } : undefined,
            questionCounts: data.result.questionCounts ? { ...data.result.questionCounts } : undefined,
            level: data.result.level,
            totalScore: data.result.totalScore
        };
    }

    get modalTitle(): string {
        return 'Nəticənin redaktə edilməsi';
    }

    get modalSubtitle(): string {
        return 'İmtahan nəticəsinin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.editedResult.grade &&
            this.editedResult.level &&
            this.editedResult.totalScore !== undefined &&
            this.editedResult.disciplines
        );
    }

    get modalButtons(): ModalButton[] {
        const buttons: ModalButton[] = [
            {
                label: 'Ləğv et',
                variant: 'outline',
                action: () => this.onClose()
            },
            {
                label: 'Yadda saxla',
                variant: 'primary',
                disabled: !this.isValid,
                action: () => this.onSave()
            }
        ];

        if (this.data.canDelete && this.authService.canDeleteStudents()) {
            buttons.splice(1, 0, {
                label: 'Sil',
                variant: 'danger',
                action: () => this.onDelete()
            });
        }

        return buttons;
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.isValid) {
            this.dialogRef.close({ action: 'save', data: this.editedResult });
        }
    }

    onDelete(): void {
        this.dialogRef.close({ action: 'delete' });
    }
}
