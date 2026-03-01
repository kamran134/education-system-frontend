import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { LucideAngularModule, Upload, Save } from 'lucide-angular';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { MomentDateFormatPipe } from '../../../../shared/pipes/moment-date-format.pipe';
import { BookletService } from '../../services/booklet.service';
import { Exam } from '../../../../core/models/exam.model';

export interface BookletUploadDialogData {
    exam: Exam;
}

@Component({
    selector: 'app-booklet-upload-dialog',
    standalone: true,
    imports: [CommonModule, MomentDateFormatPipe, ModalComponent, ButtonComponent, LucideAngularModule],
    templateUrl: './booklet-upload-dialog.component.html',
    styleUrls: ['./booklet-upload-dialog.component.scss'],
})
export class BookletUploadDialogComponent {
    file: File | null = null;
    isUploading = false;

    readonly Upload = Upload;
    readonly Save = Save;

    private readonly snackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
    };

    constructor(
        public dialogRef: MatDialogRef<BookletUploadDialogComponent>,
        private bookletService: BookletService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: BookletUploadDialogData
    ) {}

    get modalButtons(): ModalButton[] {
        return [
            {
                label: 'Bağla',
                variant: 'outline',
                action: () => this.onClose(),
            },
        ];
    }

    get fileName(): string {
        return this.file?.name ?? '';
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.file = input.files[0];
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        if (!this.file) return;

        this.isUploading = true;

        this.bookletService.uploadBooklets(this.file, this.data.exam._id).subscribe({
            next: (result) => {
                this.isUploading = false;
                this.snackBar.open('Kitabça cavabları uğurla yükləndi!', 'OK', this.snackConfig);
                this.dialogRef.close({ success: true, result });
            },
            error: (error: any) => {
                this.isUploading = false;
                const msg = error?.error?.message ?? 'Fayl yüklənərkən xəta baş verdi!';
                this.snackBar.open(msg, 'Bağla', this.snackConfig);
            },
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }

    onModalClose(): void {
        this.onClose();
    }
}
