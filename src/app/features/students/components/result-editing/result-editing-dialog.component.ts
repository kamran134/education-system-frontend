import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExamResult } from '../../../../core/models/examResult.model';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';

@Component({
    selector: 'app-result-editing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent
    ],
    templateUrl: './result-editing-dialog.component.html',
    styleUrl: './result-editing-dialog.component.scss'
})
export class ResultEditingDialogComponent {
    editedResult: Partial<ExamResult>;

    constructor(
        public dialogRef: MatDialogRef<ResultEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { result: ExamResult }
    ) {
        // Create a copy of the result for editing
        this.editedResult = {
            disciplines: { ...data.result.disciplines },
            participationScore: data.result.participationScore,
            developmentScore: data.result.developmentScore,
            studentOfTheMonthScore: data.result.studentOfTheMonthScore,
            republicWideStudentOfTheMonthScore: data.result.republicWideStudentOfTheMonthScore
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
            this.editedResult.disciplines &&
            this.editedResult.disciplines.az !== undefined &&
            this.editedResult.disciplines.math !== undefined &&
            this.editedResult.disciplines.lifeKnowledge !== undefined &&
            this.editedResult.disciplines.logic !== undefined &&
            this.editedResult.disciplines.english !== undefined
        );
    }

    get modalButtons(): ModalButton[] {
        return [
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
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.isValid) {
            this.dialogRef.close(this.editedResult);
        }
    }
}
