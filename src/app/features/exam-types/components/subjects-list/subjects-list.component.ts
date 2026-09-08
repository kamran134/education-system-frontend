import { Component, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Edit } from 'lucide-angular';

import { Subject, SubjectInput } from '../../../../core/models/subject.model';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ListLayoutComponent, ActionButton, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { SubjectEditingDialogComponent } from '../subject-editing-dialog/subject-editing-dialog.component';

/**
 * Справочник предметов (IMTAHAN_NOVLERI_TASK.md §5/§6). DELETE не выведен — в шаге 1 нет
 * DELETE /subjects роута (см. subject.service.pg.ts — метод delete существует, но не
 * подключён к роуту специально, ТЗ §5.3 требует только GET/POST/PUT в этом шаге).
 */
@Component({
    selector: 'app-subjects-list',
    imports: [LucideAngularModule, ListLayoutComponent],
    templateUrl: './subjects-list.component.html',
    styleUrl: './subjects-list.component.scss'
})
export class SubjectsListComponent implements OnInit {
    subjects: Subject[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';

    actionButtons: ActionButton[] = [];
    backButton: BackButton = { show: true, action: () => history.back() };

    readonly Plus = Plus;
    readonly Edit = Edit;

    constructor(
        private subjectService: SubjectService,
        private toastService: ToastService,
        private dialog: Dialog
    ) {}

    ngOnInit(): void {
        this.actionButtons = [
            { label: 'Yeni fənn', icon: this.Plus, action: () => this.openEditDialog(), variant: 'primary' }
        ];
        this.loadSubjects();
    }

    loadSubjects(): void {
        this.isLoading = true;
        this.hasError = false;
        this.subjectService.getSubjects().subscribe({
            next: (subjects: Subject[]) => {
                this.subjects = subjects || [];
                this.isLoading = false;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `Fənlər yüklənərkən xəta baş verdi: ${err.message || ''}`;
            }
        });
    }

    openEditDialog(subject?: Subject): void {
        const dialogRef = this.dialog.open<SubjectInput | undefined>(SubjectEditingDialogComponent, {
            width: '500px',
            data: { subject, isEditing: !!subject }
        });

        dialogRef.closed.subscribe((result) => {
            if (!result) return;

            const request$ = subject
                ? this.subjectService.updateSubject(subject.code, result)
                : this.subjectService.createSubject(result);

            request$.subscribe({
                next: () => {
                    this.toastService.show(subject ? 'Fənn uğurla yeniləndi' : 'Fənn uğurla yaradıldı', 'success');
                    this.loadSubjects();
                },
                error: (err: any) => {
                    this.toastService.show(err?.error?.message || 'Fənn yadda saxlanılarkən xəta baş verdi', 'error');
                }
            });
        });
    }
}
