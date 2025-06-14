import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Teacher } from '../../../../core/models/teacher.model';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';

@Component({
    selector: 'app-teachers-year-tab',
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
    templateUrl: './teachers-year-tab.component.html',
    styleUrl: './teachers-year-tab.component.scss'
})
export class TeachersYearTabComponent {
    @Input() teachers: Teacher[] = [];
    @Input() displayedColumns: string[] = [];
    @Input() totalCount: number = 0;
    @Input() pageSize: number = 1000;
    @Input() pageIndex: number = 0;
    @Input() isLoading: boolean = false;

    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() pageChanged = new EventEmitter<PageEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();
}
