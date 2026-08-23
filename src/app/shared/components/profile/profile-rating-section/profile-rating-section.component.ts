import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, TrendingUp, ChevronRight } from 'lucide-angular';
import { YearRating } from '../../../../core/models/year-rating.model';
import { getCurrentAcademicYear, academicYearLabel } from '../../../../core/utils/academic-year.util';

/**
 * Блок "Reytinqlər bölməsi" на профиле (PROFILES_TASK.md §5) — данные уже приходят в ratings[].
 * С PROFILES_V3_TASK.md §3 плашки мест/баллов (бывший @Input scopes) отсюда убраны — это был
 * стопроцентный дубль шапки профиля (profile-hero: metric + places), таблица по годам ниже
 * их и так содержит. Только таблица история по годам.
 */
@Component({
    selector: 'app-profile-rating-section',
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './profile-rating-section.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileRatingSectionComponent {
    @Input() ratings: YearRating[] = [];
    @Input() showDetailsLink = true;

    readonly TrendingUp = TrendingUp;
    readonly ChevronRight = ChevronRight;
    readonly currentYear = getCurrentAcademicYear();

    get sortedRatings(): YearRating[] {
        return [...this.ratings].sort((a, b) => b.year - a.year);
    }

    get maxAverageScore(): number {
        return Math.max(1, ...this.ratings.map((r) => r.averageScore || 0));
    }

    barWidth(rating: YearRating): number {
        return Math.max(4, Math.round(((rating.averageScore || 0) / this.maxAverageScore) * 100));
    }

    yearLabel(year: number): string {
        return academicYearLabel(year);
    }
}
