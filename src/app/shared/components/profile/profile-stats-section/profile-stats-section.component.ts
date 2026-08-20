import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, BarChart3, ChevronRight, Loader } from 'lucide-angular';
import { StatisticsService } from '../../../../features/statistics/services/statistics.service';
import { StatisticsFilter, YearlyStatistics } from '../../../../core/models/statistics.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

/**
 * Блок "Statistika bölməsi" на профиле (PROFILES_TASK.md §5) — единственный из шести
 * компонентов, который сам ходит в API: реальные цифры этой сущности, суженные фильтром,
 * а не ссылка на общую страницу. Ссылка "Ətraflı statistika" на /statistics показывается
 * только когда showDetailsLink=true — страница передаёт его из
 * permissions.canAccessRoute('canAccessStatistics') (у большинства неадминских ролей false,
 * ссылка увела бы в редирект).
 */
@Component({
    selector: 'app-profile-stats-section',
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './profile-stats-section.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileStatsSectionComponent implements OnChanges {
    @Input() filter: StatisticsFilter | null = null;
    @Input() periodLabel = '';
    @Input() showDetailsLink = false;
    @Input() detailsQueryParams: Record<string, any> | null = null;

    readonly BarChart3 = BarChart3;
    readonly ChevronRight = ChevronRight;
    readonly Loader = Loader;

    isLoading = true;
    stats: YearlyStatistics | null = null;
    loadFailed = false;

    private destroyRef = inject(DestroyRef);
    private statisticsService = inject(StatisticsService);
    private cdr = inject(ChangeDetectorRef);
    // Сравнение по содержимому, не по ссылке: страница обязана передавать [filter] как
    // стабильное поле (см. teacher/school/district-profile.component.ts), но если где-то в
    // будущем это правило нарушат и снова привяжут геттер/инлайн-объект, каждый цикл change
    // detection будет присылать новую ссылку с тем же содержимым — без этой проверки это
    // означало бы новый HTTP-запрос на каждый тик и бесконечный цикл (поймано при QA этой
    // задачи, см. PROFILES_TASK.md §10). Défense in depth, а не замена правила у вызывающих.
    private lastLoadedFilterKey: string | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['filter']) return;
        const key = this.filter ? JSON.stringify(this.filter) : null;
        if (key === this.lastLoadedFilterKey) return;
        this.lastLoadedFilterKey = key;
        this.load();
    }

    private load(): void {
        if (!this.filter) {
            this.isLoading = false;
            return;
        }
        this.isLoading = true;
        this.loadFailed = false;
        this.statisticsService.getYearlyStatistics(this.filter)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.stats = ResponseHandlerUtil.extractData<YearlyStatistics>(response);
                    this.isLoading = false;
                    // OnPush не перерисовывает вьюху сам по себе на завершение подписки —
                    // это не @Input, не DOM-событие и не async pipe, поэтому без явного
                    // markForCheck() блок так и остаётся с лоадером, хотя данные в компоненте
                    // уже корректны (PROFILES_V2_TASK.md §4.3 — второй найденный дефект блока
                    // статистики, отдельный от 500 на regionIds).
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.loadFailed = true;
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
            });
    }
}
