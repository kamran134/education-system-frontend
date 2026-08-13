
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booklet, BookletDistrict } from '../../../../core/models/booklet.model';
import { District } from '../../../../core/models/district.model';
import { DistrictService } from '../../../districts/services/district.service';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';

export interface BookletEditDialogData {
    booklet: Booklet;
    canDelete?: boolean;
}

export interface BookletEditDialogResult {
    action: 'save' | 'delete';
    data?: { name?: string; district?: string | number };
}

@Component({
    selector: 'app-booklet-edit-dialog',
    imports: [FormsModule, InputComponent, ModalComponent],
    templateUrl: './booklet-edit-dialog.component.html'
})
export class BookletEditDialogComponent implements OnInit {
    name: string;
    selectedDistrictId: string | number;
    districts: District[] = [];

    constructor(
        public dialogRef: MatDialogRef<BookletEditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BookletEditDialogData,
        private districtService: DistrictService
    ) {
        this.name = data.booklet.name ?? '';
        const d = data.booklet.district;
        this.selectedDistrictId = d ? (typeof d === 'object' ? (d as BookletDistrict).id : d) : '';
    }

    ngOnInit(): void {
        this.districtService.getDistrictsForFilter().subscribe({
            next: (list) => { this.districts = list; },
            error: () => {}
        });
    }

    get modalButtons(): ModalButton[] {
        const buttons: ModalButton[] = [
            { label: 'Ləğv et', variant: 'outline', action: () => this.dialogRef.close(null) },
            { label: 'Yadda saxla', variant: 'primary', action: () => this.onSave() }
        ];
        if (this.data.canDelete) {
            buttons.splice(1, 0, {
                label: 'Sil', variant: 'danger', action: () => this.onDelete()
            });
        }
        return buttons;
    }

    private onSave(): void {
        const result: BookletEditDialogResult = {
            action: 'save',
            data: {
                name: this.name.trim() || undefined,
                district: this.selectedDistrictId || undefined,
            }
        };
        this.dialogRef.close(result);
    }

    private onDelete(): void {
        this.dialogRef.close({ action: 'delete' } as BookletEditDialogResult);
    }
}
