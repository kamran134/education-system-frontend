import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Exam } from '../../../../core/models/exam.model';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';

@Component({
    selector: 'app-exam-editing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent
    ],
    templateUrl: './exam-editing-dialog.component.html',
    styleUrl: './exam-editing-dialog.component.scss'
})
export class ExamEditingDialogComponent {
    editedExam: any;

    constructor(
        public dialogRef: MatDialogRef<ExamEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { exam: Exam, isEditing: boolean, canDelete?: boolean }
    ) {
        // Преобразуем date в строку для отображения
        this.editedExam = { ...this.data.exam };
        if (this.editedExam.date) {
            const date = new Date(this.editedExam.date);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            this.editedExam.dateString = `${day}.${month}.${year}`;
        } else {
            this.editedExam.dateString = '';
        }
    }

    get modalTitle(): string {
        return this.data.isEditing ? 'İmtahanın redaktə edilməsi' : 'Yeni imtahan əlavə et';
    }

    get modalSubtitle(): string {
        return 'İmtahanın məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.editedExam.name?.trim() &&
            this.editedExam.code &&
            this.editedExam.dateString?.trim()
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

        // Добавляем кнопку удаления только при редактировании и если есть права
        if (this.data.isEditing && this.data.canDelete) {
            buttons.splice(1, 0, {
                label: 'Sil',
                variant: 'danger',
                action: () => this.onDelete()
            });
        }

        return buttons;
    }

    onSave(): void {
        // Преобразуем строку даты обратно в Date
        const dateParts = this.editedExam.dateString.split('.');
        if (dateParts.length === 3) {
            const [day, month, year] = dateParts.map((part: string) => parseInt(part, 10));
            this.editedExam.date = new Date(year, month - 1, day);
        }
        
        const examData = {
            name: this.editedExam.name,
            code: this.editedExam.code,
            date: this.editedExam.date
        };
        
        this.dialogRef.close({ action: 'save', data: examData });
    }

    onDelete(): void {
        this.dialogRef.close({ action: 'delete' });
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
