import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TableColumn } from '../../models/tableColumn.model';

@Component({
  selector: 'app-reusable-stats-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './reusable-stats-table.component.html',
  styleUrls: []
})
export class ReusableStatsTableComponent<T extends { id: number }> implements OnInit, OnChanges {
    @Input() data: T[] = [];
    @Input() tableColumns: TableColumn[] = [];
    @Input() totalCount: number = 0;
    @Input() pageSize: number = 1000;
    @Input() pageIndex: number = 0;
    @Input() isLoading: boolean = false;
    @Input() showPaginator: boolean = true;

    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() pageChanged = new EventEmitter<PageEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();

    readonly String = String;

    displayedColumns: string[] = [];
    dataSource = new MatTableDataSource<T>([]);

    ngOnInit() {
        this.updateDisplayedColumns();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data']) {
            this.dataSource.data = this.data;
        }
        if (changes['tableColumns']) {
            this.updateDisplayedColumns();
        }
    }

    updateDisplayedColumns() {
        this.displayedColumns = this.tableColumns.map(column => column.key);
    }
}
