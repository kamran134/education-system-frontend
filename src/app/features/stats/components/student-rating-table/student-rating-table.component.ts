import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { LucideAngularModule, Download, User } from 'lucide-angular';

@Component({
    selector: 'app-student-rating-table',
    templateUrl: './student-rating-table.component.html',
    imports: [ButtonComponent, LucideAngularModule]
})
export class StudentRatingTableComponent {
    @Input() title: string = "";
    @Input() dataSource: any[] = [];
    @Input() columns: string[] = [];
    @Input() tableName: 'developingStudents' | 'studentsOfMonth' | 'studentsOfMonthByRepublic' | 'allStudents' | 'allTeachers' | 'allSchools' | 'allDistricts' = 'developingStudents';
    @Input() isLoading: boolean = false;

    @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
    @Output() rowClicked: EventEmitter<string> = new EventEmitter<string>();
    @Output() excelExport: EventEmitter<string> = new EventEmitter<string>();

    readonly Download = Download;
    readonly User = User;

    sortBy = '';
    sortDirection: 'asc' | 'desc' = 'asc';

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

    getCellValue(result: any, key: string): string {
        switch (key) {
            case 'level': return result.level || '-';
            case 'code': return result.studentData.code;
            case 'lastName': return result.studentData.lastName;
            case 'firstName': return result.studentData.firstName;
            case 'middleName': return result.studentData.middleName;
            case 'totalScore': return result.totalScore;
            case 'grade': return result.studentData.grade;
            case 'teacher': return (result.studentData.teacher || '').fullname;
            case 'school': return (result.studentData.school || '').name;
            case 'district': return (result.studentData.district || '').name;
            case 'averageScore': return (result.studentData || '').averageScore;
            case 'place': return result.place;
            case 'score': return result.score;
            default: return '';
        }
    }

    onSort(key: string): void {
        const direction = this.sortBy === key && this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortBy = key;
        this.sortDirection = direction;
        this.sortChanged.emit({ column: key, direction });
    }

    onRowClick(studentId: string): void {
        this.rowClicked.emit(studentId);
    }

    onExportToExcel(tableName: string): void {
        this.excelExport.emit(tableName);
    }
}
