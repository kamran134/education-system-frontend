import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InputComponent } from '../../../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-district-add-dialog',
    standalone: true,
    imports: [CommonModule, InputComponent, ButtonComponent, FormsModule],
    templateUrl: './district-add-dialog.component.html',
    styleUrl: './district-add-dialog.component.scss'
})
export class DistrictAddDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<DistrictAddDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { name: string; code: string; studentCount: number }
    ) {}

    get isValid(): boolean {
        return !!(this.data.name?.trim() && this.data.code?.trim() && this.data.studentCount >= 0);
    }

    onSave(): void {
        if (this.isValid) {
            this.dialogRef.close(this.data);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
