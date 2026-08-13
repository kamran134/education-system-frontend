import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Region } from '../../../../core/models/region.model';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';

@Component({
    selector: 'app-regions-year-tab',
    imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    ButtonComponent,
    RoundNumberPipe
],
    templateUrl: './regions-year-tab.component.html',
    styleUrl: './regions-year-tab.component.scss'
})
export class RegionsYearTabComponent {
    readonly String = String;
    @Input() regions: Region[] = [];
    @Input() displayedColumns: string[] = [];
    @Input() totalCount: number = 0;
    @Input() pageSize: number = 1000;
    @Input() pageIndex: number = 0;
    @Input() isLoading: boolean = false;
    @Input() canGoBack: boolean = false;

    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() pageChanged = new EventEmitter<PageEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();
    @Output() backClicked = new EventEmitter<void>();
}
