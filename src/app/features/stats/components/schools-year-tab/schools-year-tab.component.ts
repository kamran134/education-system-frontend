import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LucideAngularModule, RefreshCw } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { School } from '../../../../core/models/school.model';
import { SchoolService } from '../../../schools/services/school.service';

@Component({
    selector: 'app-schools-year-tab',
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
    templateUrl: './schools-year-tab.component.html',
    styleUrl: './schools-year-tab.component.scss'
})
export class SchoolsYearTabComponent {
    readonly String = String;
    @Input() schools: School[] = [];
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

    private schoolService = inject(SchoolService);
    isUpdating = false;
    RefreshCw = RefreshCw;

    updateSchoolsStats(): void {
        this.isUpdating = true;
        this.schoolService.updateSchoolsStats().subscribe({
            next: () => {
                this.isUpdating = false;
            },
            error: () => {
                this.isUpdating = false;
            }
        });
    }
}
