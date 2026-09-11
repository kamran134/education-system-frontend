import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Edit, Trash2, FileDown } from 'lucide-angular';

import { ExamType, ExamTypeSection } from '../../../../core/models/examType.model';
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

    // IMTAHAN_NOVLERI_TASK.md §18.1: id типа, для которого сейчас качается шаблон — блокирует
    // повторный клик, пока не пришёл ответ.
    downloadingTemplateExamTypeId: number | null = null;

    actionButtons: ActionButton[] = [];

    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly FileDown = FileDown;

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

    /**
     * IMTAHAN_NOVLERI_TASK.md §18.1: шаблон зависит от СЕКЦИИ, не от типа — секция без
     * предметов помечена неактивной в дропдауне (см. шаблон), поэтому сюда попадает только
     * секция с настроенными предметами. Единственное исключение — если у типа ровно одна
     * секция (кнопка качает сразу, без меню) и та секция без предметов: тогда до бэкенда всё
     * равно дойдёт запрос, и он ответит понятной ошибкой "Bu sinif qrupu üçün fənlər təyin
     * edilməyib" — тем же текстом, что видел бы админ при обычном импорте (§7 ТЗ).
     */
    onDownloadSectionTemplate(examType: ExamType, section: ExamTypeSection): void {
        if (this.downloadingTemplateExamTypeId !== null) return;
        this.downloadingTemplateExamTypeId = examType.id;

        // Тот же способ скачивания blob-а, что уже работает в exam-result-dialog.component.ts
        // (onDownloadTemplate) — не изобретаем второй механизм получения/сохранения файла.
        this.examTypeService.downloadResultsTemplate(examType.id, section.id).subscribe({
            next: (blob) => {
                this.downloadingTemplateExamTypeId = null;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `netice-sablonu-${examType.code}-${section.id}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (error: any) => {
                this.downloadingTemplateExamTypeId = null;
                // responseType: 'blob' — HttpClient JSON xəta gövdəsini parse etmir, error.error
                // burada Blob-dur, mətn deyil. Server mesajını oxumaq üçün onu ayrıca oxumaq lazımdır.
                if (error?.error instanceof Blob) {
                    error.error.text().then((text: string) => {
                        try {
                            const parsed = JSON.parse(text);
                            this.toastService.show(parsed?.message || 'Şablon yüklənərkən xəta baş verdi', 'error');
                        } catch {
                            this.toastService.show('Şablon yüklənərkən xəta baş verdi', 'error');
                        }
                    });
                } else {
                    this.toastService.show('Şablon yüklənərkən xəta baş verdi', 'error');
                }
            }
        });
    }
}
