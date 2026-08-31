import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { DataTableComponent, TableColumn, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT } from '../../../../shared/components/ui/data-table/table-defaults';
import { LucideAngularModule, Download, User } from 'lucide-angular';

/**
 * Renders one of the three month-based rating tabs (developing / month / month-republic).
 * The backend for these tabs returns the full, already-sorted list — no server pagination
 * (see TABLES_STANDARD_TASK.md §3.4) — so paging here is a client-side slice of `dataSource`.
 * Sorting still triggers a server refetch via `sortChanged`, same as before.
 */
@Component({
    selector: 'app-month-student-rating-table',
    imports: [ButtonComponent, DataTableComponent, LucideAngularModule],
    templateUrl: './month-student-rating-table.component.html'
})
export class MonthStudentRatingTableComponent {
    @Input() title = '';
    @Input() dataSource: any[] = [];
    @Input() columns: string[] = [];
    @Input() tableName: 'developingStudents' | 'studentsOfMonth' | 'studentsOfMonthByRepublic' = 'developingStudents';
    @Input() isLoading = false;
    @Input() fullscreen = false;

    @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
    @Output() rowClicked: EventEmitter<string> = new EventEmitter<string>();
    @Output() excelExport: EventEmitter<string> = new EventEmitter<string>();

    readonly Download = Download;
    readonly User = User;

    @ViewChild('avatarCell', { static: true }) avatarCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;

    pageIndex = 0;
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    sortBy = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    private readonly columnDefinitions = new Map<string, TableColumn>([
        ['level', { key: 'level', label: 'Pillə', sortable: true, field: 'level', formatter: (v) => v || '-' }],
        ['code', { key: 'code', label: 'İş nömrəsi', sortable: true, field: 'studentData.code' }],
        ['lastName', { key: 'lastName', label: 'Soyadı', sortable: true, field: 'studentData.lastName' }],
        ['firstName', { key: 'firstName', label: 'Adı', sortable: true, field: 'studentData.firstName' }],
        ['middleName', { key: 'middleName', label: 'Ata adı', sortable: true, field: 'studentData.middleName' }],
        ['totalScore', { key: 'totalScore', label: 'İmtahan balı', sortable: true, field: 'totalScore' }],
        ['grade', { key: 'grade', label: 'Sinifi', sortable: true, field: 'studentData.grade' }],
        ['teacher', { key: 'teacher', label: 'Müəllimi', sortable: true, field: 'studentData.teacher.fullname' }],
        ['school', { key: 'school', label: 'Məktəbi', sortable: true, field: 'studentData.school.name' }],
        ['district', { key: 'district', label: 'Təhsil sektoru', sortable: true, field: 'studentData.district.name' }],
        ['averageScore', { key: 'averageScore', label: 'Orta reytinq xalı', sortable: true, field: 'studentData.averageScore' }],
        ['place', { key: 'place', label: 'Yer', sortable: true, field: 'place' }],
        ['score', { key: 'score', label: 'Reytinq xalı', sortable: true, field: 'score' }]
    ]);

    // Avatar column is always shown first, regardless of the user's column selection —
    // matches the previous student-rating-table behaviour.
    get columns_(): TableColumn[] {
        const avatarColumn: TableColumn = {
            key: 'avatar',
            label: 'Şəkil',
            sortable: false,
            width: '80px',
            field: 'studentData.avatarUrl',
            cellTemplate: this.avatarCellTemplate
        };
        return [avatarColumn, ...this.columns
            .map(key => this.columnDefinitions.get(key))
            .filter((c): c is TableColumn => !!c)];
    }

    get pagedData(): any[] {
        const start = this.pageIndex * this.pageSize;
        return this.dataSource.slice(start, start + this.pageSize);
    }

    get totalCount(): number {
        return this.dataSource.length;
    }

    onSort(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortBy = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
        this.sortChanged.emit(event);
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
    }

    onRowClick(row: any): void {
        this.rowClicked.emit(String(row.studentData.id));
    }

    onExportToExcel(): void {
        this.excelExport.emit(this.tableName);
    }
}
