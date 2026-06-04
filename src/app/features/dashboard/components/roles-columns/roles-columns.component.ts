import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { UserSettings } from '../../../../core/models/settings.model';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACK_BAR_DEFAULT_CONFIG } from '../../../../shared/constants/snack-bar.config';
import { LucideAngularModule, Save, RotateCcw, CheckSquare, Square, GripVertical } from 'lucide-angular';
import { Router } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, moveItemInArray } from '@angular/cdk/drag-drop';

interface Column {
    key: string;
    label: string;
    selected: boolean;
    order: number;
}

@Component({
    selector: 'app-roles-columns',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        CdkDropList,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './roles-columns.component.html',
    styleUrl: './roles-columns.component.scss'
})
export class RolesColumnsComponent implements OnInit {
    readonly Save = Save;
    readonly RotateCcw = RotateCcw;
    readonly CheckSquare = CheckSquare;
    readonly Square = Square;
    readonly GripVertical = GripVertical;

    activeTab: number = 0;
    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    teacherViewColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false, order: 0 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 1 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 2 },
        { key: 'firstName', label: 'Adı', selected: false, order: 3 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 4 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 5 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 6 },
        { key: 'district', label: 'Rayonu', selected: false, order: 7 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 8 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 9 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 10 },
    ];

    directorViewColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false, order: 0 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 1 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 2 },
        { key: 'firstName', label: 'Adı', selected: false, order: 3 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 4 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 5 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 6 },
        { key: 'district', label: 'Rayonu', selected: false, order: 7 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 8 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 9 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 10 },
    ];

    districtViewColumnOptions: Column[] = [
        { key: 'place', label: 'Yer', selected: false, order: 0 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 1 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 2 },
        { key: 'firstName', label: 'Adı', selected: false, order: 3 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 4 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 5 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 6 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 7 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 8 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 9 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 10 },
    ];

    constructor(
        private dashboardService: DashboardService,
        private snackBar: MatSnackBar,
        public router: Router
    ) {}

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings(): void {
        this.dashboardService.getGlobalColumns().subscribe({
            next: (settings: UserSettings) => {
                if (settings) {
                    this.restoreColumnOrder(this.teacherViewColumnOptions, settings.teacherViewCollumns || []);
                    this.restoreColumnOrder(this.directorViewColumnOptions, settings.directorViewCollumns || []);
                    this.restoreColumnOrder(this.districtViewColumnOptions, settings.districtViewCollumns || []);
                }
            },
            error: (error) => {
                console.error('Error loading role column settings:', error);
            }
        });
    }

    private restoreColumnOrder(columns: Column[], savedOrder: string[]): void {
        columns.forEach(column => {
            column.selected = savedOrder.includes(column.key);
        });
        if (savedOrder.length > 0) {
            columns.sort((a, b) => {
                const indexA = savedOrder.indexOf(a.key);
                const indexB = savedOrder.indexOf(b.key);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.order - b.order;
            });
            columns.forEach((column, index) => { column.order = index; });
        }
    }

    saveSettings(): void {
        const teacherViewCollumns = this.teacherViewColumnOptions.filter(c => c.selected).map(c => c.key);
        const directorViewCollumns = this.directorViewColumnOptions.filter(c => c.selected).map(c => c.key);
        const districtViewCollumns = this.districtViewColumnOptions.filter(c => c.selected).map(c => c.key);

        this.dashboardService.saveGlobalColumns({ teacherViewCollumns, directorViewCollumns, districtViewCollumns }).subscribe({
            next: () => {
                this.snackBar.open('Parametrlər uğurla yadda saxlanıldı', 'Bağla', this.matSnackConfig);
            },
            error: (error) => {
                console.error('Error saving role column settings:', error);
                this.snackBar.open('Xəta baş verdi', 'Bağla', this.matSnackConfig);
            }
        });
    }

    resetSettings(): void {
        this.teacherViewColumnOptions.forEach(c => c.selected = false);
        this.directorViewColumnOptions.forEach(c => c.selected = false);
        this.districtViewColumnOptions.forEach(c => c.selected = false);
        this.saveSettings();
    }

    dropTeacherView(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.teacherViewColumnOptions, event.previousIndex, event.currentIndex);
        this.teacherViewColumnOptions.forEach((c, i) => { c.order = i; });
    }

    dropDirectorView(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.directorViewColumnOptions, event.previousIndex, event.currentIndex);
        this.directorViewColumnOptions.forEach((c, i) => { c.order = i; });
    }

    dropDistrictView(event: CdkDragDrop<Column[]>): void {
        moveItemInArray(this.districtViewColumnOptions, event.previousIndex, event.currentIndex);
        this.districtViewColumnOptions.forEach((c, i) => { c.order = i; });
    }
}
