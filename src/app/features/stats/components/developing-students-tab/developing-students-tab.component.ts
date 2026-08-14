import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Stats } from '../../../../core/models/stats.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StudentRatingTableComponent } from '../student-rating-table/student-rating-table.component';

@Component({
    selector: 'app-developing-students-tab',
    imports: [CommonModule, StudentRatingTableComponent],
    templateUrl: './developing-students-tab.component.html',
    styleUrl: './developing-students-tab.component.scss'
})
export class DevelopingStudentsTabComponent {
    @Input() stats!: Stats;
    @Input() monthStudentColumns: string[] = [];
    @Input() isLoading: boolean = false;
    @Input() developingLabel$!: Observable<string>;

    @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
    @Output() excelExport = new EventEmitter<string>();
    @Output() rowClicked = new EventEmitter<string>();
}