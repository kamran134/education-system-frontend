import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { Subject, SubjectInput } from '../../../../core/models/subject.model';

export interface SubjectEditingDialogData {
    subject?: Subject;
    isEditing: boolean;
}

/**
 * Форма добавления/редактирования одного предмета справочника (IMTAHAN_NOVLERI_TASK.md §6,
 * features/exam-types/). code редактируется только при создании — это PK
 * (exam_type_section_subjects.subject_code ссылается на него), менять код существующего
 * предмета нечем не защищено на бэке, поэтому на фронте его просто не даём трогать.
 */
@Component({
    selector: 'app-subject-editing-dialog',
    imports: [FormsModule, InputComponent, ModalComponent],
    templateUrl: './subject-editing-dialog.component.html',
    styleUrl: './subject-editing-dialog.component.scss'
})
export class SubjectEditingDialogComponent {
    model: { code: string; nameAz: string; sortOrder: number; active: boolean };

    constructor(
        public dialogRef: DialogRef<SubjectInput | undefined>,
        @Inject(DIALOG_DATA) public data: SubjectEditingDialogData
    ) {
        this.model = {
            code: data.subject?.code ?? '',
            nameAz: data.subject?.nameAz ?? '',
            sortOrder: data.subject?.sortOrder ?? 0,
            active: data.subject?.active ?? true
        };
    }

    get modalTitle(): string {
        return this.data.isEditing ? 'Fənnin redaktə edilməsi' : 'Yeni fənn';
    }

    get isValid(): boolean {
        return !!(this.model.code?.trim() && this.model.nameAz?.trim());
    }

    get modalButtons(): ModalButton[] {
        return [
            { label: 'Ləğv et', variant: 'outline', action: () => this.onClose() },
            { label: 'Yadda saxla', variant: 'primary', disabled: !this.isValid, action: () => this.onSave() }
        ];
    }

    onSave(): void {
        if (!this.isValid) return;
        this.dialogRef.close({
            code: this.model.code.trim(),
            nameAz: this.model.nameAz.trim(),
            sortOrder: this.model.sortOrder,
            active: this.model.active
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
