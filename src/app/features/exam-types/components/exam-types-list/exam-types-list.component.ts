import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Edit, Trash2, FileDown } from 'lucide-angular';

import { ExamType, ExamTypeSection } from '../../../../core/models/examType.model';
import { ExamTypeService } from '../../services/exam-type.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ListLayoutComponent, ActionButton } from '../../../../shared/components/ui/list-layout/list-layout.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { LevelScaleService } from '../../services/level-scale.service';
import { LevelScale } from '../../../../core/models/levelScale.model';
import { saveBlobResponse, blobErrorMessage } from '../../../../core/utils/blob-download.util';

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

    // IMTAHAN_NOVLERI_TASK.md §18.1: id типа, для которого сейчас качается шаблон — блокирует
    // повторный клик, пока не пришёл ответ.
    downloadingTemplateExamTypeId: number | null = null;

    actionButtons: ActionButton[] = [];
    private levelScaleNames = new Map<number, string>();

    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly FileDown = FileDown;

    constructor(
        private examTypeService: ExamTypeService,
        private toastService: ToastService,
        private dialog: Dialog,
        private router: Router,
        private levelScaleService: LevelScaleService
    ) {}

    ngOnInit(): void {
        this.levelScaleService.getLevelScales().subscribe({
            next: (scales: LevelScale[]) => { this.levelScaleNames = new Map((scales || []).map(s => [s.id, s.nameAz])); },
            error: () => { this.levelScaleNames = new Map(); }
        });
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

    /** IMTAHAN_NOVLERI_TASK.md §18.1: шаблон свой у каждой секции; секция без предметов — кнопка неактивна. */
    onDownloadSectionTemplate(examType: ExamType, section: ExamTypeSection): void {
        if (this.downloadingTemplateExamTypeId !== null) return;
        this.downloadingTemplateExamTypeId = examType.id;

        this.examTypeService.downloadResultsTemplate(examType.id, section.id).subscribe({
            next: (response) => {
                this.downloadingTemplateExamTypeId = null;
                saveBlobResponse(response, `netice-sablonu-${examType.code}-${section.id}.xlsx`);
            },
            error: async (error: any) => {
                this.downloadingTemplateExamTypeId = null;
                this.toastService.show(await blobErrorMessage(error, 'Şablon yüklənərkən xəta baş verdi'), 'error');
            }
        });
    }

    levelScaleName(id: number): string {
        return this.levelScaleNames.get(id) ?? '';
    }

    /** Delete is offered only where the backend would allow it: not the base type, no exams. */
    canDelete(examType: ExamType): boolean {
        return !examType.isBase && examType.examCount === 0;
    }
}
