import { Component, DestroyRef, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { LucideAngularModule, ArchiveRestore, RefreshCw } from 'lucide-angular';
import { DeletionsService } from '../../services/deletions.service';
import { DeletionCounts, DeletionEntityType, DeletionItem } from '../../../../core/models/deletion.model';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { DataTableComponent, PaginationEvent, TableAction, TableColumn } from '../../../../shared/components/ui/data-table/data-table.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ConfirmDialogService } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';

/** Dates are shown in Baku time regardless of the browser's timezone. */
const BAKU_TZ = '+0400';

const TYPE_LABELS: Record<DeletionEntityType, string> = {
    district: 'Rayon',
    school: 'Məktəb',
    teacher: 'Layihə müəllimi',
    student: 'Şagird',
};

/** `1 234` — a plain space as the thousands separator (toLocaleString would insert a non-breaking one). */
function groupThousands(n: number): string {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * «Silinənlər» (SOFT_DELETE_TASK.md §8): districts / schools / teachers / students hidden by a soft delete, with who
 * deleted them and when, and «Bərpa et» to bring a whole batch (the entity plus what was hidden with it) back.
 */
@Component({
    selector: 'app-deleted-items',
    imports: [FormsModule, LucideAngularModule, ButtonComponent, DataTableComponent, SelectComponent, InputComponent],
    templateUrl: './deleted-items.component.html',
})
export class DeletedItemsComponent implements OnInit {
    @ViewChild('nameCell', { static: true }) nameCellTemplate!: TemplateRef<any>;

    private deletionsService = inject(DeletionsService);
    private confirmDialog = inject(ConfirmDialogService);
    private toastService = inject(ToastService);
    private destroyRef = inject(DestroyRef);

    readonly ArchiveRestore = ArchiveRestore;
    readonly RefreshCw = RefreshCw;

    readonly typeOptions: SelectOption[] = [
        { value: 'district', label: 'Rayonlar' },
        { value: 'school', label: 'Məktəblər' },
        { value: 'teacher', label: 'Layihə müəllimləri' },
        { value: 'student', label: 'Şagirdlər' },
    ];
    readonly pageSizeOptions = [
        { value: 25, label: '25' },
        { value: 50, label: '50' },
        { value: 100, label: '100' },
    ];

    selectedType: DeletionEntityType | null = null;
    search = '';
    items: DeletionItem[] = [];
    totalCount = 0;
    pageIndex = 0;
    pageSize = 25;
    loading = false;
    restoringId: number | null = null;

    columns: TableColumn[] = [];
    readonly actions: TableAction[] = [
        { key: 'restore', label: 'Bərpa et', icon: ArchiveRestore, variant: 'primary' },
    ];

    private search$ = new Subject<void>();

    ngOnInit(): void {
        this.columns = [
            { key: 'entityType', label: 'Növ', field: 'entityType', width: '140px', formatter: (v: DeletionEntityType) => TYPE_LABELS[v] ?? v },
            { key: 'name', label: 'Ad', cellTemplate: this.nameCellTemplate },
            { key: 'path', label: 'Harada', field: 'path', formatter: (_v: unknown, row: DeletionItem) => this.pathLabel(row) },
            { key: 'counts', label: 'Daxilində', field: 'counts', formatter: (v: DeletionCounts) => this.insideLabel(v) },
            { key: 'deletedBy', label: 'Silən', field: 'deletedBy', formatter: (v: DeletionItem['deletedBy']) => v?.email ?? '—' },
            { key: 'deletedAt', label: 'Silinmə tarixi', field: 'deletedAt', width: '150px', formatter: (v: string) => this.formatDateTime(v) },
        ];

        this.load();

        this.search$
            .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.pageIndex = 0;
                this.load();
            });
    }

    load(): void {
        this.loading = true;
        this.deletionsService.getDeletions({
            type: this.selectedType ?? undefined,
            search: this.search.trim() || undefined,
            page: this.pageIndex + 1,
            size: this.pageSize,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.items = result?.data ?? [];
                    this.totalCount = result?.totalCount ?? 0;
                    this.loading = false;
                    // The last row of the last page was restored: step back instead of showing an empty page.
                    if (this.items.length === 0 && this.pageIndex > 0) {
                        this.pageIndex--;
                        this.load();
                    }
                },
                error: (err: Error) => {
                    this.loading = false;
                    this.toastService.show(err.message || 'Silinənlər yüklənərkən xəta baş verdi', 'error');
                },
            });
    }

    onTypeChange(): void {
        this.pageIndex = 0;
        this.load();
    }

    onSearchChange(): void {
        this.search$.next();
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.load();
    }

    onTableAction(event: { action: string; item: DeletionItem }): void {
        if (event.action === 'restore') void this.restore(event.item);
    }

    private async restore(item: DeletionItem): Promise<void> {
        if (this.restoringId !== null) return;

        const together = this.insideLabel(item.counts, false);
        const confirmed = await this.confirmDialog.confirm({
            title: 'Bərpa et',
            message: `«${item.name ?? '—'}» bərpa edilsin?` + (together ? ` Onunla birlikdə silinmiş ${together} də bərpa olunacaq.` : ''),
            confirmText: 'Bərpa et',
        });
        if (!confirmed) return;

        this.restoringId = item.id;
        this.deletionsService.restore(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.restoringId = null;
                    this.toastService.show('Bərpa edildi', 'success');
                    // The row leaves the list: the batch is no longer active.
                    this.items = this.items.filter(i => i.id !== item.id);
                    this.totalCount = Math.max(0, this.totalCount - 1);
                    this.load();
                },
                error: (err: Error) => {
                    this.restoringId = null;
                    // 404 / 409 carry a readable server text («Əvvəlcə ... bərpa edin», «Artıq bərpa edilib»).
                    this.toastService.show(err.message || 'Bərpa zamanı xəta baş verdi', 'error');
                    this.load();
                },
            });
    }

    // ---- formatting ----

    /** `rayon › məktəb › müəllim` — whatever applies to the entity. */
    pathLabel(item: DeletionItem): string {
        const { districtName, schoolName, teacherName } = item.path ?? {};
        const parts = [districtName, schoolName, teacherName].filter((p): p is string => !!p);
        return parts.length > 0 ? parts.join(' › ') : '—';
    }

    /**
     * «3 məktəb, 41 müəllim, 912 şagird, 2 300 nəticə» — empty parts are skipped. With `withResults = false` the
     * results are left out (the confirm text only names the entities that come back).
     */
    insideLabel(counts: DeletionCounts | null | undefined, withResults = true): string {
        if (!counts) return withResults ? '—' : '';
        const parts: string[] = [];
        if (counts.schools > 0) parts.push(`${groupThousands(counts.schools)} məktəb`);
        if (counts.teachers > 0) parts.push(`${groupThousands(counts.teachers)} müəllim`);
        if (counts.students > 0) parts.push(`${groupThousands(counts.students)} şagird`);
        if (withResults && counts.results > 0) parts.push(`${groupThousands(counts.results)} nəticə`);
        return parts.length > 0 ? parts.join(', ') : (withResults ? '—' : '');
    }

    formatDateTime(value: string | null | undefined): string {
        if (!value) return '—';
        return formatDate(value, 'dd.MM.yyyy HH:mm', 'en-US', BAKU_TZ);
    }
}
