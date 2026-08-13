import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { UserSettings } from '../../../../core/models/settings.model';

import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../../../shared/constants/snack-bar.config';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Home, Save, RotateCcw, CheckSquare, Square, GripVertical } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Router } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, moveItemInArray } from '@angular/cdk/drag-drop';

interface Column {
    key: string;
    label: string;
    selected: boolean;
    order: number;
}

@Component({
    selector: 'app-stats-columns',
    imports: [
    FormsModule,
    LucideAngularModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle
],
    templateUrl: './stats-columns.component.html',
    styleUrl: './stats-columns.component.scss'
})
export class StatsColumnsComponent implements OnInit{
    // Icons
    readonly Home = Home;
    readonly Save = Save;
    readonly RotateCcw = RotateCcw;
    readonly CheckSquare = CheckSquare;
    readonly Square = Square;
    readonly GripVertical = GripVertical;

    activeTab: number = 0;

    displayedColumns: string[] = ['id', 'name', 'actions'];
    dataSource: UserSettings = {
        userId: '', // Assuming userId is a string, you can set it to the current user's ID if needed
        developingStudentCollumns: [],
        studentCollumns: [],
        allStudentCollumns: [],
        allTeacherCollumns: [],
        allSchoolCollumns: [],
        allDistrictCollumns: [],
        allRegionCollumns: []
    }; // Assuming Settings is the type for the columns

    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    developingStudentColumnOptions: Column[] = [
        { key: 'level', label: 'Pillə', selected: false, order: 0 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 1 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 2 },
        { key: 'firstName', label: 'Adı', selected: false, order: 3 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 4 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 5 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 6 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 7 },
        { key: 'district', label: 'Rayonu', selected: false, order: 8 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 9 },
        { key: 'totalScore', label: 'İmtahan balı', selected: false, order: 10 },
    ];

    monthStudentColumnOptions: Column[] = [
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 0 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 1 },
        { key: 'firstName', label: 'Adı', selected: false, order: 2 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 3 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 4 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 5 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 6 },
        { key: 'district', label: 'Rayonu', selected: false, order: 7 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 8 },
        { key: 'totalScore', label: 'İmtahan balı', selected: false, order: 9 },
        // { key: 'place', label: 'Yer', selected: false, order: 10 }
    ];

    studentColumnOptions: Column[] = [
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 0 },
        { key: 'districtPlace', label: 'Rayon/şəhər üzrə yer', selected: false, order: 1 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 2 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 3 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 4 },
        { key: 'firstName', label: 'Adı', selected: false, order: 5 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 6 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 7 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 8 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 9 },
        { key: 'district', label: 'Rayonu', selected: false, order: 10 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 11 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 12 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 13 },
    ];

    teacherColumnOptions: Column[] = [
        { key: 'districtPlace', label: 'Şəhər/rayon üzrə yer', selected: true, order: 0 },
        { key: 'place', label: 'Respublika üzrə yer', selected: true, order: 1 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 2 },
        { key: 'code', label: 'Kodu', selected: true, order: 3 },
        { key: 'fullName', label: 'Soyadı, adı, ata adı', selected: true, order: 4 },
        { key: 'school', label: 'Məktəbi', selected: true, order: 5 },
        { key: 'district', label: 'Rayonu', selected: true, order: 6 },
        { key: 'studentCount', label: 'Şagird sayı', selected: true, order: 7 },
        { key: 'score', label: 'Reytinq xalı', selected: true, order: 8 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: true, order: 9 },
    ];

    schoolColumnOptions: Column[] = [
        { key: 'districtPlace', label: 'Şəhər/rayon üzrə yer', selected: true, order: 0 },
        { key: 'place', label: 'Respublika üzrə yer', selected: true, order: 1 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 2 },
        { key: 'code', label: 'Kodu', selected: true, order: 3 },
        { key: 'name', label: 'Adı', selected: true, order: 4 },
        { key: 'district', label: 'Rayonu', selected: true, order: 5 },
        { key: 'studentCount', label: 'Şagird sayı', selected: true, order: 6 },
        { key: 'score', label: 'Reytinq xalı', selected: true, order: 7 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: true, order: 8 },
    ];

    districtColumnOptions: Column[] = [
        { key: 'place', label: 'Respublika üzrə yer', selected: true, order: 0 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'Kodu', selected: true, order: 2 },
        { key: 'name', label: 'Adı', selected: true, order: 3 },
        { key: 'studentCount', label: 'Şagird sayı', selected: true, order: 4 },
        { key: 'score', label: 'Reytinq xalı', selected: true, order: 5 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: true, order: 6 }
    ];

    regionColumnOptions: Column[] = [
        { key: 'place', label: 'Respublika üzrə yer', selected: true, order: 0 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'Kodu', selected: true, order: 2 },
        { key: 'name', label: 'Adı', selected: true, order: 3 },
        { key: 'districtCount', label: 'Rayon sayı', selected: true, order: 4 },
        { key: 'studentCount', label: 'Şagird sayı', selected: true, order: 5 },
        { key: 'score', label: 'Reytinq xalı', selected: true, order: 6 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: true, order: 7 }
    ];

    userId: string = '';

    constructor(
        private authService: AuthService,
        private dashboardService: DashboardService,
        private snackBar: MatSnackBar,
        public router: Router
    ) {}

    ngOnInit(): void {
        // Assuming userId is set from a service or route parameter
        this.userId = this.authService.getUserId() || ''; // Get the current user's ID from the auth service
        if (!this.userId) {
            console.error('User ID is not set. Please ensure the user is authenticated.');
            return;
        }
        // Initialization logic can go here
        this.loadColumns();

    }

    loadColumns(): void {
        this.dashboardService.getRatingColumns(this.userId).subscribe({
            next: (settings: UserSettings) => {
                this.dataSource = settings;
                // Restore columns order and selected state
                this.restoreColumnOrder(this.developingStudentColumnOptions, settings.developingStudentCollumns || []);
                this.restoreColumnOrder(this.monthStudentColumnOptions, settings.studentCollumns || []);
                this.restoreColumnOrder(this.studentColumnOptions, settings.allStudentCollumns || []);
                this.restoreColumnOrder(this.teacherColumnOptions, settings.allTeacherCollumns || []);
                this.restoreColumnOrder(this.schoolColumnOptions, settings.allSchoolCollumns || []);
                this.restoreColumnOrder(this.districtColumnOptions, settings.allDistrictCollumns || []);
                this.restoreColumnOrder(this.regionColumnOptions, settings.allRegionCollumns || []);
            },
            error: (error) => {
                console.error('Error loading columns:', error);
            }
        });
    }

    private restoreColumnOrder(columns: Column[], savedOrder: string[]): void {
        // Mark columns as selected based on saved settings
        columns.forEach(column => {
            column.selected = savedOrder.includes(column.key);
        });

        // Restore order based on saved array
        if (savedOrder.length > 0) {
            columns.sort((a, b) => {
                const indexA = savedOrder.indexOf(a.key);
                const indexB = savedOrder.indexOf(b.key);

                // If both are in saved order, sort by their position
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                // If only A is saved, it comes first
                if (indexA !== -1) return -1;
                // If only B is saved, it comes first
                if (indexB !== -1) return 1;
                // If neither is saved, keep original order
                return a.order - b.order;
            });

            // Update order property to reflect current positions
            columns.forEach((column, index) => {
                column.order = index;
            });
        }
    }

    saveColumnSettings(): void {
        const selectedDevelopingStudentColumns = this.developingStudentColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);
        const selectedStudentColumns = this.monthStudentColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);
        const selectedAllStudentColumns = this.studentColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);
        const selectedTeacherColumns = this.teacherColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);
        const selectedSchoolColumns = this.schoolColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);
        const selectedDistrictColumns = this.districtColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);
        const selectedRegionColumns = this.regionColumnOptions
            .filter(column => column.selected)
            .map(column => column.key);

        const userSettings: UserSettings = {
            userId: this.userId || '',
            developingStudentCollumns: selectedDevelopingStudentColumns,
            studentCollumns: selectedStudentColumns,
            allStudentCollumns: selectedAllStudentColumns,
            allTeacherCollumns: selectedTeacherColumns,
            allSchoolCollumns: selectedSchoolColumns,
            allDistrictCollumns: selectedDistrictColumns,
            allRegionCollumns: selectedRegionColumns
        };

        this.dashboardService.saveRatingColumns(userSettings).subscribe({
            next: (response) => {
                this.snackBar.open(response.message || 'Sütunlar uğurla yeniləndi', 'Bağla', this.matSnackConfig);
            },
            error: (error) => {
                console.error('Error saving settings:', error);
            }
        });
    }

    resetColumns(): void {
        this.developingStudentColumnOptions.forEach(column => column.selected = false);
        this.monthStudentColumnOptions.forEach(column => column.selected = false);
        this.studentColumnOptions.forEach(column => column.selected = false);
        this.teacherColumnOptions.forEach(column => column.selected = false);
        this.schoolColumnOptions.forEach(column => column.selected = false);
        this.districtColumnOptions.forEach(column => column.selected = false);
        this.regionColumnOptions.forEach(column => column.selected = false);

        // Reset the dataSource to its initial state
        this.dataSource.developingStudentCollumns = [];
        this.dataSource.studentCollumns = [];
        this.dataSource.allStudentCollumns = [];
        this.dataSource.allTeacherCollumns = [];
        this.dataSource.allSchoolCollumns = [];
        this.dataSource.allDistrictCollumns = [];
        this.dataSource.allRegionCollumns = [];

        // Save the reset settings
        this.saveColumnSettings();
    }

    // Drag & Drop handlers for each tab
    dropDevelopingStudent(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.developingStudentColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.developingStudentColumnOptions);
    }

    dropMonthStudent(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.monthStudentColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.monthStudentColumnOptions);
    }

    dropStudent(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.studentColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.studentColumnOptions);
    }

    dropTeacher(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.teacherColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.teacherColumnOptions);
    }

    dropSchool(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.schoolColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.schoolColumnOptions);
    }

    dropDistrict(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.districtColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.districtColumnOptions);
    }

    dropRegion(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.regionColumnOptions, event.previousIndex, event.currentIndex);
        this.updateColumnOrder(this.regionColumnOptions);
    }

    private updateColumnOrder(columns: Column[]): void {
        columns.forEach((column, index) => {
            column.order = index;
        });
    }
}
