import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, GraduationCap, Loader, CheckCircle, AlertTriangle } from 'lucide-angular';
import { AcademicYearService, GradePromotionPreview } from '../../services/academic-year.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';

@Component({
    selector: 'app-academic-year',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './academic-year.component.html',
    styleUrl: './academic-year.component.scss'
})
export class AcademicYearComponent implements OnInit {
    readonly GraduationCap = GraduationCap;
    readonly Loader = Loader;
    readonly CheckCircle = CheckCircle;
    readonly AlertTriangle = AlertTriangle;

    preview: GradePromotionPreview | null = null;
    isLoading = false;
    isExecuting = false;
    lastPromotedCount: number | null = null;

    constructor(
        private academicYearService: AcademicYearService,
        private dialog: MatDialog,
        private snackBarService: SnackBarService
    ) { }

    ngOnInit(): void {
        this.loadPreview();
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

    get canPromote(): boolean {
        return !!this.preview && this.preview.windowOpen && !this.preview.alreadyPromotedThisYear && !this.isExecuting;
    }

    openConfirm(): void {
        if (!this.canPromote || !this.preview) return;

        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '450px',
            data: {
                title: 'Sinifləri yüksəlt',
                text: `${this.preview.promotableCount} şagird 1 sinif yüksəldiləcək (${this.preview.targetAcademicYear}/${this.preview.targetAcademicYear + 1} tədris ili). Bu əməliyyat geri qaytarılmır. Davam edilsin?`,
                confirmText: 'Təsdiq et'
            }
        });

        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
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
}
