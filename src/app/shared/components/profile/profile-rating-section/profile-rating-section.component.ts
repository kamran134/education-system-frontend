import { Component, ChangeDetectionStrategy, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, TrendingUp, ChevronRight } from 'lucide-angular';
import { YearRating } from '../../../../core/models/year-rating.model';
import { getCurrentAcademicYear, academicYearLabel } from '../../../../core/utils/academic-year.util';
import { ExamTypeService } from '../../../../features/exam-types/services/exam-type.service';

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
    @Input() placeField: 'place' | 'districtPlace' = 'place';
    @Input() placeColumnLabel = 'Respublika üzrə yeri';

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

    ngOnInit(): void {
        this.examTypeService.getExamTypes()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (types) => { this.examTypeName = types.find((t) => t.isBase)?.nameAz ?? null; },
                error: () => { this.examTypeName = null; },
            });
    }

    get sortedRatings(): YearRating[] {
        return [...this.ratings].sort((a, b) => b.year - a.year);
    }

    placeValue(rating: YearRating): number | null {
        return (this.placeField === 'districtPlace' ? rating.districtPlace : rating.place) ?? null;
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
