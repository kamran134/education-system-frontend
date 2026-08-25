import { Component, ChangeDetectionStrategy, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Camera, Edit2 } from 'lucide-angular';
import { ImageCropModalComponent } from '../../modals/image-crop-modal/image-crop-modal.component';

export interface ProfileHeroSubtitlePart {
    text: string;
    link?: any[];
}

export interface ProfileHeroFact {
    label: string;
    value: string | null;
    /** Занимает всю ширину сетки фактов (например Ünvan школы). */
    wide?: boolean;
}

/**
 * Шапка профиля учителя/школы/района/региона (PROFILES_V3_TASK.md §4). Два варианта:
 * "person" — круглое фото слева, факты в одну строку (учитель); "entity" — фото 16:9 слева,
 * данные справа (школа/район/регион). Reytinq xalı и места учебных заведений сюда больше не
 * входят (BASE_FIXES_TASK.md §2.1, заказчик прямым текстом попросил убрать балл из шапки с
 * фото) — они остаются только в отдельном блоке «Reytinqlər» и на карточках сущностей.
 *
 * Презентационный компонент — загрузку аватара делегирует наверх через avatarSelected
 * (сам только валидирует файл и открывает кроппер), сохранение — на странице.
 */
@Component({
    selector: 'app-profile-hero',
    imports: [CommonModule, RouterModule, LucideAngularModule, ImageCropModalComponent],
    templateUrl: './profile-hero.component.html',
    styleUrl: './profile-hero.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeroComponent {
    @Input() variant: 'person' | 'entity' = 'person';
    @Input() eyebrow: string | null = null;
    @Input() title = '';
    @Input() subtitleParts: ProfileHeroSubtitlePart[] = [];
    @Input() facts: ProfileHeroFact[] = [];
    @Input() avatarUrl: string | null = null;
    /** Полное редактирование сущности (диалог со всеми полями, включая code/district/...) —
     *  только admin-подобные роли. */
    @Input() canEdit = false;
    /** Самостоятельно заполняемые факты (BASE_FIXES_TASK.md §2.6) — admin-подобные роли ИЛИ
     *  владелец сущности. Раньше это было тем же самым, что canEdit, — теперь может быть true
     *  у владельца, когда canEdit (полный доступ) остаётся false. */
    @Input() canEditFacts = false;
    /** Есть страницы (регион), где ни один факт не редактируется отдельной формой — там
     *  ссылка "Profil məlumatlarını redaktə et" была бы мёртвой кнопкой. */
    @Input() showEditFactsLink = true;
    /** Заказчик просил разные подписи по типу сущности («Məktəb məlumatlarını yenilə» и т.п.,
     *  BASE_FIXES_TASK.md §2.6) — общий дефолт остаётся для админского «Profil məlumatlarını
     *  redaktə et». */
    @Input() editFactsLabel = 'Profil məlumatlarını redaktə et';
    @Input() canUploadPhoto = false;
    @Input() isUploading = false;

    @Output() editClicked = new EventEmitter<void>();
    @Output() editFactsClicked = new EventEmitter<void>();
    @Output() avatarSelected = new EventEmitter<Blob>();
    @Output() uploadRejected = new EventEmitter<string>();

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    readonly Camera = Camera;
    readonly Edit2 = Edit2;

    isCropModalOpen = false;
    imageChangedEvent: any = null;

    get initials(): string {
        return this.title
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase();
    }

    /** Детерминированный от заголовка индекс — та же карточка всегда получает тот же тон заглушки. */
    /**
     * Пустой факт скрывается целиком у обычного посетителя — но у того, кто вправе его
     * заполнить, остаётся видимым с плейсхолдером "Doldurulmayıb" (PROFILES_V3_TASK.md §4.4),
     * иначе админ не поймёт, что поле вообще существует.
     */
    get visibleFacts(): ProfileHeroFact[] {
        return this.canEdit || this.canEditFacts ? this.facts : this.facts.filter((f) => f.value !== null);
    }

    get placeholderTone(): number {
        let hash = 0;
        for (let i = 0; i < this.title.length; i++) {
            hash = (hash * 31 + this.title.charCodeAt(i)) % 6;
        }
        return hash;
    }

    get aspectRatio(): number {
        return this.variant === 'entity' ? 16 / 9 : 1;
    }

    get resizeToWidth(): number {
        return this.variant === 'entity' ? 1600 : 800;
    }

    openFilePicker(): void {
        if (!this.canUploadPhoto) return;
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];

        if (file.size > 10 * 1024 * 1024) {
            this.uploadRejected.emit('Fayl ölçüsü 10MB-dan böyük ola bilməz');
            input.value = '';
            return;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            this.uploadRejected.emit('Yalnız JPEG, JPG və PNG formatları qəbul edilir');
            input.value = '';
            return;
        }

        this.imageChangedEvent = event;
        this.isCropModalOpen = true;
    }

    closeCropModal(): void {
        this.isCropModalOpen = false;
        this.imageChangedEvent = null;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    onAvatarSave(croppedImage: Blob): void {
        this.avatarSelected.emit(croppedImage);
        this.closeCropModal();
    }
}
