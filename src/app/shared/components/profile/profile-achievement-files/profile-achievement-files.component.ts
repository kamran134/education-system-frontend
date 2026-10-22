import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, FileText, Upload, Download, ExternalLink, Trash2, Undo2, Clock } from 'lucide-angular';
import { AchievementFile, AchievementFileEntityType } from '../../../../core/models/achievement-file.model';
import { AchievementFileService } from '../../../../core/services/achievement-file.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { SnackBarService } from '../../../../features/commonComponents/services/snack-bar.service';
import { ConfirmDialogService } from '../../ui/confirm-dialog/confirm-dialog.service';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i;

/**
 * Файлы под текстом «Uğurlar» (UGURLAR_FILES_TASK.md §5.2): список с миниатюрами, а для владельца/
 * админа ещё и загрузка/удаление. Права берутся из ответа сервера (`canManage`) — компонент и
 * профиль их сами не вычисляют. Загруженное владельцем уходит в модерацию и до одобрения видно
 * только ему и админу (бейдж «Təsdiq gözləyir»).
 */
@Component({
    selector: 'app-profile-achievement-files',
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './profile-achievement-files.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAchievementFilesComponent implements OnChanges {
    @Input({ required: true }) entityType!: AchievementFileEntityType;
    @Input({ required: true }) entityId!: number;

    /** Number of files the viewer can see — the parent uses it to decide on the empty-text placeholder. */
    @Output() countChange = new EventEmitter<number>();
    /** A file op changed the pending request (owner uploaded/deleted) — the parent refreshes its banner. */
    @Output() changed = new EventEmitter<void>();

    readonly FileText = FileText;
    readonly Upload = Upload;
    readonly Download = Download;
    readonly ExternalLink = ExternalLink;
    readonly Trash2 = Trash2;
    readonly Undo2 = Undo2;
    readonly Clock = Clock;

    readonly files = signal<AchievementFile[]>([]);
    readonly canManage = signal(false);
    readonly limit = signal(20);
    readonly loaded = signal(false);
    readonly uploading = signal(false);
    readonly busyId = signal<number | null>(null);
    readonly slotsLeft = computed(() => Math.max(0, this.limit() - this.files().length));

    private destroyRef = inject(DestroyRef);
    private fileService = inject(AchievementFileService);
    private snackBar = inject(SnackBarService);
    private confirmDialog = inject(ConfirmDialogService);
    private permissions = inject(PermissionsService);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['entityType'] || changes['entityId']) this.reload();
    }

    /** Public: the parent profile calls it after an admin approves/rejects the request. */
    reload(): void {
        if (!this.entityType || !this.entityId) return;
        this.fileService.list(this.entityType, this.entityId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (list) => {
                    this.files.set(list.files);
                    this.canManage.set(list.canManage);
                    this.limit.set(list.limit);
                    this.loaded.set(true);
                    this.countChange.emit(list.files.length);
                },
                error: () => {
                    // Files are an extra block: a failed load must not break the profile page.
                    this.loaded.set(true);
                }
            });
    }

    formatSize(bytes: number): string {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    async onFilesSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const selected = Array.from(input.files ?? []);
        input.value = '';
        if (selected.length === 0 || this.uploading()) return;

        let slots = this.slotsLeft();
        const queue: File[] = [];
        for (const file of selected) {
            if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
                this.snackBar.show(`${file.name}: yalnız PDF, JPG və PNG faylları qəbul edilir`, 'error');
                continue;
            }
            if (file.size > MAX_FILE_BYTES) {
                this.snackBar.show(`${file.name}: fayl çox böyükdür (maksimum 10 MB)`, 'error');
                continue;
            }
            if (slots <= 0) {
                this.snackBar.show(`Maksimum ${this.limit()} fayl yükləmək olar`, 'error');
                break;
            }
            queue.push(file);
            slots--;
        }
        if (queue.length === 0) return;

        this.uploading.set(true);
        let anyUploaded = false;
        // One request per file, in order; a failed file does not stop the rest.
        for (const file of queue) {
            try {
                const result = await firstValueFrom(this.fileService.upload(this.entityType, this.entityId, file));
                anyUploaded = true;
                this.snackBar.show(
                    result.pending ? 'Fayl yükləndi. Admin təsdiqindən sonra profildə görünəcək' : 'Fayl əlavə olundu',
                    'success'
                );
            } catch (error: any) {
                this.snackBar.show(error?.error?.message ?? 'Fayl yüklənərkən xəta baş verdi', 'error');
            }
        }
        this.uploading.set(false);
        if (anyUploaded) this.changed.emit();
        this.reload();
    }

    async remove(file: AchievementFile): Promise<void> {
        // The server decides between instant delete (200) and a removal request (202); the client
        // only has to word the confirmation: an owner's approved file waits for the admin.
        const needsApproval = file.status === 'approved' && !this.permissions.canAccessRoute('canAccessProfileChanges');
        const confirmed = await this.confirmDialog.confirm({
            message: needsApproval ? 'Fayl admin təsdiqindən sonra silinəcək. Davam edilsin?' : 'Fayl birdəfəlik silinəcək. Davam edilsin?',
            variant: 'danger',
            confirmText: 'Sil',
        });
        if (!confirmed) return;

        this.busyId.set(file.id);
        this.fileService.delete(file.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.busyId.set(null);
                    this.snackBar.show(result.pending ? 'Silinmə admin təsdiqinə göndərildi' : 'Fayl silindi', 'success');
                    this.changed.emit();
                    this.reload();
                },
                error: (error) => {
                    this.busyId.set(null);
                    this.snackBar.show(error?.error?.message ?? 'Silinərkən xəta baş verdi', 'error');
                }
            });
    }

    cancelRemoval(file: AchievementFile): void {
        this.busyId.set(file.id);
        this.fileService.cancelRemoval(file.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.busyId.set(null);
                    this.changed.emit();
                    this.reload();
                },
                error: (error) => {
                    this.busyId.set(null);
                    this.snackBar.show(error?.error?.message ?? 'Əməliyyat zamanı xəta baş verdi', 'error');
                }
            });
    }
}
