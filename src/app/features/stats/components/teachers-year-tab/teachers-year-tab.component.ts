import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Teacher } from '../../../../core/models/teacher.model';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { DataTableComponent, TableColumn, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { LucideAngularModule, ArrowLeft, Download } from 'lucide-angular';

const PLACE_FORMATTER = (v: number) => (v ? String(v) : '—');
const FILTER_PLACE_FORMATTER = (v: number) => (v > 0 ? String(v) : '—');
const COUNT_FORMATTER = (v: number) => String(v || 0);

@Component({
    selector: 'app-teachers-year-tab',
    imports: [ButtonComponent, DataTableComponent, LucideAngularModule],
    templateUrl: './teachers-year-tab.component.html'
})
export class TeachersYearTabComponent {
    @Input() teachers: Teacher[] = [];
    @Input() displayedColumns: string[] = [];
    @Input() totalCount: number = 0;
    @Input() pageSize: number = TABLE_PAGE_SIZE_DEFAULT;
    @Input() pageIndex: number = 0;
    @Input() isLoading: boolean = false;
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
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer', sortable: true, formatter: PLACE_FORMATTER },
        { key: 'place', label: 'Respublika üzrə yer', sortable: true, formatter: PLACE_FORMATTER },
        { key: 'filterPlace', label: 'Filtr üzrə yer', sortable: true, formatter: FILTER_PLACE_FORMATTER },
        { key: 'code', label: 'Müəllimin kodu', sortable: true },
        // Persisted user column key is 'fullName', but the model field is 'fullname'.
        { key: 'fullName', label: 'Soyadı, adı, ata adı', sortable: true, field: 'fullname' },
        { key: 'score', label: 'Reytinq xalı', sortable: true, formatter: (v) => this.roundPipe.transform(v) },
        { key: 'averageScore', label: 'Orta reytinq xalı', sortable: true, formatter: (v) => this.roundPipe.transform(v) },
        { key: 'school', label: 'Məktəbi', sortable: true, field: 'school.name' },
        { key: 'district', label: 'Təhsil sektoru', sortable: true, field: 'district.name' },
        { key: 'studentCount', label: 'Şagird sayı', sortable: true, formatter: COUNT_FORMATTER }
    ];

    get columns(): TableColumn[] {
        return this.displayedColumns
            .map(key => this.allColumns.find(c => c.key === key))
            .filter((c): c is TableColumn => !!c);
    }

    sortBy = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortBy = event.column;
        this.sortDirection = event.direction;
        this.sortChanged.emit(event);
    }
}
