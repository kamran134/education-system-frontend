import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { District } from '../../../../core/models/district.model';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, RefreshCw } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { DistrictService } from '../../../districts/services/district.service';

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
        LucideAngularModule,
        ButtonComponent,
        RoundNumberPipe
    ],
    templateUrl: './districts-year-tab.component.html',
    styleUrl: './districts-year-tab.component.scss'
})
export class DistrictsYearTabComponent {
    readonly String = String;
    @Input() districts: District[] = [];
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

    private districtService = inject(DistrictService);
    isUpdating = false;
    RefreshCw = RefreshCw;

    updateDistrictsStats(): void {
        this.isUpdating = true;
        this.districtService.updateDistrictsStats().subscribe({
            next: () => {
                this.isUpdating = false;
            },
            error: () => {
                this.isUpdating = false;
            }
        });
    }
}
