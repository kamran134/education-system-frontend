import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, TrendingUp, ChevronRight } from 'lucide-angular';
import { YearRating } from '../../../../core/models/year-rating.model';
import { getCurrentAcademicYear, academicYearLabel } from '../../../../core/utils/academic-year.util';
import { ExamTypeService } from '../../../../features/exam-types/services/exam-type.service';
import { DashboardService } from '../../../../features/dashboard/services/dashboard.service';
import { applyColumnSetting, ProfileRatingColumnKey, ProfileRatingOwnerRole } from '../../../../core/config/column-catalogs';

/** One place column of the per-year table: which YearRating field it shows and its header. */
export interface ProfilePlaceColumn {
    label: string;
    field: 'place' | 'districtPlace' | 'averagePlace' | 'averageDistrictPlace';
}

/** One data column of the per-year table (the "Tədris ili" key column is always first and not listed here). */
export interface ProfileRatingColumn {
    key: ProfileRatingColumnKey;
    label: string;
}

/**
 * Блок "Reytinqlər bölməsi" на профиле (PROFILES_TASK.md §5) — данные уже приходят в ratings[].
 * С PROFILES_V3_TASK.md §3 плашки мест/баллов (бывший @Input scopes) отсюда убраны — это был
 * стопроцентный дубль шапки профиля (profile-hero: metric + places).
 *
 * Заказчик (24.08.2026, WhatsApp) попросил убрать "Orta bal" из таблицы по годам совсем,
 * колонку "Bal" превратить в "Reytinq xalı" (rating.score, не averageScore — она реально
 * показывала average_score под неверным заголовком), а "Yer" сделать местом СВОЕГО района,
 * не республики — с районом в заголовке колонки ("Gəncə üzrə yeri"). Место в масштабе района
 * (districtPlace) есть только у учителя и школы (см. db/schema.sql: у district/region своего
 * "district_place" не существует вообще) — там, где его нет, остаётся общий Respublika üzrə
 * yeri через дефолты ниже.
 *
 * Г2 (29.10.2026): набор и порядок колонок (кроме "Tədris ili") настраивает админ — roleSettings[settingsRole].profileRatings.
 */
@Component({
    selector: 'app-profile-rating-section',
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './profile-rating-section.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileRatingSectionComponent implements OnInit {
    @Input() ratings: YearRating[] = [];
    @Input() showDetailsLink = true;
    /** RATING_PLACES_TASK.md: two places per year — by total score and by average score; teacher and
     *  school profiles add the district-scoped pair. Region has no average place, so it passes its own list. */
    @Input() placeColumns: ProfilePlaceColumn[] = [
        { label: 'Ümumi xal üzrə yer', field: 'place' },
        { label: 'Orta xal üzrə yer', field: 'averagePlace' },
    ];
    // YENI_DUZELISLER_2026-09-17 п.1a: параметры фильтра для ссылки "Tam reytinq…" на /stats —
    // по образцу detailsQueryParams в profile-stats-section.component.ts.
    @Input() detailsQueryParams: Record<string, any> | null = null;

    /** Role that owns this profile type; its saved `profileRatings` (admin panel) sets the columns. Null = defaults. */
    @Input() settingsRole: ProfileRatingOwnerRole | null = null;

    readonly TrendingUp = TrendingUp;
    readonly ChevronRight = ChevronRight;
    readonly currentYear = getCurrentAcademicYear();

    /** IMTAHAN_NOVLERI_TASK.md §14: история после задачи 1 фильтруется по базовому типу —
     *  заказчик потребовал явную подпись об этом, название типа не хардкодим. Компонент сам
     *  ходит за справочником (тот же паттерн, что profile-stats-section уже использует для
     *  собственного HTTP-запроса) — родительские профили типы экзаменов не знают. */
    examTypeName: string | null = null;
    private destroyRef = inject(DestroyRef);
    private examTypeService = inject(ExamTypeService);
    private dashboardService = inject(DashboardService);
    private cdr = inject(ChangeDetectorRef);

    /** False until the saved column setting arrives, so the table does not flash a column that is hidden. */
    settingsLoaded = false;
    private savedColumns: string[] | undefined;

    ngOnInit(): void {
        if (this.settingsRole) {
            const role = this.settingsRole;
            this.dashboardService.getGlobalColumns()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (settings) => {
                        this.savedColumns = settings?.roleSettings?.[role]?.profileRatings;
                        this.settingsLoaded = true;
                        this.cdr.markForCheck();
                    },
                    error: () => {
                        this.savedColumns = undefined;
                        this.settingsLoaded = true;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.settingsLoaded = true;
        }

        this.examTypeService.getExamTypes()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (types) => { this.examTypeName = types.find((t) => t.isBase)?.nameAz ?? null; this.cdr.markForCheck(); },
                error: () => { this.examTypeName = null; this.cdr.markForCheck(); },
            });
    }

    get sortedRatings(): YearRating[] {
        return [...this.ratings].sort((a, b) => b.year - a.year);
    }

    /** Score plus the profile's place columns, filtered and ordered by the admin setting (no setting = all, as passed). */
    get columns(): ProfileRatingColumn[] {
        const available: ProfileRatingColumn[] = [
            { key: 'score', label: 'Reytinq xalı' },
            ...this.placeColumns.map((c) => ({ key: c.field, label: c.label })),
        ];
        return applyColumnSetting(available, this.savedColumns);
    }

    placeValue(rating: YearRating, key: ProfileRatingColumnKey): number | null {
        return key === 'score' ? null : rating[key] ?? null;
    }

    /** Year + one column per visible rating column. */
    get gridTemplate(): string {
        const count = this.columns.length;
        return count > 0 ? `76px repeat(${count}, minmax(64px, 1fr))` : '76px';
    }

    /** Four or more data columns do not fit a phone screen: let the table scroll sideways instead of squeezing. */
    get minTableWidth(): string | null {
        const count = this.columns.length;
        return count > 3 ? `${76 + count * 84}px` : null;
    }

    yearLabel(year: number): string {
        return academicYearLabel(year);
    }

    /**
     * Балл без разделителя тысяч: DecimalPipe под дефолтной локалью en-US превращал 6576 в "6,576"
     * (П.5). Локаль ради одной ячейки не переключаем — это потянуло бы форматы дат/валют по всему
     * приложению. tabular-nums на элементе сохранён.
     */
    scoreLabel(score: number | null | undefined): string {
        return score != null ? String(Math.round(score)) : '—';
    }
}
