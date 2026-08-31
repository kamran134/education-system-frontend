import { Component, DestroyRef, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ClipboardCheck, Check, X } from 'lucide-angular';
import { ProfileChangeService } from '../../../../core/services/profile-change.service';
import { ProfileChangeEntityType, ProfileChangeQueueRow } from '../../../../core/models/profile-change.model';
import { SnackBarService } from '../../../commonComponents/services/snack-bar.service';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/ui/data-table/data-table.component';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';

const ENTITY_TYPE_LABELS: Record<ProfileChangeEntityType, string> = {
    school: 'Məktəb',
    teacher: 'Müəllim',
    district: 'Təhsil sektoru',
};

const ENTITY_PROFILE_ROUTE: Record<ProfileChangeEntityType, string> = {
    school: '/schools',
    teacher: '/teachers',
    district: '/districts',
};

const FIELD_LABELS: Record<string, string> = {
    directorName: 'Məktəbin direktoru',
    foundedYear: 'Məktəbin yaranma ili',
    achievements: 'Uğurları',
    gradeLabel: 'Sinfi',
    pedagogicalExperienceYears: 'Pedaqoji stajı',
    educationHeadName: 'Təhsil sektorunun müdiri',
};

/**
 * Очередь модерации (BASE_FIXES_TASK.md §2.7) — единственное место, где админ видит все
 * самостоятельно введённые изменения школ/учителей/районов, ожидающие подтверждения. Без неё
 * админ узнаёт о новых данных только заходя в конкретный профиль, а заказчик именно этого
 * и просил избежать («чтобы не натыкались случайно»).
 */
@Component({
    selector: 'app-profile-changes',
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent, FullscreenPanelComponent],
    templateUrl: './profile-changes.component.html',
    styleUrl: './profile-changes.component.scss',
})
export class ProfileChangesComponent implements OnInit {
    @ViewChild('entityCell', { static: true }) entityCellTemplate!: TemplateRef<any>;
    @ViewChild('diffCell', { static: true }) diffCellTemplate!: TemplateRef<any>;
    @ViewChild('submittedAtCell', { static: true }) submittedAtCellTemplate!: TemplateRef<any>;

    rows: ProfileChangeQueueRow[] = [];
    isLoading = true;
    tableFullscreen = false;

    readonly ClipboardCheck = ClipboardCheck;

    private destroyRef = inject(DestroyRef);

    constructor(
        private profileChangeService: ProfileChangeService,
        private snackBarService: SnackBarService
    ) {}

    ngOnInit(): void {
        this.load();
    }

    get tableColumns(): TableColumn[] {
        return [
            { key: 'entityTypeLabel', label: 'Növ', field: 'entityTypeLabel', width: '110px' },
            { key: 'entityName', label: 'Ad', cellTemplate: this.entityCellTemplate },
            { key: 'diff', label: 'Nə dəyişib', cellTemplate: this.diffCellTemplate },
            { key: 'submittedByEmail', label: 'Göndərən', field: 'submittedByEmail' },
            { key: 'submittedAt', label: 'Göndərilib', cellTemplate: this.submittedAtCellTemplate, width: '140px' },
        ];
    }

    readonly tableActions: TableAction[] = [
        { key: 'approve', label: 'Təsdiqlə', icon: Check, variant: 'primary' },
        { key: 'reject', label: 'Rədd et', icon: X, variant: 'danger' },
    ];

    load(): void {
        this.isLoading = true;
        this.profileChangeService.listQueue('pending')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (rows) => {
                    this.rows = rows.map((r) => ({ ...r, entityTypeLabel: ENTITY_TYPE_LABELS[r.entityType] } as any));
                    this.isLoading = false;
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBarService.show('Növbə yüklənərkən xəta baş verdi', 'error');
                }
            });
    }

    profileRoute(row: ProfileChangeQueueRow): any[] {
        return [ENTITY_PROFILE_ROUTE[row.entityType], row.entityId, 'profile'];
    }

    diffRows(row: ProfileChangeQueueRow): { label: string; before: string; after: string }[] {
        const format = (v: any) => (v === null || v === undefined || v === '' ? 'Doldurulmayıb' : String(v));
        return Object.keys(row.payload).map((key) => ({
            label: FIELD_LABELS[key] ?? key,
            before: format(row.current[key]),
            after: format(row.payload[key]),
        }));
    }

    onTableAction(event: { action: string; item: ProfileChangeQueueRow }): void {
        if (event.action === 'approve') this.approve(event.item);
        if (event.action === 'reject') this.reject(event.item);
    }

    private approve(row: ProfileChangeQueueRow): void {
        this.profileChangeService.approve(row.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.snackBarService.show('Məlumatlar təsdiqləndi', 'success');
                    this.load();
                },
                error: () => this.snackBarService.show('Təsdiqlənərkən xəta baş verdi', 'error')
            });
    }

    private reject(row: ProfileChangeQueueRow): void {
        this.profileChangeService.reject(row.id, null)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.snackBarService.show('Məlumatlar rədd edildi', 'success');
                    this.load();
                },
                error: () => this.snackBarService.show('Rədd edilərkən xəta baş verdi', 'error')
            });
    }
}
