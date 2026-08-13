import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';

@Component({
    selector: 'app-exam-add-dialog',
    imports: [
    FormsModule,
    InputComponent,
    ModalComponent
],
    templateUrl: './exam-add-dialog.component.html',
    styleUrl: './exam-add-dialog.component.scss'
})
export class ExamAddDialogComponent {
    
    constructor(
        public dialogRef: MatDialogRef<ExamAddDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { name: string; code: string, date: any }
    ) {
        // Преобразуем date в строку для input type="date"
        if (this.data.date && this.data.date instanceof Date) {
            this.data.date = this.data.date.toISOString().split('T')[0];
        } else if (!this.data.date) {
            this.data.date = '';
        }
    }

    get isValid(): boolean {
        return !!(this.data.name?.trim() && this.data.code?.trim() && this.data.date);
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

    onSave(): void {
        // Преобразуем строку обратно в Date при сохранении
        const dateParts = this.data.date.split('.');
        if (dateParts.length === 3) {
            const [day, month, year] = dateParts.map((part: string) => parseInt(part, 10));
            this.data.date = new Date(year, month - 1, day);
        }
        this.dialogRef.close(this.data);
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
