import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Edit, Trash2 } from 'lucide-angular';

import { ExamType } from '../../../../core/models/examType.model';
import { ExamTypeService } from '../../services/exam-type.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-exam-types-list',
    imports: [
        RouterModule,
        LucideAngularModule,
        ListLayoutComponent
    ],
    templateUrl: './exam-types-list.component.html',
    styleUrls: ['./exam-types-list.component.scss']
})
export class ExamTypesListComponent implements OnInit {
    examTypes: ExamType[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';

    actionButtons: ActionButton[] = [];

    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;

    constructor(
        private examTypeService: ExamTypeService,
        private toastService: ToastService,
        private dialog: Dialog,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.setupActionButtons();
        this.loadExamTypes();
    }

    private setupActionButtons(): void {
        this.actionButtons = [
            {
                label: 'Yeni növ',
                icon: this.Plus,
                action: () => this.router.navigate(['/admin/exam-types/new']),
                variant: 'primary'
            }
        ];
    }

    loadExamTypes(): void {
        this.isLoading = true;
        this.hasError = false;
        this.examTypeService.getExamTypes().subscribe({
            next: (types: ExamType[]) => {
                this.examTypes = types || [];
                this.isLoading = false;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `İmtahan növləri yüklənərkən xəta baş verdi: ${err.message || ''}`;
            }
        });
    }

    onDeleteExamType(examType: ExamType): void {
        const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'İmtahan növünü sil',
                text: `"${examType.nameAz}" növünü silmək istədiyinizə əminsinizmi?`
            }
        });

        dialogRef.closed.subscribe(result => {
            if (result) {
                this.examTypeService.deleteExamType(examType.id).subscribe({
                    next: () => {
                        this.toastService.show('İmtahan növü uğurla silindi', 'success');
                        this.loadExamTypes();
                    },
                    error: (err: any) => {
                        this.toastService.show(err?.error?.message || 'İmtahan növü silinməsində xəta baş verdi', 'error');
                    }
                });
            }
        });
    }
}
