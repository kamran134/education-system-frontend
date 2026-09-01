import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, GraduationCap, Loader, CheckCircle, AlertTriangle, Lock, Award } from 'lucide-angular';
import { AcademicYearService, GradePromotionPreview, AcademicYearClosurePreview, RatingYearState } from '../../services/academic-year.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { academicYearLabel } from '../../../../core/utils/academic-year.util';

@Component({
    selector: 'app-academic-year',
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './academic-year.component.html',
    styleUrl: './academic-year.component.scss'
})
export class AcademicYearComponent implements OnInit {
    readonly GraduationCap = GraduationCap;
    readonly Loader = Loader;
    readonly CheckCircle = CheckCircle;
    readonly AlertTriangle = AlertTriangle;
    readonly Lock = Lock;
    readonly Award = Award;
    readonly academicYearLabel = academicYearLabel;

    preview: GradePromotionPreview | null = null;
    isLoading = false;
    isExecuting = false;
    lastPromotedCount: number | null = null;

    closurePreview: AcademicYearClosurePreview | null = null;
    isClosureLoading = false;
    isClosureExecuting = false;

    ratingYearState: RatingYearState | null = null;
    isRatingYearLoading = false;
    isRatingYearToggling = false;

    constructor(
        private academicYearService: AcademicYearService,
        private dialog: Dialog,
        private snackBarService: SnackBarService
    ) { }

    ngOnInit(): void {
        this.loadPreview();
        this.loadClosurePreview();
        this.loadRatingYearState();
    }

    loadPreview(): void {
        this.isLoading = true;
        this.academicYearService.previewPromotion().subscribe({
            next: (preview) => {
                this.preview = preview;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Sinif yüksəltmə preview xətası:', error);
                this.snackBarService.show('Məlumat yüklənərkən xəta baş verdi', 'error');
                this.isLoading = false;
            }
        });
    }

    loadClosurePreview(): void {
        this.isClosureLoading = true;
        this.academicYearService.previewClosure().subscribe({
            next: (preview) => {
                this.closurePreview = preview;
                this.isClosureLoading = false;
            },
            error: (error) => {
                console.error('Tədris ili bağlanması preview xətası:', error);
                this.snackBarService.show('Məlumat yüklənərkən xəta baş verdi', 'error');
                this.isClosureLoading = false;
            }
        });
    }

    get canCloseYear(): boolean {
        return !!this.closurePreview && !this.closurePreview.alreadyClosed && !this.isClosureExecuting;
    }

    openCloseConfirm(): void {
        if (!this.canCloseYear || !this.closurePreview) return;

        const label = this.academicYearLabel(this.closurePreview.academicYear);
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '450px',
            data: {
                title: 'Tədris ilini bağla',
                text: `${label} tədris ili bağlanacaq. Bundan sonra bu il üçün statistikanı yenidən hesablamaq mümkün olmayacaq. Davam edilsin?`,
                confirmText: 'Bağla'
            }
        });

        confirmRef.closed.subscribe((confirmed: boolean | undefined) => {
            if (confirmed) {
                this.executeClosure();
            }
        });
    }

    private executeClosure(): void {
        this.isClosureExecuting = true;
        this.academicYearService.executeClosure().subscribe({
            next: () => {
                this.snackBarService.show('Tədris ili bağlandı', 'success');
                this.isClosureExecuting = false;
                this.loadClosurePreview();
                this.loadPreview();
            },
            error: (error) => {
                console.error('Tədris ili bağlanması xətası:', error);
                const message = error?.error?.message || 'Tədris ilini bağlamaq mümkün olmadı';
                this.snackBarService.show(message, 'error');
                this.isClosureExecuting = false;
                this.loadClosurePreview();
            }
        });
    }

    get canPromote(): boolean {
        return !!this.preview && this.preview.windowOpen && !this.preview.alreadyPromotedThisYear && !this.isExecuting;
    }

    openConfirm(): void {
        if (!this.canPromote || !this.preview) return;

        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '450px',
            data: {
                title: 'Sinifləri yüksəlt',
                text: `${this.preview.promotableCount} şagird 1 sinif yüksəldiləcək (${this.preview.targetAcademicYear}/${this.preview.targetAcademicYear + 1} tədris ili). Bu əməliyyat geri qaytarılmır. Davam edilsin?`,
                confirmText: 'Təsdiq et'
            }
        });

        confirmRef.closed.subscribe((confirmed: boolean | undefined) => {
            if (confirmed) {
                this.executePromotion();
            }
        });
    }

    private executePromotion(): void {
        this.isExecuting = true;
        this.academicYearService.executePromotion().subscribe({
            next: (result) => {
                this.lastPromotedCount = result.promotedCount;
                this.snackBarService.show(`${result.promotedCount} şagird yüksəldildi`, 'success');
                this.isExecuting = false;
                this.loadPreview();
            },
            error: (error) => {
                console.error('Sinif yüksəltmə xətası:', error);
                const message = error?.error?.message || 'Sinif yüksəltmə zamanı xəta baş verdi';
                this.snackBarService.show(message, 'error');
                this.isExecuting = false;
                this.loadPreview();
            }
        });
    }

    // ==================== Reytinq ili (REYTINQ_ILI_TASK.md §7) ====================

    loadRatingYearState(): void {
        this.isRatingYearLoading = true;
        this.academicYearService.getRatingYearState().subscribe({
            next: (state) => {
                this.ratingYearState = state;
                this.isRatingYearLoading = false;
            },
            error: (error) => {
                console.error('Reytinq ili vəziyyəti xətası:', error);
                this.snackBarService.show('Məlumat yüklənərkən xəta baş verdi', 'error');
                this.isRatingYearLoading = false;
            }
        });
    }

    /** Checkbox dəyişdikdə çağırılır — dərhal PUT, sonra vəziyyəti yenidən oxuyur. */
    onToggleRatingYear(checked: boolean): void {
        if (this.isRatingYearToggling || !this.ratingYearState) return;

        this.isRatingYearToggling = true;
        this.academicYearService.setRatingYearActivated(checked).subscribe({
            next: () => {
                this.snackBarService.show('Yadda saxlanıldı', 'success');
                this.isRatingYearToggling = false;
                this.loadRatingYearState();
            },
            error: (error) => {
                console.error('Reytinq ili dəyişdirmə xətası:', error);
                const message = error?.error?.message || 'Dəyişiklik yadda saxlanılmadı';
                this.snackBarService.show(message, 'error');
                this.isRatingYearToggling = false;
                this.loadRatingYearState();
            }
        });
    }
}
