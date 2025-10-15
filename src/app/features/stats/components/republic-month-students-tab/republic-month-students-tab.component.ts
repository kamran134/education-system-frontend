import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Stats } from '../../../../core/models/stats.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StudentRatingTableComponent } from '../student-rating-table/student-rating-table.component';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-republic-month-students-tab',
  standalone: true,
  imports: [CommonModule, StudentRatingTableComponent],
  templateUrl: './republic-month-students-tab.component.html',
  styleUrl: './republic-month-students-tab.component.scss'
})
export class RepublicMonthStudentsTabComponent {
    @Input() stats!: Stats;
    @Input() monthStudentColumns: string[] = [];
    @Input() isLoading: boolean = false;
    @Input() republicLabel$!: Observable<string>;

    @Output() sortChanged = new EventEmitter<Sort>();
    @Output() excelExport = new EventEmitter<string>();
    @Output() rowClicked = new EventEmitter<string>();
}