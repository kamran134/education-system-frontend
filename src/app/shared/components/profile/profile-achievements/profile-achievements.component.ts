import { Component, ChangeDetectionStrategy, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Edit2, Award, Check } from 'lucide-angular';
import { InputComponent } from '../../ui/form-controls/input/input.component';
import { ButtonComponent } from '../../ui/button/button.component';

/**
 * Блок "Uğurları" (PROFILES_TASK.md §5) — свободный текст, разбивается по переводам строк
 * на буллеты в режиме просмотра, inline-редактирование через app-input.
 *
 * Закрытие режима редактирования управляется через isSaving/saveFailed (тот же паттерн, что
 * teacher-profile.component.ts до переделки): isEditing сбрасывается в false только когда
 * isSaving переходит true→false БЕЗ ошибки — если сохранение упало, форма остаётся открытой
 * с введённым текстом, а не закрывается и не теряет черновик.
 */
@Component({
    selector: 'app-profile-achievements',
    imports: [CommonModule, FormsModule, LucideAngularModule, InputComponent, ButtonComponent],
    templateUrl: './profile-achievements.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAchievementsComponent implements OnChanges {
    @Input() title = 'Uğurları';
    @Input() text: string | null = null;
    @Input() canEdit = false;
    @Input() isSaving = false;
    @Input() saveFailed = false;

    @Output() save = new EventEmitter<string | null>();

    readonly Edit2 = Edit2;
    readonly Award = Award;
    readonly Check = Check;

    isEditing = false;
    editedText: string | null = null;
    private wasSaving = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['text'] && !this.isEditing) {
            this.editedText = this.text;
        }
        if (changes['isSaving']) {
            if (this.wasSaving && !this.isSaving && !this.saveFailed) {
                this.isEditing = false;
            }
            this.wasSaving = this.isSaving;
        }
    }

    get items(): string[] {
        return (this.text ?? '')
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }

    startEdit(): void {
        this.editedText = this.text ?? '';
        this.isEditing = true;
    }

    cancelEdit(): void {
        this.isEditing = false;
        this.editedText = this.text;
    }

    submit(): void {
        this.save.emit(this.editedText || null);
    }
}
