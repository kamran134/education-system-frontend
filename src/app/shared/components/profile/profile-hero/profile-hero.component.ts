import { Component, ChangeDetectionStrategy, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Camera, Edit2 } from 'lucide-angular';
import { ImageCropModalComponent } from '../../modals/image-crop-modal/image-crop-modal.component';

export interface ProfileHeroChip {
    label: string;
    value: string;
}

export interface ProfileHeroSubtitlePart {
    text: string;
    link?: any[];
}

export interface ProfileHeroRank {
    place: number;
    total?: number;
    label: string;
}

/**
 * Шапка профиля учителя/школы/района (PROFILES_TASK.md §5). Два варианта: "portrait" —
 * фото-портрет 3:4 (учитель), "banner" — широкий баннер 3:1 с затемнением (школа/район).
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
    @Input() variant: 'portrait' | 'banner' = 'portrait';
    @Input() eyebrow: string | null = null;
    @Input() title = '';
    @Input() subtitleParts: ProfileHeroSubtitlePart[] = [];
    @Input() chips: ProfileHeroChip[] = [];
    @Input() avatarUrl: string | null = null;
    @Input() rank: ProfileHeroRank | null = null;
    @Input() canEdit = false;
    @Input() canUploadPhoto = false;
    @Input() isUploading = false;

    @Output() editClicked = new EventEmitter<void>();
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
    get placeholderTone(): number {
        let hash = 0;
        for (let i = 0; i < this.title.length; i++) {
            hash = (hash * 31 + this.title.charCodeAt(i)) % 6;
        }
        return hash;
    }

    get aspectRatio(): number {
        return this.variant === 'banner' ? 3 : 3 / 4;
    }

    get resizeToWidth(): number {
        return this.variant === 'banner' ? 1600 : 600;
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
