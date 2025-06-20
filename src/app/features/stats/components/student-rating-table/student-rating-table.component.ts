import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

@Component({
    selector: 'app-student-rating-table',
    templateUrl: './student-rating-table.component.html',
    styleUrls: ['../stats-main/stats.component.scss', './student-rating-table.component.scss'],
    imports: [
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatSortModule,
        CommonModule
    ],
    standalone: true
})
export class StudentRatingTableComponent {
    @Input() title: string = "";
    @Input() dataSource: any[] = [];
    @Input() columns: string[] = [];
    @Input() tableName: 'developingStudents' | 'studentsOfMonth' | 'studentsOfMonthByRepublic' | 'allStudents' | 'allTeachers' | 'allSchools' | 'allDistricts' = 'developingStudents';
    @Input() isLoading: boolean = false;

    @Output() sortChanged: EventEmitter<Sort> = new EventEmitter<Sort>();
    @Output() rowClicked: EventEmitter<string> = new EventEmitter<string>();
    @Output() excelExport: EventEmitter<string> = new EventEmitter<string>();

    onRowClick(studentId: string): void {
        this.rowClicked.emit(studentId);
    }

    onExportToExcel(tableName: string): void {
        this.excelExport.emit(tableName);
    }
}