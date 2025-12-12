import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { UserSettings } from '../../../../core/models/settings.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Home, Save, RotateCcw, CheckSquare, Square } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Router } from '@angular/router';

interface Column {
    key: string;
    label: string;
    selected: boolean;
}

@Component({
    selector: 'app-stats-columns',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        LucideAngularModule
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
    
    activeTab: number = 0;
    
    displayedColumns: string[] = ['id', 'name', 'actions'];
    dataSource: UserSettings = {
        userId: '', // Assuming userId is a string, you can set it to the current user's ID if needed
        developingStudentCollumns: [],
        studentCollumns: [],
        allStudentCollumns: [],
        allTeacherCollumns: [],
        allSchoolCollumns: [],
        allDistrictCollumns: []
    }; // Assuming Settings is the type for the columns

    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }

    developingStudentColumnOptions: Column[] = [
        { key: 'level', label: 'Pillə', selected: false },
        { key: 'code', label: 'Kodu', selected: false },
        { key: 'lastName', label: 'Soyadı', selected: false },
        { key: 'firstName', label: 'Adı', selected: false },
        { key: 'middleName', label: 'Ata adı', selected: false },
        { key: 'grade', label: 'Sinifi', selected: false },
        { key: 'teacher', label: 'Müəllimi', selected: false },
        { key: 'school', label: 'Məktəbi', selected: false },
        { key: 'district', label: 'Rayonu', selected: false },
        { key: 'averageScore', label: 'Orta balı', selected: false },
        { key: 'totalScore', label: 'İmtahan balı', selected: false },
    ];

    monthStudentColumnOptions: Column[] = [
        { key: 'code', label: 'Kodu', selected: false },
        { key: 'lastName', label: 'Soyadı', selected: false },
        { key: 'firstName', label: 'Adı', selected: false },
        { key: 'middleName', label: 'Ata adı', selected: false },
        { key: 'grade', label: 'Sinifi', selected: false },
        { key: 'teacher', label: 'Müəllimi', selected: false },
        { key: 'school', label: 'Məktəbi', selected: false },
        { key: 'district', label: 'Rayonu', selected: false },
        { key: 'averageScore', label: 'Orta balı', selected: false },
        { key: 'totalScore', label: 'İmtahan balı', selected: false },
        // { key: 'place', label: 'Yer', selected: false }
    ];

    studentColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false },
        { key: 'code', label: 'Kodu', selected: false },
        { key: 'lastName', label: 'Soyadı', selected: false },
        { key: 'firstName', label: 'Adı', selected: false },
        { key: 'middleName', label: 'Ata adı', selected: false },
        { key: 'grade', label: 'Sinifi', selected: false },
        { key: 'teacher', label: 'Müəllimi', selected: false },
        { key: 'school', label: 'Məktəbi', selected: false },
        { key: 'district', label: 'Rayonu', selected: false },
        { key: 'score', label: 'Balı', selected: false },
        { key: 'averageScore', label: 'Orta balı', selected: false },
    ];

    teacherColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false },
        { key: 'code', label: 'Kodu', selected: false },
        { key: 'fullName', label: 'Soyadı, adı, ata adı', selected: false },
        { key: 'school', label: 'Məktəbi', selected: false },
        { key: 'district', label: 'Rayonu', selected: false },
        { key: 'studentCount', label: 'Şagird sayı', selected: false },
        { key: 'score', label: 'Balı', selected: false },
        { key: 'averageScore', label: 'Orta balı', selected: false },
    ];

    schoolColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false },
        { key: 'code', label: 'Kodu', selected: false },
        { key: 'name', label: 'Adı', selected: false },
        { key: 'district', label: 'Rayonu', selected: false },
        { key: 'studentCount', label: 'Şagird sayı', selected: false },
        { key: 'score', label: 'Balı', selected: false },
        { key: 'averageScore', label: 'Orta balı', selected: false },
    ];

    districtColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false },
        { key: 'code', label: 'Kodu', selected: false },
        { key: 'name', label: 'Adı', selected: false },
        { key: 'studentCount', label: 'Şagird sayı', selected: false },
        { key: 'score', label: 'Balı', selected: false },
        { key: 'averageScore', label: 'Orta balı', selected: false }
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
                // Set selected state based on the loaded settings
                this.developingStudentColumnOptions.forEach(column => {
                    column.selected = settings.developingStudentCollumns?.includes(column.key) || false;
                });
                this.monthStudentColumnOptions.forEach(column => {
                    column.selected = settings.studentCollumns?.includes(column.key) || false;
                });
                this.studentColumnOptions.forEach(column => {
                    column.selected = settings.allStudentCollumns?.includes(column.key) || false;
                });
                this.teacherColumnOptions.forEach(column => {
                    column.selected = settings.allTeacherCollumns?.includes(column.key) || false;
                });
                this.schoolColumnOptions.forEach(column => {
                    column.selected = settings.allSchoolCollumns?.includes(column.key) || false;
                });
                this.districtColumnOptions.forEach(column => {
                    column.selected = settings.allDistrictCollumns?.includes(column.key) || false;
                });
            },
            error: (error) => {
                console.error('Error loading columns:', error);
            }
        });
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

        const userSettings: UserSettings = {
            userId: this.userId || '', // Ensure userId is set
            developingStudentCollumns: selectedDevelopingStudentColumns,
            studentCollumns: selectedStudentColumns,
            allStudentCollumns: selectedAllStudentColumns,
            allTeacherCollumns: selectedTeacherColumns,
            allSchoolCollumns: selectedSchoolColumns,
            allDistrictCollumns: selectedDistrictColumns
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

        // Reset the dataSource to its initial state
        this.dataSource.developingStudentCollumns = [];
        this.dataSource.studentCollumns = [];
        this.dataSource.allStudentCollumns = [];
        this.dataSource.allTeacherCollumns = [];
        this.dataSource.allSchoolCollumns = [];
        this.dataSource.allDistrictCollumns = [];

        // Save the reset settings
        this.saveColumnSettings();
    }
}
