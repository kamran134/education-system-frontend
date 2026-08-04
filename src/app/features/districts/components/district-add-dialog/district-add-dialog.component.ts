import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { CommonModule } from '@angular/common';

interface DistrictData {
    id?: string;
    name: string;
    code: string;
    studentCount: number;
}

@Component({
    selector: 'app-district-add-dialog',
    standalone: true,
    imports: [CommonModule, InputComponent, FormsModule, ModalComponent],
    templateUrl: './district-add-dialog.component.html',
    styleUrl: './district-add-dialog.component.scss'
})
export class DistrictAddDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<DistrictAddDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { district: DistrictData; isEditing: boolean }
    ) {}

    get modalTitle(): string {
        return this.data.isEditing ? 'Rayonun / şəhərin redaktə edilməsi' : 'Yeni rayon / şəhər əlavə et';
    }

    get modalSubtitle(): string {
        return 'Rayonun və ya şəhərin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(this.data.district.name?.trim() && this.data.district.code?.trim() && this.data.district.studentCount >= 0);
    }

    get modalButtons(): ModalButton[] {
        return [
            {
                label: 'Ləğv et',
                variant: 'outline',
                action: () => this.onCancel()
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

    onCancel(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onCancel();
    }
}
