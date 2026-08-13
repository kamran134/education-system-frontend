import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirm-dialog',
    imports: [MatDialogModule, MatButtonModule,],
    templateUrl: './confirm-dialog.component.html',
    styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
    title: string = '';
    text: string = '';
    confirmText: string = '';
    cancelText: string = '';

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { text: string, title: string, confirmText?: string, cancelText?: string }
    ) {
        this.text = data.text;
        this.title = data.title;
        this.confirmText = data.confirmText ?? 'Sil';
        this.cancelText = data.cancelText ?? 'İmtina';
    }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(): void {
        this.dialogRef.close(true);
    }
}
