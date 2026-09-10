
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Exam } from '../../../../core/models/exam.model';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ModalComponent, ModalButton } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { ExamTypeService } from '../../../exam-types/services/exam-type.service';
import { ExamType } from '../../../../core/models/examType.model';
import { ExamResultsService } from '../../../exam-results/services/exam-results.service';

@Component({
    selector: 'app-exam-editing',
    imports: [
    FormsModule,
    InputComponent,
    ModalComponent,
    SelectComponent
],
    templateUrl: './exam-editing-dialog.component.html',
    styleUrl: './exam-editing-dialog.component.scss'
})
export class ExamEditingDialogComponent implements OnInit {
    editedExam: any;
    examTypeOptions: SelectOption[] = [];
    // IMTAHAN_NOVLERI_TASK.md §6: menять imtahan növünü qadağandır, əgər imtahanın artıq
    // nəticələri varsa (backend eyni qadağanı 409 ilə tətbiq edir — exam.service.pg.ts:update;
    // burada isə UI-da əvvəlcədən görünən edir, sorğu boşuna göndərilmir).
    examTypeLocked = false;

    constructor(
        public dialogRef: DialogRef<{ action: 'save' | 'delete', data?: any } | undefined>,
        @Inject(DIALOG_DATA) public data: { exam: Exam, isEditing: boolean, canDelete?: boolean },
        private examTypeService: ExamTypeService,
        private examResultsService: ExamResultsService
    ) {
        // Преобразуем date в строку для отображения
        this.editedExam = { ...this.data.exam };
        if (this.editedExam.date) {
            const date = new Date(this.editedExam.date);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            this.editedExam.dateString = `${day}.${month}.${year}`;
        } else {
            this.editedExam.dateString = '';
        }
    }

    ngOnInit(): void {
        this.examTypeService.getExamTypes().subscribe({
            next: (types: ExamType[]) => {
                this.examTypeOptions = (types || []).map(t => ({ value: t.id, label: t.nameAz }));
            },
            error: () => { this.examTypeOptions = []; }
        });

        if (this.data.isEditing && this.data.exam?.id) {
            this.examResultsService.getExamResults({ examIds: String(this.data.exam.id), page: 1, size: 1 })
                .subscribe({
                    next: (res) => { this.examTypeLocked = (res?.totalCount || 0) > 0; },
                    error: () => { this.examTypeLocked = false; }
                });
        }
    }

    get modalTitle(): string {
        return this.data.isEditing ? 'İmtahanın redaktə edilməsi' : 'Yeni imtahan əlavə et';
    }

    get modalSubtitle(): string {
        return 'İmtahanın məlumatlarını daxil edin';
    }

    get isValid(): boolean {
        return !!(
            this.editedExam.name?.trim() &&
            this.editedExam.dateString?.trim() &&
            !!this.editedExam.examTypeId
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
        // Преобразуем строку даты обратно в Date
        const dateParts = this.editedExam.dateString.split('.');
        if (dateParts.length === 3) {
            const [day, month, year] = dateParts.map((part: string) => parseInt(part, 10));
            this.editedExam.date = new Date(year, month - 1, day);
        }
        
        const examData = {
            name: this.editedExam.name,
            date: this.editedExam.date,
            examTypeId: this.editedExam.examTypeId
        };
        
        this.dialogRef.close({ action: 'save', data: examData });
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
