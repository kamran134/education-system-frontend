import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LucideAngularModule, RefreshCw } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { RoundNumberPipe } from '../../../../shared/pipes/round-number.pipe';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../../students/services/student.service';
import { StatsService } from '../../services/stats.service';

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
        LucideAngularModule,
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
    @Input() canGoBack: boolean = false;
  
    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() pageChanged = new EventEmitter<PageEvent>();
    @Output() exportClicked = new EventEmitter<void>();
    @Output() rowClicked = new EventEmitter<string>();
    @Output() backClicked = new EventEmitter<void>();

    dataSource = new MatTableDataSource<Student>([]);
    
    private studentService = inject(StudentService);
    private statsService = inject(StatsService);
    isUpdating = false;
    RefreshCw = RefreshCw;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['students']) {
            this.dataSource.data = Array.isArray(this.students) ? this.students : [];
        }
    }

    updateStudentsStats(): void {
        this.isUpdating = true;
        this.statsService.updateStats().subscribe({
            next: () => {
                this.isUpdating = false;
            },
            error: () => {
                this.isUpdating = false;
            }
        });
    }
}
