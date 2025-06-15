import { Component, EventEmitter, Input, Output } from '@angular/core';
import { District } from '../../../../core/models/district.model';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';

@Component({
    selector: 'app-districts-year-tab',
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
    templateUrl: './districts-year-tab.component.html',
    styleUrl: './districts-year-tab.component.scss'
})
export class DistrictsYearTabComponent {
    @Input() districts: District[] = [];
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
