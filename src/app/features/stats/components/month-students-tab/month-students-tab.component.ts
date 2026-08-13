import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Stats } from '../../../../core/models/stats.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StudentRatingTableComponent } from '../student-rating-table/student-rating-table.component';
import { Sort } from '@angular/material/sort';

@Component({
    selector: 'app-month-students-tab',
    imports: [CommonModule, StudentRatingTableComponent],
    templateUrl: './month-students-tab.component.html',
    styleUrl: './month-students-tab.component.scss'
})
export class MonthStudentsTabComponent {
    @Input() stats!: Stats;
    @Input() monthStudentColumns: string[] = [];
    @Input() isLoading: boolean = false;
    @Input() ofMonthLabel$!: Observable<string>;

    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() excelExport = new EventEmitter<string>();
    @Output() rowClicked = new EventEmitter<string>();
}