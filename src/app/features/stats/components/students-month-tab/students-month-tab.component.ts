import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Stats } from '../../../../core/models/stats.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StudentRatingTableComponent } from '../student-rating-table/student-rating-table.component';

@Component({
  selector: 'app-students-month-tab',
  standalone: true,
  imports: [CommonModule, StudentRatingTableComponent],
  templateUrl: './students-month-tab.component.html',
  styleUrl: './students-month-tab.component.scss'
})
export class StudentsMonthTabComponent {
    @Input() stats!: Stats;
    @Input() monthStudentColumns: string[] = [];
    @Input() isLoading: boolean = false;
    @Input() labels!: {
        developing$: Observable<string>,
        ofMonth$: Observable<string>,
        republic$: Observable<string>
    };

    @Output() excelExport = new EventEmitter<string>();
    @Output() rowClicked = new EventEmitter<string>();
}
