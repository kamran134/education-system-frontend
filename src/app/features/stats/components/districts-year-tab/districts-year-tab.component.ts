import { Component, EventEmitter, Input, Output } from '@angular/core';
import { District } from '../../../../core/models/district.model';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { DataTableComponent, TableColumn, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { FilterPlaceBasis, filterPlaceSublabel } from '../../../../core/utils/filter-place-basis.util';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { LucideAngularModule, ArrowLeft, Download } from 'lucide-angular';

const PLACE_FORMATTER = (v: number) => (v ? String(v) : '—');
/**
 * Columns of the fullscreen view (owner's decision 24.10.2026): name, scores and every place, each by ümumi
 * and by orta xal, so a user sees where they stand without configuring columns or filters.
 */
const FULLSCREEN_COLUMNS: string[] = ['name', 'score', 'averageScore', 'filterPlace', 'place', 'averagePlace'];
const FILTER_PLACE_FORMATTER = (v: number) => (v > 0 ? String(v) : '—');
const COUNT_FORMATTER = (v: number) => String(v || 0);

@Component({
    selector: 'app-districts-year-tab',
    imports: [ButtonComponent, DataTableComponent, LucideAngularModule],
    templateUrl: './districts-year-tab.component.html'
})
export class DistrictsYearTabComponent {
    @Input() districts: District[] = [];
    @Input() displayedColumns: string[] = [];
    @Input() totalCount: number = 0;
    @Input() pageSize: number = TABLE_PAGE_SIZE_DEFAULT;
    @Input() pageIndex: number = 0;
    @Input() isLoading: boolean = false;
    /** Metric the "Filtr üzrə yer" column was ranked by; shown as a caption under its header. */
    @Input() filterPlaceBasis: FilterPlaceBasis | null = null;
    @Input() canGoBack: boolean = false;
    @Input() fullscreen = false;
    @Input() isExporting = false;

    @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
    @Output() pageChanged = new EventEmitter<PaginationEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();
    @Output() backClicked = new EventEmitter<void>();

    readonly String = String;
    readonly ArrowLeft = ArrowLeft;
    readonly Download = Download;

    private readonly roundPipe = new RoundNumberPipe();

    private readonly allColumns: TableColumn[] = [
        { key: 'place', label: 'Respublika üzrə yer', sortable: true, formatter: PLACE_FORMATTER },
        { key: 'filterPlace', label: 'Filtr üzrə yer', sortable: true, formatter: FILTER_PLACE_FORMATTER },
        { key: 'averagePlace', label: 'Respublika üzrə yer', sublabel: 'orta xal', sortable: true, formatter: PLACE_FORMATTER },
        { key: 'code', label: 'Təhsil sektorunun kodu', sortable: true },
        { key: 'name', label: 'Adı', sortable: true },
        { key: 'studentCount', label: 'Şagird sayı', sortable: true, formatter: COUNT_FORMATTER },
        { key: 'score', label: 'Reytinq xalı', sortable: true, formatter: (v) => this.roundPipe.transform(v) },
        { key: 'averageScore', label: 'Orta reytinq xalı', sortable: true, formatter: (v) => this.roundPipe.transform(v) }
    ];

    get columns(): TableColumn[] {
        const filterPlaceCaption = filterPlaceSublabel(this.filterPlaceBasis);
        // Fullscreen = the fixed "where do I stand" set for every role, the per-role column settings do not apply.
        const keys = this.fullscreen ? FULLSCREEN_COLUMNS : this.displayedColumns;
        return keys
            .map(key => this.allColumns.find(c => c.key === key))
            .filter((c): c is TableColumn => !!c)
            .map(c => (c.key === 'filterPlace' && filterPlaceCaption ? { ...c, sublabel: filterPlaceCaption } : c))
            // Next to its "orta xal" twin the existing raw-score place needs the caption too.
            .map(c => (this.fullscreen && (c.key === 'place' || c.key === 'districtPlace') ? { ...c, sublabel: 'ümumi xal' } : c));
    }

    sortBy = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortBy = event.column;
        this.sortDirection = event.direction;
        this.sortChanged.emit(event);
    }
}
