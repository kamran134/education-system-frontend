import { Component, Inject, OnInit } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { ExamTypeService } from '../../../exam-types/services/exam-type.service';
import { ExamType } from '../../../../core/models/examType.model';

@Component({
    selector: 'app-exam-add-dialog',
    imports: [
    FormsModule,
    InputComponent,
    ModalComponent,
    SelectComponent
],
    templateUrl: './exam-add-dialog.component.html',
    styleUrl: './exam-add-dialog.component.scss'
})
export class ExamAddDialogComponent implements OnInit {
    examTypeOptions: SelectOption[] = [];

    constructor(
        public dialogRef: DialogRef<{ name: string; code: string, date: any, examTypeId: number | null } | undefined>,
        @Inject(DIALOG_DATA) public data: { name: string; code: string, date: any, examTypeId: number | null },
        private examTypeService: ExamTypeService
    ) {
        // Преобразуем date в строку для input type="date"
        if (this.data.date && this.data.date instanceof Date) {
            this.data.date = this.data.date.toISOString().split('T')[0];
        } else if (!this.data.date) {
            this.data.date = '';
        }
    }

    ngOnInit(): void {
        this.examTypeService.getExamTypes().subscribe({
            next: (types: ExamType[]) => {
                this.examTypeOptions = (types || []).map(t => ({ value: t.id, label: t.nameAz }));
            },
            error: () => { this.examTypeOptions = []; }
        });
    }

    get isValid(): boolean {
        return !!(this.data.name?.trim() && this.data.code?.trim() && this.data.date && !!this.data.examTypeId);
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
