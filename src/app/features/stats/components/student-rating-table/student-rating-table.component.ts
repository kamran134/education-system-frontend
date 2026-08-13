
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
    MatSortModule
]
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

    // Computed columns with row number and avatar at the beginning
    get displayedColumns(): string[] {
        return ['rowNum', 'avatar', ...this.columns];
    }

    // Column definitions with labels and sort keys
    columnDefinitions = new Map<string, {label: string, sortKey: string}>([
        ['level', {label: 'Pillə', sortKey: 'level'}],
        ['code', {label: 'İş nömrəsi', sortKey: 'code'}],
        ['lastName', {label: 'Soyadı', sortKey: 'lastName'}],
        ['firstName', {label: 'Adı', sortKey: 'firstName'}],
        ['middleName', {label: 'Ata adı', sortKey: 'middleName'}],
        ['totalScore', {label: 'İmtahan balı', sortKey: 'totalScore'}],
        ['grade', {label: 'Sinifi', sortKey: 'grade'}],
        ['teacher', {label: 'Müəllimi', sortKey: 'teacher'}],
        ['school', {label: 'Məktəbi', sortKey: 'school'}],
        ['district', {label: 'Rayonu / şəhəri', sortKey: 'district'}],
        ['averageScore', {label: 'Orta reytinq xalı', sortKey: 'averageScore'}],
        ['place', {label: 'Yer', sortKey: 'place'}],
        ['score', {label: 'Reytinq xalı', sortKey: 'score'}]
    ]);

    // Get ordered column definitions based on columns array
    get orderedColumnDefinitions(): Array<{key: string, label: string, sortKey: string}> {
        return this.columns
            .filter(col => this.columnDefinitions.has(col))
            .map(col => ({
                key: col,
                ...this.columnDefinitions.get(col)!
            }));
    }

    onRowClick(studentId: string): void {
        this.rowClicked.emit(studentId);
    }

    onExportToExcel(tableName: string): void {
        this.excelExport.emit(tableName);
    }
}
