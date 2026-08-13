
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumn } from '../../models/tableColumn.model';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-table',
    imports: [MatButtonModule, MatTableModule, MatIconModule, MatPaginatorModule],
    templateUrl: './table.component.html',
    styleUrl: './table.component.scss'
})
export class TableComponent<T> implements OnInit, OnChanges {
    @Input() data: T[] = [];
    @Input() isLoading: boolean = false;
    @Input() hasError: boolean = false;
    @Input() totalCount: number = 0;
    @Input() pageSize: number = 100;
    @Input() pageIndex: number = 0;
    @Input() actions?: {edit?: boolean, delete?: boolean};
    @Input() tableColumns: TableColumn[] = []; // This is the enum that contains the column names
    @Input() isAdminOrSuperAdmin: boolean = false; // This is the enum that contains the column names
    
    @Output() edit = new EventEmitter<T>();
    @Output() delete = new EventEmitter<any>();
    @Output() pageChange = new EventEmitter<PageEvent>();

    displayedColumns: string[] = [];
    dataSource = new MatTableDataSource<T>([]);

    ngOnInit() {
        this.updateDisplayedColumns();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data']) {
            this.dataSource.data = this.data;
        }
        if (changes['columns']) {
            this.updateDisplayedColumns();
        }
    }

    updateDisplayedColumns() {
        this.displayedColumns = this.tableColumns.map(column => column.key);
        if (this.actions?.edit || this.actions?.delete) {
            this.displayedColumns.push('actions');
        }
    }

    onUpdate(row: T) {
        this.edit.emit(row);
    }

    onDelete(id: any) {
        this.delete.emit(id);
    }

    onPageChange(event: PageEvent) {
        this.pageChange.emit(event);
    }
}
