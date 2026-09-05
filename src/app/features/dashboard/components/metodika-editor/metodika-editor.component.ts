import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, BookOpen, Save, Eye, RotateCcw, Plus, Trash2 } from 'lucide-angular';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { MetodikaService } from '../../../metodika/services/metodika.service';
import { MetodikaContent, METODIKA_DEFAULT_CONTENT, mergeMetodikaContent } from '../../../metodika/metodika-content.model';

/**
 * Редактор публичной страницы «İSİM metodikası» — п.6 ТЗ от 04.09.2026. Занимает в меню
 * место кнопки «Köhnə bazadan inteqrasiya» (см. admin-layout.component.html).
 *
 * Поля — простой текст, без HTML/rich-text (решение по ТЗ: админ не должен иметь возможности
 * вставить разметку). Списки (предметы, уровни, карточки прямого эфира, баллы годового зачёта)
 * редактируются построчно с добавлением/удалением; секция «2 части методики» (parts.items) —
 * ровно 2 карточки, без добавления/удаления.
 */
@Component({
    selector: 'app-metodika-editor',
    imports: [FormsModule, LucideAngularModule, InputComponent],
    templateUrl: './metodika-editor.component.html',
    styleUrl: './metodika-editor.component.scss'
})
export class MetodikaEditorComponent implements OnInit {
    readonly BookOpen = BookOpen;
    readonly Save = Save;
    readonly Eye = Eye;
    readonly RotateCcw = RotateCcw;
    readonly Plus = Plus;
    readonly Trash2 = Trash2;

    content: MetodikaContent = JSON.parse(JSON.stringify(METODIKA_DEFAULT_CONTENT));
    isLoading = false;
    isSaving = false;
    isResetting = false;

    constructor(
        private metodikaService: MetodikaService,
        private toastService: ToastService,
        private dialog: Dialog
    ) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.isLoading = true;
        this.metodikaService.getContent().subscribe({
            next: (saved) => {
                this.content = mergeMetodikaContent(saved);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Metodika məzmunu yüklənərkən xəta:', error);
                this.toastService.show('Məzmun yüklənərkən xəta baş verdi', 'error');
                this.isLoading = false;
            }
        });
    }

    save(): void {
        this.isSaving = true;
        this.metodikaService.saveContent(this.content).subscribe({
            next: () => {
                this.toastService.show('Metodika səhifəsi yadda saxlanıldı', 'success');
                this.isSaving = false;
            },
            error: (error) => {
                console.error('Metodika məzmunu saxlanarkən xəta:', error);
                const message = error?.error?.message || 'Yadda saxlanılmadı';
                this.toastService.show(message, 'error');
                this.isSaving = false;
            }
        });
    }

    resetToDefault(): void {
        const confirmRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
            width: '450px',
            data: {
                title: 'İlkin mətnə qaytar',
                text: 'Bütün redaktələr silinəcək və səhifə ilkin (zavod) mətninə qaytarılacaq. Bu əməliyyat geri qaytarılmır. Davam edilsin?',
                confirmText: 'Qaytar'
            }
        });

        confirmRef.closed.subscribe((confirmed) => {
            if (!confirmed) return;

            this.isResetting = true;
            this.metodikaService.resetContent().subscribe({
                next: () => {
                    this.content = JSON.parse(JSON.stringify(METODIKA_DEFAULT_CONTENT));
                    this.toastService.show('İlkin mətnə qaytarıldı', 'success');
                    this.isResetting = false;
                },
                error: (error) => {
                    console.error('Metodika məzmunu sıfırlanarkən xəta:', error);
                    this.toastService.show('Sıfırlamaq mümkün olmadı', 'error');
                    this.isResetting = false;
                }
            });
        });
    }

    // ==================== Fənlər (part1.disciplines) ====================

    addDiscipline(): void {
        this.content.part1.disciplines.push({ name: '', questions: 1 });
    }

    removeDiscipline(index: number): void {
        if (this.content.part1.disciplines.length <= 1) return;
        this.content.part1.disciplines.splice(index, 1);
    }

    get totalQuestions(): number {
        return this.content.part1.disciplines.reduce((sum, d) => sum + (Number(d.questions) || 0), 0);
    }

    // ==================== Səviyyələr (part1.levels) ====================

    addLevel(): void {
        this.content.part1.levels.push({ code: '', percent: '' });
    }

    removeLevel(index: number): void {
        if (this.content.part1.levels.length <= 1) return;
        this.content.part1.levels.splice(index, 1);
    }

    // ==================== Canlı yayım kartları (live.cards) ====================

    addLiveCard(): void {
        this.content.live.cards.push({ badge: '', title: '', text: '' });
    }

    removeLiveCard(index: number): void {
        if (this.content.live.cards.length <= 1) return;
        this.content.live.cards.splice(index, 1);
    }

    // ==================== İlin şagirdi balları (yearAwards.points) ====================

    addYearPoint(): void {
        this.content.yearAwards.points.push({ points: '', title: '', note: '' });
    }

    removeYearPoint(index: number): void {
        if (this.content.yearAwards.points.length <= 1) return;
        this.content.yearAwards.points.splice(index, 1);
    }
}
