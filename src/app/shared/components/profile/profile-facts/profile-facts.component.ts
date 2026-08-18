import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProfileFact {
    label: string;
    value: string | null;
}

/** Сетка полей профиля (PROFILES_TASK.md §5) — пустое значение показывается как "Doldurulmayıb". */
@Component({
    selector: 'app-profile-facts',
    imports: [CommonModule],
    templateUrl: './profile-facts.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFactsComponent {
    @Input() facts: ProfileFact[] = [];
}
