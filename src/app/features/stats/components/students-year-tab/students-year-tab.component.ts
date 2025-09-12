import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { Student } from '../../../../core/models/student.model';

@Component({
    selector: 'app-students-year-tab',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatIconModule,
        RoundNumberPipe
    ],
    templateUrl: './students-year-tab.component.html',
    styleUrl: './students-year-tab.component.scss'
})
export class StudentsYearTabComponent implements OnChanges {
    @Input() students: Student[] = [];
    @Input() displayedColumns: string[] = [];
    @Input() totalCount: number = 0;
    @Input() pageSize: number = 1000;
    @Input() pageIndex: number = 0;
    @Input() isLoading: boolean = false;
  
    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() pageChanged = new EventEmitter<PageEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();

    dataSource = new MatTableDataSource<Student>([]);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['students']) {
            // Ensure we always pass an array; fallback to empty array
            this.dataSource.data = Array.isArray(this.students) ? this.students : [];
        }
    }
}
