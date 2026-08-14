import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ModalComponent, ModalButton } from '../../ui/modal/modal.component';

@Component({
    selector: 'app-confirm-dialog',
    imports: [ModalComponent],
    templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
    title: string = '';
    text: string = '';
    confirmText: string = '';
    cancelText: string = '';

    constructor(
        public dialogRef: DialogRef<boolean>,
        @Inject(DIALOG_DATA) public data: { text: string, title: string, confirmText?: string, cancelText?: string }
    ) {
        this.text = data.text;
        this.title = data.title;
        this.confirmText = data.confirmText ?? 'Sil';
        this.cancelText = data.cancelText ?? 'İmtina';
    }

    get modalButtons(): ModalButton[] {
        return [
            { label: this.cancelText, variant: 'outline', action: () => this.onNoClick() },
            { label: this.confirmText, variant: 'danger', action: () => this.onYesClick() }
        ];
    }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(): void {
        this.dialogRef.close(true);
    }
}
