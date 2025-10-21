import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { District } from '../../../../core/models/district.model';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';

@Component({
    selector: 'app-district-editing-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ModalComponent
    ],
    templateUrl: './district-editing-dialog.component.html',
    styleUrl: './district-editing-dialog.component.scss'
})
export class DistrictEditingDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<DistrictEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { district: District, isEditing: boolean }
    ) {}

    get modalTitle(): string {
        return this.data.isEditing ? 'Rayonun / şəhərin redaktə edilməsi' : 'Yeni rayon / şəhər əlavə et';
    }

    get modalSubtitle(): string {
        return 'Rayonun və ya şəhərin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.data.district.code &&
            this.data.district.name?.trim() &&
            (this.data.district.studentCount !== undefined && this.data.district.studentCount >= 0)
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

    onSave(): void {
        if (this.isValid) {
            this.dialogRef.close(this.data.district);
        }
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
