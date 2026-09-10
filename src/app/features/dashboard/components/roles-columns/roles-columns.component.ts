import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { RoleSettings, UserSettings } from '../../../../core/models/settings.model';

import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
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
        { key: 'fullname', label: 'Soyadı, adı, ata adı', selected: false, order: 2 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 3 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 4 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 5 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 6 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 7 },
        { key: 'totalScore', label: 'İmtahan balı', selected: false, order: 8 },
    ],
    monthStudents: [
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 0 },
        { key: 'fullname', label: 'Soyadı, adı, ata adı', selected: false, order: 1 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 2 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 3 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 4 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 5 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 6 },
        { key: 'totalScore', label: 'İmtahan balı', selected: false, order: 7 },
    ],
    republicMonthStudents: [
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 0 },
        { key: 'fullname', label: 'Soyadı, adı, ata adı', selected: false, order: 1 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 2 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 3 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 4 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 5 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 6 },
        { key: 'totalScore', label: 'İmtahan balı', selected: false, order: 7 },
    ],
    allStudents: [
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 0 },
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 2 },
        { key: 'fullname', label: 'Soyadı, adı, ata adı', selected: false, order: 3 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 4 },
        { key: 'teacher', label: 'Müəllimi', selected: false, order: 5 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 6 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 7 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 8 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 9 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 10 },
    ],
    allTeachers: [
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer', selected: false, order: 0 },
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'Kodu', selected: false, order: 2 },
        { key: 'fullName', label: 'Soyadı, adı, ata adı', selected: false, order: 3 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 4 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 5 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 6 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 7 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 8 },
    ],
    allSchools: [
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer', selected: false, order: 0 },
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 1 },
        { key: 'code', label: 'Kodu', selected: false, order: 2 },
        { key: 'name', label: 'Adı', selected: false, order: 3 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 4 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 5 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 6 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 7 },
    ],
    allDistricts: [
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 0 },
        { key: 'code', label: 'Kodu', selected: false, order: 1 },
        { key: 'name', label: 'Adı', selected: false, order: 2 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 3 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 4 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 5 },
    ],
    allRegions: [
        { key: 'place', label: 'Respublika üzrə yer', selected: false, order: 0 },
        { key: 'code', label: 'Kodu', selected: false, order: 1 },
        { key: 'name', label: 'Adı', selected: false, order: 2 },
        { key: 'districtCount', label: 'Təhsil sektorlarının sayı', selected: false, order: 3 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 4 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 5 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 6 },
    ],
    // Ключи должны совпадать с displayedColumns в exam-results.component.ts (FIXES п.4 от 04.09.2026)
    examResults: [
        { key: 'studentData.code', label: 'İş nömrəsi', selected: false, order: 0 },
        { key: 'studentData.fullname', label: 'Soyadı, adı, ata adı', selected: false, order: 1 },
        { key: 'grade', label: 'Sinif', selected: false, order: 2 },
        { key: 'level', label: 'Pillə', selected: false, order: 3 },
        { key: 'scorePercent', label: 'Bal faizi', selected: false, order: 4 },
        { key: 'totalScore', label: 'Ümumi bal', selected: false, order: 5 },
        { key: 'exam.date', label: 'Tarix', selected: false, order: 6 },
        { key: 'studentData.school.name', label: 'Məktəb', selected: false, order: 7 },
        { key: 'studentData.teacher.fullname', label: 'Müəllim', selected: false, order: 8 },
        { key: 'studentData.district.name', label: 'Təhsil sektoru', selected: false, order: 9 },
    ],
};

@Component({
    selector: 'app-roles-columns',
    imports: [
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

    readonly roles: RoleDef[] = [
        { key: 'moderator', label: 'Moderator' },
        { key: 'regionRepresenter', label: 'Regional idarə nümayəndəsi' },
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
        { key: 'allDistricts', label: 'İlin təhsil sektorları' },
        { key: 'allRegions', label: 'İlin regional idarələri' },
        { key: 'examResults', label: 'İmtahan nəticələri' },
    ];

    // exam-results səhifəsi (/exam-results) yalnız authGuard ilə qorunur — bütün rollara açıqdır,
    // ona görə examResults tabı da bura sadalanan bütün rollara əlavə olunub (FIXES п.4 от 04.09.2026).
    readonly roleTabAccess: Record<string, string[]> = {
        moderator: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts', 'allRegions', 'examResults'],
        regionRepresenter: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts', 'allRegions', 'examResults'],
        districtRepresenter: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts', 'examResults'],
        schoolDirector: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'examResults'],
        teacher: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'examResults'],
        student: ['developingStudents', 'monthStudents', 'examResults'],
    };

    activeRoleKey: string = 'moderator';
    activeTabKey: Record<string, string> = {};
    roleTabColumns: Record<string, Record<string, Column[]>> = {};

    constructor(
        private dashboardService: DashboardService,
        private toastService: ToastService,
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
                this.toastService.show('Parametrlər uğurla yadda saxlanıldı', 'success');
            },
            error: (error) => {
                console.error('Error saving role column settings:', error);
                this.toastService.show('Xəta baş verdi', 'error');
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
