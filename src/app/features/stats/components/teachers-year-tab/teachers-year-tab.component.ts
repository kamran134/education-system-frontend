import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Teacher } from '../../../../core/models/teacher.model';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, RefreshCw } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { TeacherService } from '../../../teachers/services/teacher.service';

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
        LucideAngularModule,
        ButtonComponent,
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
    @Input() canGoBack: boolean = false;

    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() pageChanged = new EventEmitter<PageEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();
    @Output() backClicked = new EventEmitter<void>();

    private teacherService = inject(TeacherService);
    isUpdating = false;
    RefreshCw = RefreshCw;

    updateTeachersStats(): void {
        this.isUpdating = true;
        this.teacherService.updateTeachersStats().subscribe({
            next: () => {
                this.isUpdating = false;
            },
            error: () => {
                this.isUpdating = false;
            }
        });
    }
}
