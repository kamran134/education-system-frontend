import { Component, OnInit } from '@angular/core';

import { LevelScale } from '../../../../core/models/levelScale.model';
import { LevelScaleService } from '../../services/level-scale.service';
import { ListLayoutComponent, BackButton } from '../../../../shared/components/ui/list-layout/list-layout.component';

/**
 * Просмотр шкал pillə — ТОЛЬКО на чтение (IMTAHAN_NOVLERI_TASK.md §6: "Шкалы в первой итерации
 * только читаются; редактор шкал — отдельная задача"). Никакого POST/PUT здесь нет и не будет
 * в этом шаге.
 */
@Component({
    selector: 'app-level-scales-view',
    imports: [ListLayoutComponent],
    templateUrl: './level-scales-view.component.html',
    styleUrl: './level-scales-view.component.scss'
})
export class LevelScalesViewComponent implements OnInit {
    scales: LevelScale[] = [];
    isLoading = false;
    hasError = false;
    errorMessage = '';

    backButton: BackButton = { show: true, action: () => history.back() };

    constructor(private levelScaleService: LevelScaleService) {}

    ngOnInit(): void {
        this.isLoading = true;
        this.levelScaleService.getLevelScales().subscribe({
            next: (scales: LevelScale[]) => {
                this.scales = scales || [];
                this.isLoading = false;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.hasError = true;
                this.errorMessage = `Şkalalar yüklənərkən xəta baş verdi: ${err.message || ''}`;
            }
        });
    }
}
