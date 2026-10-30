import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Dialog } from '@angular/cdk/dialog';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';

import { Booklet, BookletDistrict, BookletExam } from '../../../../core/models/booklet.model';
import { District } from '../../../../core/models/district.model';
import { Exam } from '../../../../core/models/exam.model';

import { BookletService } from '../../../exams/services/booklet.service';
import { ExamService } from '../../../exams/services/exam.service';
import { DistrictService } from '../../../districts/services/district.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FilterMemoryService } from '../../../../core/services/filter-memory.service';

import {
    LucideAngularModule,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    BookOpen,
    Edit,
    Trash2
} from 'lucide-angular';
import {
    ListLayoutComponent,
    ActionButton
} from '../../../../shared/components/ui/list-layout/list-layout.component';
import {
    DataTableComponent,
    TableColumn,
    TableAction,
    PaginationEvent
} from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { BookletEditDialogComponent, BookletEditDialogResult } from '../booklet-edit-dialog/booklet-edit-dialog.component';

@Component({
    selector: 'app-booklets-list',
    imports: [
    FormsModule,
    LucideAngularModule,
    ListLayoutComponent,
    DataTableComponent,
    FullscreenPanelComponent
],
    templateUrl: './booklets-list.component.html',
    styleUrls: ['./booklets-list.component.scss']
})
export class BookletsListComponent implements OnInit, OnDestroy {
    // Data
    booklets: Booklet[] = [];
    exams: Exam[] = [];
    districts: District[] = [];

    // State
    isLoading = false;
    hasError = false;
    errorMessage = '';

    // Pagination
    totalCount = 0;
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    pageIndex = 0;
    tableFullscreen = false;

    // Sorting
    sortColumn = 'grade';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Filters
    selectedExamId: string | number | null = null;
    selectedDistrictId: string | number | null = null;

    // UI State
    filtersExpanded = true;

    // Icons
    readonly RefreshCw = RefreshCw;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;
    readonly ExternalLink = ExternalLink;
    readonly BookOpen = BookOpen;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;

    private destroy$ = new Subject<void>();

    // Exam id from the URL: the exam list loads async, so it is applied there (instead of the default latest exam).
    private restoredExamId: string | null = null;

    private readonly toastDurationMs = 4000;

    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'name',         label: 'Ad',       sortable: false, type: 'text' },
        { key: 'variant',      label: 'Variant',  sortable: true,  type: 'text' },
        { key: 'grade',        label: 'Sinif',    sortable: true,  type: 'number' },
        { key: 'districtName', label: 'Təhsil sektoru',    sortable: false, type: 'text' },
        { key: 'examName',     label: 'İmtahan',  sortable: false, type: 'text' },
    ];

    tableActions: TableAction[] = [
        {
            key: 'open-public',
            label: 'İctimai keçid',
            icon: ExternalLink,
            variant: 'outline'
        },
        // {
        //     key: 'edit',
        //     label: 'Redaktə et',
        //     icon: Edit,
        //     variant: 'outline',
        //     condition: () => this.authService.canEditBooklets()
        // },
        {
            key: 'delete',
            label: 'Sil',
            icon: Trash2,
            variant: 'danger',
            condition: () => this.authService.canDeleteBooklets()
        }
    ];

    actionButtons: ActionButton[] = [];

    constructor(
        private bookletService: BookletService,
        private examService: ExamService,
        private districtService: DistrictService,
        private authService: AuthService,
        private dialog: Dialog,
        private toastService: ToastService,
        private router: Router,
        private route: ActivatedRoute,
        private filterMemory: FilterMemoryService
    ) {}

    ngOnInit(): void {
        // Filters live in the URL (syncStateToUrl) and FilterMemoryService puts the last ones back
        // when the page is opened without them: read the snapshot once, before the first load.
        const queryParams = this.route.snapshot.queryParams;
        if (queryParams['examId']) {
            this.restoredExamId = String(queryParams['examId']);
        }
        if (queryParams['districtId']) {
            this.selectedDistrictId = queryParams['districtId'];
        }
        const pageIndex = parseInt(queryParams['pageIndex']);
        if (!isNaN(pageIndex) && pageIndex > 0) {
            this.pageIndex = pageIndex;
        }
        const pageSize = parseInt(queryParams['pageSize']);
        if (!isNaN(pageSize) && pageSize > 0) {
            this.pageSize = pageSize;
        }
        if (queryParams['sortColumn']) {
            this.sortColumn = queryParams['sortColumn'];
        }
        if (queryParams['sortDirection'] === 'asc' || queryParams['sortDirection'] === 'desc') {
            this.sortDirection = queryParams['sortDirection'];
        }
        // The filter panel is expanded by default, so there is nothing to open for restored filters;
        // consume the flag anyway so it does not leak to the next page.
        this.filterMemory.takeRestored();

        this.loadExamsForFilter();
        this.loadDistrictsForFilter();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Filters/sort/page go to the URL on every change (replaceUrl, history stays clean) so
     *  FilterMemoryService can remember them for the next visit from the menu.
     *  «Bütün imtahanlar» is a real choice (the default is the latest exam), so it is written as examId=all. */
    private syncStateToUrl(): void {
        if (!this.router.url.startsWith('/booklets')) return;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                examId: this.selectedExamId ? this.selectedExamId : 'all',
                districtId: this.selectedDistrictId || undefined,
                pageIndex: this.pageIndex || undefined,
                pageSize: this.pageSize === TABLE_PAGE_SIZE_DEFAULT ? undefined : this.pageSize,
                sortColumn: this.sortColumn === 'grade' ? undefined : this.sortColumn,
                sortDirection: this.sortDirection === 'asc' ? undefined : this.sortDirection,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private loadExamsForFilter(): void {
        this.examService.getExamsForFilter()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const list: Exam[] = Array.isArray(response) ? response : (response?.data ?? []);
                    // Sort by date desc and pick the latest
                    this.exams = [...list].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    if (this.restoredExamId === 'all') {
                        this.selectedExamId = null;
                    } else if (this.restoredExamId && this.exams.some(e => String(e.id) === this.restoredExamId)) {
                        this.selectedExamId = this.restoredExamId;
                    } else if (this.exams.length > 0) {
                        this.selectedExamId = this.exams[0].id;
                    }
                    this.loadBooklets();
                },
                error: () => {
                    this.loadBooklets();
                }
            });
    }

    private loadDistrictsForFilter(): void {
        this.districtService.getDistrictsForFilter()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (list: District[]) => {
                    this.districts = list;
                },
                error: () => {}
            });
    }

    loadBooklets(): void {
        this.isLoading = true;
        this.hasError = false;

        const params: any = {
            page: this.pageIndex + 1,
            size: this.pageSize,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
        };

        if (this.selectedExamId)     params.examId     = this.selectedExamId;
        if (this.selectedDistrictId) params.districtId = this.selectedDistrictId;

        this.bookletService.getBooklets(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    // Flatten nested fields for DataTable
                    this.booklets = response.data.map(b => ({
                        ...b,
                        districtName: this.getDistrictName(b),
                        examName:     this.getExamName(b),
                    } as any));
                    this.totalCount = response.totalCount;
                    this.isLoading = false;
                },
                error: (err: any) => {
                    console.error('Error loading booklets:', err);
                    this.isLoading = false;
                    this.hasError = true;
                    this.errorMessage = 'Kitabçalar yüklənərkən xəta baş verdi';
                }
            });
    }

    private getDistrictName(b: Booklet): string {
        if (!b.district) return '—';
        if (typeof b.district === 'object') return (b.district as BookletDistrict).name;
        return '—';
    }

    private getExamName(b: Booklet): string {
        if (!b.exam) return '—';
        if (typeof b.exam === 'object') {
            const e = b.exam as BookletExam;
            return e.name;
        }
        return '—';
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    onExamChange(): void {
        this.pageIndex = 0;
        this.loadBooklets();
        this.syncStateToUrl();
    }

    onDistrictChange(): void {
        this.pageIndex = 0;
        this.loadBooklets();
        this.syncStateToUrl();
    }

    onTableAction(event: { action: string; item: any }): void {
        const booklet = event.item as Booklet;
        switch (event.action) {
            case 'open-public':
                window.open(`/public/booklets/${booklet.id}`, '_blank');
                break;
            case 'edit':
                this.openEditDialog(booklet);
                break;
            case 'delete':
                this.openDeleteConfirm(booklet);
                break;
        }
    }

    private openEditDialog(booklet: Booklet): void {
        const dialogRef = this.dialog.open<any>(BookletEditDialogComponent, {
            width: '550px',
            data: { booklet, canDelete: this.authService.canDeleteBooklets() }
        });

        dialogRef.closed.subscribe((result: BookletEditDialogResult | null | undefined) => {
            if (!result) return;
            if (result.action === 'save' && result.data) {
                this.bookletService.updateBooklet(booklet.id, result.data)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.toastService.show('Kitabça uğurla redaktə edildi', 'success', this.toastDurationMs);
                            this.loadBooklets();
                        },
                        error: () => {
                            this.toastService.show('Redaktə zamanı xəta baş verdi', 'error', this.toastDurationMs);
                        }
                    });
            } else if (result.action === 'delete') {
                this.openDeleteConfirm(booklet);
            }
        });
    }

    private openDeleteConfirm(booklet: Booklet): void {
        const dialogRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '420px',
            data: {
                title: 'Kitabçanı sil',
                text: `"${booklet.name || ('Variant ' + booklet.variant)}" kitabçasını silmək istədiyinizə əminsinizmi?`
            }
        });

        dialogRef.closed.subscribe((confirmed: boolean | undefined) => {
            if (!confirmed) return;
            this.bookletService.deleteBooklet(booklet.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.toastService.show('Kitabça uğurla silindi', 'success', this.toastDurationMs);
                        this.loadBooklets();
                    },
                    error: () => {
                        this.toastService.show('Silmə zamanı xəta baş verdi', 'error', this.toastDurationMs);
                    }
                });
        });
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadBooklets();
        this.syncStateToUrl();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
        this.loadBooklets();
        this.syncStateToUrl();
    }
}
