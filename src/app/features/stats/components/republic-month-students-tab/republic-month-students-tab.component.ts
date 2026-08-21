import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Stats } from '../../../../core/models/stats.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MonthStudentRatingTableComponent } from '../month-student-rating-table/month-student-rating-table.component';

@Component({
    selector: 'app-republic-month-students-tab',
    imports: [CommonModule, MonthStudentRatingTableComponent],
    templateUrl: './republic-month-students-tab.component.html',
    styleUrl: './republic-month-students-tab.component.scss'
})
export class RepublicMonthStudentsTabComponent {
    @Input() stats!: Stats;
    @Input() monthStudentColumns: string[] = [];
    @Input() isLoading: boolean = false;
    @Input() republicLabel$!: Observable<string>;
    @Input() fullscreen = false;

    @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
    @Output() excelExport = new EventEmitter<string>();
    @Output() rowClicked = new EventEmitter<string>();
}