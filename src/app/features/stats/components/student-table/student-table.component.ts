import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
    selector: 'app-student-table',
    standalone: true,
    imports: [MatTableModule, MatSortModule, MatPaginatorModule],
    templateUrl: './student-table.component.html',
    styleUrl: './student-table.component.scss'
})
export class StudentTableComponent {
    @Input() dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
    @Input() displayedColumns: string[] = [];
    @Input() totalCount: number = 0;
    @Input() pageIndex: number = 0;
    @Input() pageSize: number = 20;
    @Input() pageSizeOptions: number[] = [20, 50, 1000];

    @Output() pageChanged: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
    @Output() rowClicked: EventEmitter<string> = new EventEmitter<string>();

    onPageChange(event: PageEvent): void {
        this.pageChanged.emit(event);
    }

    onRowClick(studentId: string): void {
        this.rowClicked.emit(studentId);
    }
}
