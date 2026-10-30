import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { RoleSettings, UserSettings } from '../../../../core/models/settings.model';
import {
    EXAM_RESULT_COLUMN_OPTIONS,
    PROFILE_RATING_COLUMN_OPTIONS,
    ProfileRatingOwnerRole
} from '../../../../core/config/column-catalogs';

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

// Tab with the per-year rating table on the role's own profile (Г2, 29.10.2026); its saved array may be empty.
const PROFILE_RATINGS_TAB = 'profileRatings';

const BASE_COLUMN_OPTIONS: Record<string, Column[]> = {
    developingStudents: [
        { key: 'level', label: 'Pillə', selected: false, order: 0 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 1 },
        // YENI_DUZELISLER_2026-09-17 п.8: заголовок колонки упрощён, ключ не менялся.
        { key: 'fullname', label: 'Şagird', selected: false, order: 2 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 3 },
        // YENI_DUZELISLER_2026-09-17 п.3: "Müəllimi" как заголовок колонки «учитель ученика» → "Layihə müəllimi".
        { key: 'teacher', label: 'Layihə müəllimi', selected: false, order: 4 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 5 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 6 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 7 },
        // YENI_DUZELISLER_2026-09-17 п.5: "İmtahan balı" → "Bal faizi".
        { key: 'totalScore', label: 'Bal faizi', selected: false, order: 8 },
    ],
    monthStudents: [
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 0 },
        // YENI_DUZELISLER_2026-09-17 п.8: заголовок колонки упрощён, ключ не менялся.
        { key: 'fullname', label: 'Şagird', selected: false, order: 1 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 2 },
        // YENI_DUZELISLER_2026-09-17 п.3: "Müəllimi" как заголовок колонки «учитель ученика» → "Layihə müəllimi".
        { key: 'teacher', label: 'Layihə müəllimi', selected: false, order: 3 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 4 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 5 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 6 },
        // YENI_DUZELISLER_2026-09-17 п.5: "İmtahan balı" → "Bal faizi".
        { key: 'totalScore', label: 'Bal faizi', selected: false, order: 7 },
    ],
    republicMonthStudents: [
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 0 },
        // YENI_DUZELISLER_2026-09-17 п.8: заголовок колонки упрощён, ключ не менялся.
        { key: 'fullname', label: 'Şagird', selected: false, order: 1 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 2 },
        // YENI_DUZELISLER_2026-09-17 п.3: "Müəllimi" как заголовок колонки «учитель ученика» → "Layihə müəllimi".
        { key: 'teacher', label: 'Layihə müəllimi', selected: false, order: 3 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 4 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 5 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 6 },
        // YENI_DUZELISLER_2026-09-17 п.5: "İmtahan balı" → "Bal faizi".
        { key: 'totalScore', label: 'Bal faizi', selected: false, order: 7 },
    ],
    allStudents: [
        { key: 'place', label: 'Respublika üzrə yer (ümumi xal)', selected: false, order: 0 },
        { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)', selected: false, order: 1 },
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer (ümumi xal)', selected: false, order: 2 },
        { key: 'averageDistrictPlace', label: 'Təhsil sektoru üzrə yer (orta xal)', selected: false, order: 3 },
        { key: 'schoolPlace', label: 'Məktəb üzrə yer (ümumi xal)', selected: false, order: 4 },
        { key: 'averageSchoolPlace', label: 'Məktəb üzrə yer (orta xal)', selected: false, order: 5 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 6 },
        { key: 'code', label: 'İş nömrəsi', selected: false, order: 7 },
        // YENI_DUZELISLER_2026-09-17 п.8: заголовок колонки упрощён, ключ не менялся.
        { key: 'fullname', label: 'Şagird', selected: false, order: 8 },
        { key: 'grade', label: 'Sinifi', selected: false, order: 9 },
        // YENI_DUZELISLER_2026-09-17 п.3: "Müəllimi" как заголовок колонки «учитель ученика» → "Layihə müəllimi".
        { key: 'teacher', label: 'Layihə müəllimi', selected: false, order: 10 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 11 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 12 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 13 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 14 },
        { key: 'participationCount', label: 'İştirak sayı', selected: false, order: 15 },
    ],
    allTeachers: [
        { key: 'place', label: 'Respublika üzrə yer (ümumi xal)', selected: false, order: 0 },
        { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)', selected: false, order: 1 },
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer (ümumi xal)', selected: false, order: 2 },
        { key: 'averageDistrictPlace', label: 'Təhsil sektoru üzrə yer (orta xal)', selected: false, order: 3 },
        { key: 'schoolPlace', label: 'Məktəb üzrə yer (ümumi xal)', selected: false, order: 4 },
        { key: 'averageSchoolPlace', label: 'Məktəb üzrə yer (orta xal)', selected: false, order: 5 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 6 },
        { key: 'code', label: 'Kodu', selected: false, order: 7 },
        { key: 'fullName', label: 'Soyadı, adı, ata adı', selected: false, order: 8 },
        { key: 'school', label: 'Məktəbi', selected: false, order: 9 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 10 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 11 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 12 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 13 },
    ],
    allSchools: [
        { key: 'place', label: 'Respublika üzrə yer (ümumi xal)', selected: false, order: 0 },
        { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)', selected: false, order: 1 },
        { key: 'districtPlace', label: 'Təhsil sektoru üzrə yer (ümumi xal)', selected: false, order: 2 },
        { key: 'averageDistrictPlace', label: 'Təhsil sektoru üzrə yer (orta xal)', selected: false, order: 3 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 4 },
        { key: 'code', label: 'Kodu', selected: false, order: 5 },
        { key: 'name', label: 'Adı', selected: false, order: 6 },
        { key: 'district', label: 'Təhsil sektoru', selected: false, order: 7 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 8 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 9 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 10 },
    ],
    allDistricts: [
        { key: 'place', label: 'Respublika üzrə yer (ümumi xal)', selected: false, order: 0 },
        { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)', selected: false, order: 1 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 2 },
        { key: 'code', label: 'Kodu', selected: false, order: 3 },
        { key: 'name', label: 'Adı', selected: false, order: 4 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 5 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 6 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 7 },
    ],
    allRegions: [
        { key: 'place', label: 'Respublika üzrə yer (ümumi xal)', selected: false, order: 0 },
        { key: 'averagePlace', label: 'Respublika üzrə yer (orta xal)', selected: false, order: 1 },
        { key: 'filterPlace', label: 'Filtr üzrə yer', selected: false, order: 2 },
        { key: 'code', label: 'Kodu', selected: false, order: 3 },
        { key: 'name', label: 'Adı', selected: false, order: 4 },
        { key: 'districtCount', label: 'Təhsil sektorlarının sayı', selected: false, order: 5 },
        { key: 'studentCount', label: 'Şagird sayı', selected: false, order: 6 },
        { key: 'score', label: 'Reytinq xalı', selected: false, order: 7 },
        { key: 'averageScore', label: 'Orta reytinq xalı', selected: false, order: 8 },
    ],
    // Single catalog shared with stats-columns and exam-results (core/config/column-catalogs.ts).
    examResults: EXAM_RESULT_COLUMN_OPTIONS.map((c, i) => ({ ...c, selected: false, order: i })),
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
        // YENI_DUZELISLER_2026-09-17 п.3: "Müəllim" → "Layihə müəllimi".
        { key: 'teacher', label: 'Layihə müəllimi' },
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
        { key: 'profileRatings', label: 'Ön səhifə — Reytinqlər' },
    ];

    // exam-results səhifəsi (/exam-results) yalnız authGuard ilə qorunur — bütün rollara açıqdır,
    // ona görə examResults tabı da bura sadalanan bütün rollara əlavə olunub (FIXES п.4 от 04.09.2026).
    readonly roleTabAccess: Record<string, string[]> = {
        moderator: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts', 'allRegions', 'examResults'],
        regionRepresenter: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts', 'allRegions', 'examResults', 'profileRatings'],
        districtRepresenter: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'allDistricts', 'examResults', 'profileRatings'],
        schoolDirector: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'allSchools', 'examResults', 'profileRatings'],
        teacher: ['developingStudents', 'monthStudents', 'republicMonthStudents', 'allStudents', 'allTeachers', 'examResults', 'profileRatings'],
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
                this.roleTabColumns[role.key][tabKey] = tabKey === PROFILE_RATINGS_TAB
                    ? this.profileRatingColumns(role.key)
                    : this.deepCopyColumns(BASE_COLUMN_OPTIONS[tabKey] || []);
            }
        }
    }

    /** «Ön səhifə — Reytinqlər» columns of a role's own profile; unlike other tabs they start fully selected (what the profile shows now). */
    private profileRatingColumns(roleKey: string): Column[] {
        const options = PROFILE_RATING_COLUMN_OPTIONS[roleKey as ProfileRatingOwnerRole] || [];
        return options.map((c, i) => ({ key: c.key, label: c.label, selected: true, order: i }));
    }

    private deepCopyColumns(columns: Column[]): Column[] {
        return columns.map(c => ({ ...c }));
    }

    getTabsForRole(roleKey: string): TabDef[] {
        const allowedTabKeys = this.roleTabAccess[roleKey] || [];
        return this.allTabs.filter(t => allowedTabKeys.includes(t.key));
    }

    get isProfileRatingsTabActive(): boolean {
        return this.activeTabKey[this.activeRoleKey] === PROFILE_RATINGS_TAB;
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
                // profileRatings: a saved empty array means "hide every column", so any array is applied.
                if (tabKey === PROFILE_RATINGS_TAB ? Array.isArray(savedColumns) : savedColumns?.length) {
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
        if (tabKey === PROFILE_RATINGS_TAB) {
            // Default of this tab is "everything selected, original order", not "nothing selected".
            this.roleTabColumns[this.activeRoleKey][tabKey] = this.profileRatingColumns(this.activeRoleKey);
            return;
        }
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
