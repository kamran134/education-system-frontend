import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronRight, Loader } from 'lucide-angular';
import { ButtonComponent } from '../../ui/button/button.component';

export interface EntityCardItem {
    id: number;
    name: string;
    meta: string;
    avatarUrl: string | null;
    /** Только для цвета бейджа (топ-3 нацию — золото); само число в бейдже не показываем. */
    place: number | null;
    /** Reytinq xalı (score, округлённый) — то, что реально выводится в бейдже. */
    metric: string | null;
    routerLink: any[];
}

/**
 * Drill-down сетка карточек уровнем ниже (Şagirdlər/Layihə müəllimləri/Məktəblər —
 * PROFILES_TASK.md §5). "portrait" — 3:4 для людей (учеников/учителей), "wide" — 16:9
 * для учреждений (школ). Бейдж в углу — reytinq xalı (score), не место: заказчик принял
 * место (национальный ранг, могло доходить до 3 цифр) за "непонятное число" вместо балла
 * (24.08.2026). Топ-3 по МЕСТУ (place) всё ещё подсвечиваются золотом — просто число внутри
 * бейджа теперь другое, чем то, что решает цвет.
 *
 * Карточка — чисто навигационная ссылка на профиль сущности. Управление фото раньше жило
 * прямо тут (оверлей поверх фото), но перекрывало клик по карточке — заказчик потребовал
 * убрать это отсюда: клик по фото должен вести в профиль, а не предлагать загрузку
 * (26.08.2026, п.1). Загрузка/удаление фото переехали в сами профили (app-profile-hero
 * для учителя, карточка ученика для student-details).
 */
@Component({
    selector: 'app-entity-card-grid',
    imports: [CommonModule, RouterModule, LucideAngularModule, ButtonComponent],
    templateUrl: './entity-card-grid.component.html',
    styleUrl: './entity-card-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityCardGridComponent {
    @Input() items: EntityCardItem[] = [];
    @Input() layout: 'portrait' | 'wide' = 'portrait';
    @Input() total = 0;
    @Input() isLoading = false;
    @Input() isLoadingMore = false;
    @Input() moreLabel = '';
    @Input() emptyLabel = 'Hələ heç kim yoxdur';

    @Output() loadMore = new EventEmitter<void>();

    readonly ChevronRight = ChevronRight;
    readonly Loader = Loader;

    get hasMore(): boolean {
        return this.items.length < this.total;
    }

    get gridClasses(): string {
        return this.layout === 'wide'
            ? 'grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4';
    }

    get pictureClasses(): string {
        return this.layout === 'wide' ? 'relative overflow-hidden aspect-[16/9]' : 'relative overflow-hidden aspect-[3/4]';
    }

    initials(name: string): string {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase();
    }

    tone(id: number): number {
        return id % 6;
    }
}
