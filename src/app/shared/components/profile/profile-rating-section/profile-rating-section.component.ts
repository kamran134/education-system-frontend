import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, TrendingUp, ChevronRight } from 'lucide-angular';
import { YearRating } from '../../../../core/models/year-rating.model';

export interface ProfileRatingScope {
    label: string;
    value: string;
}

/** Академический год — та же формула, что backend/utils/academic-year.util.ts (сентябрь–июнь). */
function currentAcademicYear(): number {
    const now = new Date();
    return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Блок "Reytinqlər bölməsi" на профиле (PROFILES_TASK.md §5) — данные уже приходят в ratings[]. */
@Component({
    selector: 'app-profile-rating-section',
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './profile-rating-section.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileRatingSectionComponent {
    @Input() ratings: YearRating[] = [];
    @Input() scopes: ProfileRatingScope[] = [];
    @Input() showDetailsLink = true;

    readonly TrendingUp = TrendingUp;
    readonly ChevronRight = ChevronRight;
    readonly currentYear = currentAcademicYear();

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
        return `${year}/${year + 1}`;
    }
}
