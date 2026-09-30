import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, interval } from 'rxjs';
import { LucideAngularModule, Activity, RefreshCw } from 'lucide-angular';
import { DashboardService } from '../../services/dashboard.service';
import {
    ActivityStats,
    ActivityUserItem,
    ActivityUserStatus,
    DistrictActivityStats,
    LoginsByDay,
} from '../../../../core/models/login-stats.model';
import { USER_ROLE_LABELS, userRoleLabel } from '../../../../core/config/user-role-labels.config';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { DataTableComponent, PaginationEvent, TableColumn } from '../../../../shared/components/ui/data-table/data-table.component';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { InputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';

/** Cards/tables are refreshed this often while the page is open. */
const AUTO_REFRESH_MS = 60_000;
/** Dates are shown in Baku time regardless of the browser's timezone. */
const BAKU_TZ = '+0400';
/** The backend starts collecting login events with migration 030 (deployed 30.09.2026). */
const LOGIN_HISTORY_START_HINT = '30.09.2026';

@Component({
    selector: 'app-login-stats',
    imports: [FormsModule, LucideAngularModule, ButtonComponent, DataTableComponent, FullscreenPanelComponent, SelectComponent, InputComponent],
    templateUrl: './login-stats.component.html',
})
export class LoginStatsComponent implements OnInit {
    private dashboardService = inject(DashboardService);
    private toastService = inject(ToastService);
    private destroyRef = inject(DestroyRef);

    readonly Activity = Activity;
    readonly RefreshCw = RefreshCw;
    readonly historyStartHint = LOGIN_HISTORY_START_HINT;

    stats: ActivityStats | null = null;
    statsLoading = false;

    // User list
    readonly statusTabs: { value: ActivityUserStatus; label: string }[] = [
        { value: 'never', label: 'Heç daxil olmayanlar' },
        { value: 'online', label: 'Onlayn' },
        { value: 'all', label: 'Hamısı' },
    ];
    status: ActivityUserStatus = 'never';
    selectedRole: string | null = null;
    selectedDistrictId: string | number | null = null;
    search = '';
    users: ActivityUserItem[] = [];
    usersTotal = 0;
    usersLoading = false;
    pageIndex = 0;
    pageSize = 50;
    readonly pageSizeOptions = [
        { value: 50, label: '50' },
        { value: 100, label: '100' },
        { value: 250, label: '250' },
    ];
    tableFullscreen = false;

    readonly roleOptions: SelectOption[] = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({ value, label }));

    private search$ = new Subject<void>();

    readonly userColumns: TableColumn[] = [
        { key: 'email', label: 'Email', field: 'email' },
        { key: 'role', label: 'Rol', field: 'role', formatter: (v: string) => userRoleLabel(v) },
        { key: 'districtName', label: 'Rayon', field: 'districtName', formatter: (v: string | null) => v ?? '—' },
        { key: 'schoolName', label: 'Məktəb', field: 'schoolName', formatter: (v: string | null) => v ?? '—' },
        { key: 'teacherName', label: 'Müəllim', field: 'teacherName', formatter: (v: string | null) => v ?? '—' },
        { key: 'lastLoginAt', label: 'Son giriş', field: 'lastLoginAt', formatter: (v: string | null) => this.formatDateTime(v) },
        { key: 'lastSeenAt', label: 'Son aktivlik', field: 'lastSeenAt', formatter: (v: string | null) => this.formatDateTime(v) },
    ];

    ngOnInit(): void {
        this.loadStats();
        this.loadUsers();

        this.search$
            .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.pageIndex = 0;
                this.loadUsers();
            });

        // Keep the cards/tables fresh while the page stays open; the user list is left alone so
        // paging/filtering isn't disturbed (Yenilə reloads it too).
        interval(AUTO_REFRESH_MS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.loadStats(true));
    }

    refresh(): void {
        this.loadStats();
        this.loadUsers();
    }

    loadStats(silent = false): void {
        if (!silent) this.statsLoading = true;
        this.dashboardService.getActivityStats()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (stats) => {
                    this.stats = stats;
                    this.statsLoading = false;
                },
                error: () => {
                    this.statsLoading = false;
                    if (!silent) this.toastService.show('Giriş statistikası yüklənərkən xəta baş verdi', 'error');
                },
            });
    }

    loadUsers(): void {
        this.usersLoading = true;
        this.dashboardService.getActivityUsers({
            status: this.status,
            role: this.selectedRole || undefined,
            districtId: this.selectedDistrictId || undefined,
            search: this.search.trim() || undefined,
            page: this.pageIndex + 1,
            size: this.pageSize,
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.users = result?.items ?? [];
                    this.usersTotal = result?.total ?? 0;
                    this.usersLoading = false;
                },
                error: () => {
                    this.usersLoading = false;
                    this.toastService.show('İstifadəçi siyahısı yüklənərkən xəta baş verdi', 'error');
                },
            });
    }

    selectStatus(status: ActivityUserStatus): void {
        if (this.status === status) return;
        this.status = status;
        this.pageIndex = 0;
        this.loadUsers();
    }

    onFilterChange(): void {
        this.pageIndex = 0;
        this.loadUsers();
    }

    onSearchChange(): void {
        this.search$.next();
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadUsers();
    }

    getStatusTabClasses(status: ActivityUserStatus): string {
        return this.status === status
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }

    // ---- derived data for the template ----

    roleLabel(role: string): string {
        return userRoleLabel(role);
    }

    /** Districts for the list filter come from the stats payload (only districts that have directors/teachers). */
    get districtOptions(): SelectOption[] {
        return (this.stats?.byDistrict ?? []).map(d => ({ value: d.districtId, label: d.districtName }));
    }

    private roleStats(role: string) {
        return this.stats?.byRole.find(r => r.role === role) ?? null;
    }

    get directors() { return this.roleStats('schoolDirector'); }
    get teachers() { return this.roleStats('teacher'); }

    percent(part: number, total: number): string {
        if (!total) return '0%';
        return `${Math.round((part / total) * 100)}%`;
    }

    get maxLogins(): number {
        return Math.max(1, ...(this.stats?.loginsByDay ?? []).map(d => d.logins));
    }

    barHeight(day: LoginsByDay): number {
        if (day.logins === 0) return 0;
        // Non-empty days get at least a visible sliver.
        return Math.max(3, Math.round((day.logins / this.maxLogins) * 100));
    }

    /** dd.MM label under the bar; only every 5th day (and the last) to keep the axis readable. */
    dayAxisLabel(day: LoginsByDay, index: number): string {
        const total = this.stats?.loginsByDay.length ?? 0;
        if (index % 5 !== 0 && index !== total - 1) return '';
        const [, m, d] = day.day.split('-');
        return `${d}.${m}`;
    }

    dayTooltip(day: LoginsByDay): string {
        const [y, m, d] = day.day.split('-');
        return `${d}.${m}.${y}: ${day.logins} giriş, ${day.uniqueUsers} unikal istifadəçi`;
    }

    formatDateTime(value: string | null | undefined): string {
        if (!value) return '—';
        return formatDate(value, 'dd.MM.yyyy HH:mm', 'en-US', BAKU_TZ);
    }

    trackDistrict(_: number, d: DistrictActivityStats): number {
        return d.districtId;
    }
}
