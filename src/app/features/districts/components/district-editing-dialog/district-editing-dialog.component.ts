import { Component, Inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { District } from '../../../../core/models/district.model';
import { Region } from '../../../../core/models/region.model';
import { RegionService } from '../../../regions/services/region.service';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';

@Component({
    selector: 'app-district-editing-dialog',
    imports: [
    FormsModule,
    InputComponent,
    ModalComponent,
    SelectComponent
],
    templateUrl: './district-editing-dialog.component.html',
    styleUrl: './district-editing-dialog.component.scss'
})
export class DistrictEditingDialogComponent implements OnInit {
    regionOptions: SelectOption[] = [];

    constructor(
        public dialogRef: DialogRef<{ action: 'save' | 'delete', data?: District } | undefined>,
        @Inject(DIALOG_DATA) public data: { district: District, isEditing: boolean, canDelete?: boolean },
        private regionService: RegionService
    ) {}

    ngOnInit(): void {
        this.regionService.getRegionsForFilter().subscribe({
            next: (regions: Region[]) => {
                this.regionOptions = (regions || []).map(r => ({ value: r.id, label: r.name }));
            },
            error: () => { this.regionOptions = []; }
        });
    }

    get modalTitle(): string {
        return this.data.isEditing ? 'Təhsil sektorunun redaktə edilməsi' : 'Yeni təhsil sektoru əlavə et';
    }

    get modalSubtitle(): string {
        return 'Təhsil sektorunun məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.data.district.code &&
            this.data.district.name?.trim() &&
            (this.data.district.studentCount !== undefined && this.data.district.studentCount >= 0) &&
            this.data.district.regionId
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
        if (this.isValid) {
            this.dialogRef.close({ action: 'save', data: this.data.district });
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
