import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Booklet, BookletDistrict, BookletExam } from '../../../../core/models/booklet.model';
import { District } from '../../../../core/models/district.model';
import { Exam } from '../../../../core/models/exam.model';

import { BookletService } from '../../../exams/services/booklet.service';
import { ExamService } from '../../../exams/services/exam.service';
import { DistrictService } from '../../../districts/services/district.service';

import {
    LucideAngularModule,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    BookOpen
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

@Component({
    selector: 'app-booklets-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        ListLayoutComponent,
        DataTableComponent
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
    pageSize = 25;
    pageIndex = 0;

    // Sorting
    sortColumn = 'grade';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Filters
    selectedExamId: string | null = null;
    selectedDistrictId: string | null = null;

    // UI State
    filtersExpanded = true;

    // Icons
    readonly RefreshCw = RefreshCw;
    readonly ChevronDown = ChevronDown;
    readonly ChevronUp = ChevronUp;
    readonly ExternalLink = ExternalLink;
    readonly BookOpen = BookOpen;

    private destroy$ = new Subject<void>();

    // Table configuration
    tableColumns: TableColumn[] = [
        { key: 'name',         label: 'Ad',       sortable: false, type: 'text' },
        { key: 'variant',      label: 'Variant',  sortable: true,  type: 'text' },
        { key: 'grade',        label: 'Sinif',    sortable: true,  type: 'number' },
        { key: 'districtName', label: 'Rayon',    sortable: false, type: 'text' },
        { key: 'examName',     label: 'İmtahan',  sortable: false, type: 'text' },
    ];

    tableActions: TableAction[] = [
        {
            key: 'open-public',
            label: 'İctimai keçid',
            icon: ExternalLink,
            variant: 'outline'
        }
    ];

    actionButtons: ActionButton[] = [];

    constructor(
        private bookletService: BookletService,
        private examService: ExamService,
        private districtService: DistrictService
    ) {}

    ngOnInit(): void {
        this.loadExamsForFilter();
        this.loadDistrictsForFilter();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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
                    if (this.exams.length > 0) {
                        this.selectedExamId = this.exams[0]._id;
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
            return `${e.name} (${e.code})`;
        }
        return '—';
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    onExamChange(): void {
        this.pageIndex = 0;
        this.loadBooklets();
    }

    onDistrictChange(): void {
        this.pageIndex = 0;
        this.loadBooklets();
    }

    onTableAction(event: { action: string; item: any }): void {
        if (event.action === 'open-public') {
            const booklet = event.item as Booklet;
            window.open(`/public/booklets/${booklet._id}`, '_blank');
        }
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadBooklets();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
        this.loadBooklets();
    }
}
