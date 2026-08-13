import { Component, Inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Region } from '../../../../core/models/region.model';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';

@Component({
    selector: 'app-region-editing-dialog',
    imports: [
    FormsModule,
    InputComponent,
    ModalComponent
],
    templateUrl: './region-editing-dialog.component.html',
    styleUrl: './region-editing-dialog.component.scss'
})
export class RegionEditingDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<RegionEditingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { region: Partial<Region>, isEditing: boolean, canDelete?: boolean }
    ) {}

    get modalTitle(): string {
        return this.data.isEditing ? 'Regional Təhsil İdarəsinin redaktə edilməsi' : 'Yeni Regional Təhsil İdarəsi əlavə et';
    }

    get modalSubtitle(): string {
        return 'Regional Təhsil İdarəsinin məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.data.region.code &&
            this.data.region.name?.trim()
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
        if (this.isValid) {
            this.dialogRef.close({ action: 'save', data: this.data.region });
        }
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
