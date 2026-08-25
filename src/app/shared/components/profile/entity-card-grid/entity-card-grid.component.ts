import { Component, ChangeDetectionStrategy, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, ChevronRight, Loader, Camera, Trash2 } from 'lucide-angular';
import { ButtonComponent } from '../../ui/button/button.component';
import { ImageCropModalComponent } from '../../modals/image-crop-modal/image-crop-modal.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

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
 * Загрузка/удаление фото (BASE_FIXES_TASK.md §3.3) — та же схема делегирования, что у
 * app-profile-hero: сама карточка только выбирает файл, кроппит и просит подтверждение
 * удаления, а реальный HTTP-запрос и обновление avatarUrl в массиве — на странице-родителе
 * (у неё уже есть entity-специфичный сервис для аплоада конкретно teacher/student).
 */
@Component({
    selector: 'app-entity-card-grid',
    imports: [CommonModule, RouterModule, LucideAngularModule, ButtonComponent, ImageCropModalComponent],
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
    /** Кто вправе ставить/менять/убирать фото прямо с карточки (директор — учителям своей
     *  школы, учитель/директор — своим ученикам). Отдельного флага на удаление нет — тот же
     *  круг, что и на загрузку (BASE_FIXES_TASK.md §3.1). */
    @Input() canManagePhoto = false;

    @Output() loadMore = new EventEmitter<void>();
    @Output() avatarSelected = new EventEmitter<{ id: number; blob: Blob }>();
    @Output() avatarDeleteConfirmed = new EventEmitter<number>();
    @Output() uploadRejected = new EventEmitter<string>();

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    readonly ChevronRight = ChevronRight;
    readonly Loader = Loader;
    readonly Camera = Camera;
    readonly Trash2 = Trash2;

    isCropModalOpen = false;
    imageChangedEvent: any = null;
    private editingItemId: number | null = null;

    constructor(private dialog: Dialog) {}

    get hasMore(): boolean {
        return this.items.length < this.total;
    }

    get gridClasses(): string {
        return this.layout === 'wide'
            ? 'grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
    }

    get pictureClasses(): string {
        return this.layout === 'wide' ? 'relative overflow-hidden aspect-[16/9]' : 'relative overflow-hidden aspect-[3/4]';
    }

    get aspectRatio(): number {
        return this.layout === 'wide' ? 16 / 9 : 3 / 4;
    }

    get resizeToWidth(): number {
        return this.layout === 'wide' ? 1600 : 600;
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

    openFilePicker(event: Event, itemId: number): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.canManagePhoto) return;
        this.editingItemId = itemId;
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
        if (this.editingItemId != null) {
            this.avatarSelected.emit({ id: this.editingItemId, blob: croppedImage });
        }
        this.closeCropModal();
        this.editingItemId = null;
    }

    requestDelete(event: Event, item: EntityCardItem): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.canManagePhoto || !item.avatarUrl) return;

        const confirmRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Şəkli silmək',
                text: `${item.name} üçün şəkli silmək istədiyinizdən əminsiniz?`,
                confirmText: 'Sil',
                cancelText: 'İmtina'
            }
        });

        confirmRef.closed.subscribe((confirmed) => {
            if (confirmed) this.avatarDeleteConfirmed.emit(item.id);
        });
    }
}
