import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ClipboardList, ChevronRight } from 'lucide-angular';

/**
 * YENI_DUZELISLER_2026-09-17 п.7: компактная карточка-ссылка на /exam-results, ставится
 * последним блоком на всех четырёх профилях (учитель/школа/район/регион). По образцу
 * profile-rating-section/profile-stats-section — та же обёртка карточки и шапка с иконкой.
 * Профиль ученика не трогаем — у него результаты уже показаны на самой странице.
 */
@Component({
    selector: 'app-profile-results-section',
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './profile-results-section.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileResultsSectionComponent {
    @Input() queryParams: Record<string, any> | null = null;
    @Input() description = 'Bu bölmə üzrə şagirdlərin bütün imtahan nəticələri';

    readonly ClipboardList = ClipboardList;
    readonly ChevronRight = ChevronRight;
}
