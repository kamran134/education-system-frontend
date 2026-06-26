import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { RoleSettings, UserSettings } from '../../../../core/models/settings.model';
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

interface RoleDef {
    key: string;
    label: string;
}

interface TabDef {
    key: string;
    label: string;
}

const BASE_COLUMN_OPTIONS: Record<string, Column[]> = {
    developingStudents: [
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
    ],
    monthStudents: [
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
    ],
    republicMonthStudents: [
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
    ],
    allStudents: [
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 0 },
        { key: 'districtPlace', label: 'Rayon/şəhər üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 2 },
        { key: 'lastName', label: 'Soyadı', selected: false, order: 3 },
        { key: 'firstName', label: 'Adı', selected: false, order: 4 },
        { key: 'middleName', label: 'Ata adı', selected: false, order: 5 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 6 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 7 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 8 },
        { key: 'district', label: 'Rayonu', selected: false, order: 9 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 10 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 11 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 12 },
    ],
    allTeachers: [
        { key: 'districtPlace', label: 'Şəhər/rayon üzrə yer', selected: false, order: 0 },
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'Kodu', selected: false, order: 2 },
        { key: 'fullName', label: 'Soyadı, adı, ata adı', selected: false, order: 3 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 4 },
        { key: 'district', label: 'Rayonu', selected: false, order: 5 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 6 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 7 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 8 },
    ],
    allSchools: [
        { key: 'districtPlace', label: 'Şəhər/rayon üzrə yer', selected: false, order: 0 },
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'Kodu', selected: false, order: 2 },
        { key: 'name', label: 'Adı', selected: false, order: 3 },
        { key: 'district', label: 'Rayonu', selected: false, order: 4 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 5 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 6 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 7 },
    ],
    allDistricts: [
        { key: 'place', label: 'Yer', selected: false, order: 0 },
        { key: 'code', label: 'Kodu', selected: false, order: 1 },
        { key: 'name', label: 'Adı', selected: false, order: 2 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 3 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 4 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 5 },
    ],
};

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

    readonly matSnackConfig = SNACK_BAR_DEFAULT_CONFIG;

    readonly roles: RoleDef[] = [
        { key: 'moderator', label: 'Moderator' },
        { key: 'districtRepresenter', label: 'Rayon nümayəndəsi' },
        { key: 'schoolDirector', label: 'Direktor' },
        { key: 'teacher', label: 'Müəllim' },
        { key: 'student', label: 'Şagird' },
    ];

    readonly allTabs: TabDef[] = [
        { key: 'developingStudents', label: 'İnkişaf edən şagirdlər' },
        { key: 'monthStudents', label: 'Ayın şagirdləri' },
        { key: 'republicMonthStudents', label: 'Respublika üzrə ayın şagirdləri' },
        { key: 'allStudents', label: 'İlin şagirdləri' },
        { key: 'allTeachers', label: 'İlin müəllimləri' },
        { key: 'allSchools', label: 'İlin məktəbləri' },
        { key: 'allDistricts', label: 'İlin rayonları' },
    ];

    readonly roleTabAccess: Record<string, string[]> = {
        moderator: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts'],
        districtRepresenter: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts'],
        schoolDirector: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools'],
        teacher: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers'],
        student: ['developingStudents', 'monthStudents'],
    };

    activeRoleKey: string = 'moderator';
    activeTabKey: Record<string, string> = {};
    roleTabColumns: Record<string, Record<string, Column[]>> = {};

    constructor(
        private dashboardService: DashboardService,
        private snackBar: MatSnackBar,
        public router: Router
    ) {}

    ngOnInit(): void {
        this.initializeState();
        this.loadSettings();
    }

    private initializeState(): void {
        for (const role of this.roles) {
            this.roleTabColumns[role.key] = {};
            const accessibleTabs = this.roleTabAccess[role.key] || [];
            this.activeTabKey[role.key] = accessibleTabs[0] || '';
            for (const tabKey of accessibleTabs) {
                this.roleTabColumns[role.key][tabKey] = this.deepCopyColumns(BASE_COLUMN_OPTIONS[tabKey] || []);
            }
        }
    }

    private deepCopyColumns(columns: Column[]): Column[] {
        return columns.map(c => ({ ...c }));
    }

    getTabsForRole(roleKey: string): TabDef[] {
        const allowedTabKeys = this.roleTabAccess[roleKey] || [];
        return this.allTabs.filter(t => allowedTabKeys.includes(t.key));
    }

    getCurrentColumns(): Column[] {
        const tabKey = this.activeTabKey[this.activeRoleKey];
        return this.roleTabColumns[this.activeRoleKey]?.[tabKey] || [];
    }

    setActiveRole(roleKey: string): void {
        this.activeRoleKey = roleKey;
    }

    setActiveTab(tabKey: string): void {
        this.activeTabKey[this.activeRoleKey] = tabKey;
    }

    onDrop(event: CdkDragDrop<Column[]>): void {
        const columns = this.getCurrentColumns();
        moveItemInArray(columns, event.previousIndex, event.currentIndex);
        columns.forEach((c, i) => { c.order = i; });
    }

    loadSettings(): void {
        this.dashboardService.getGlobalColumns().subscribe({
            next: (settings: UserSettings) => {
                if (!settings?.roleSettings) return;
                this.applyRoleSettings(settings.roleSettings);
            },
            error: (error) => {
                console.error('Error loading role column settings:', error);
            }
        });
    }

    private applyRoleSettings(roleSettings: RoleSettings): void {
        for (const role of this.roles) {
            const roleData = (roleSettings as Record<string, Record<string, string[]>>)[role.key];
            if (!roleData) continue;
            for (const tabKey of this.roleTabAccess[role.key] || []) {
                const savedColumns = roleData[tabKey];
                if (savedColumns?.length) {
                    this.restoreColumnOrder(this.roleTabColumns[role.key][tabKey], savedColumns);
                }
            }
        }
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
        const roleSettings: Record<string, Record<string, string[]>> = {};
        for (const role of this.roles) {
            roleSettings[role.key] = {};
            for (const tabKey of this.roleTabAccess[role.key] || []) {
                const columns = this.roleTabColumns[role.key][tabKey] || [];
                roleSettings[role.key][tabKey] = columns.filter(c => c.selected).map(c => c.key);
            }
        }

        this.dashboardService.saveGlobalColumns({ roleSettings } as any).subscribe({
            next: () => {
                this.snackBar.open('Parametrlər uğurla yadda saxlanıldı', 'Bağla', this.matSnackConfig);
            },
            error: (error) => {
                console.error('Error saving role column settings:', error);
                this.snackBar.open('Xəta baş verdi', 'Bağla', this.matSnackConfig);
            }
        });
    }

    resetCurrentTab(): void {
        const tabKey = this.activeTabKey[this.activeRoleKey];
        const columns = this.roleTabColumns[this.activeRoleKey]?.[tabKey];
        if (columns) {
            columns.forEach(c => { c.selected = false; });
        }
    }

    getSelectedCount(): number {
        return this.getCurrentColumns().filter(c => c.selected).length;
    }

    getTotalCount(): number {
        return this.getCurrentColumns().length;
    }

    isAllSelected(): boolean {
        const cols = this.getCurrentColumns();
        return cols.length > 0 && cols.every(c => c.selected);
    }

    isPartiallySelected(): boolean {
        const count = this.getSelectedCount();
        return count > 0 && count < this.getTotalCount();
    }

    toggleSelectAll(): void {
        const cols = this.getCurrentColumns();
        const selectAll = !this.isAllSelected();
        cols.forEach(c => { c.selected = selectAll; });
    }
}
