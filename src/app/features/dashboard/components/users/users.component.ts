import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { User, UserResponse, UserEdit } from '../../../../core/models/user.model';
import { DashboardService } from '../../services/dashboard.service';
import { UserEditDialogComponent } from '../user-edit-dialog/user-edit-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ExcelService } from '../../../../core/services/excel.service';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, UserPlus, Edit, Trash2, Users } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Subject, takeUntil } from 'rxjs';
import { DataTableComponent, TableColumn, TableAction, PaginationEvent } from '../../../../shared/components/ui/data-table/data-table.component';
import { TABLE_PAGE_SIZE_DEFAULT, TABLE_PAGE_SIZE_OPTIONS } from '../../../../shared/components/ui/data-table/table-defaults';
import { FullscreenPanelComponent } from '../../../../shared/components/ui/fullscreen-panel/fullscreen-panel.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/ui/form-controls/select/select.component';
import { FilterParams } from '../../../../core/models/filterParams.model';
import { District } from '../../../../core/models/district.model';
import { School } from '../../../../core/models/school.model';
import { Teacher } from '../../../../core/models/teacher.model';
import { DistrictService } from '../../../districts/services/district.service';
import { SchoolService } from '../../../schools/services/school.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';

@Component({
    selector: 'app-users',
    imports: [FormsModule, LucideAngularModule, ButtonComponent, DataTableComponent, FullscreenPanelComponent, SelectComponent],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, OnDestroy {
    dataSource: User[] = [];
    totalCount: number = 0;
    authorizedUserRole: string | null = null;

    // Pagination
    pageIndex = 0;
    pageSize = TABLE_PAGE_SIZE_DEFAULT;
    readonly pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS;
    tableFullscreen = false;

    // Role tabs
    readonly roleTabs = [
        { value: 'superadmin', label: 'Superadmin' },
        { value: 'admin', label: 'Admin' },
        { value: 'moderator', label: 'Moderator' },
        { value: 'regionRepresenter', label: 'Regional idarə nümayəndəsi' },
        { value: 'districtRepresenter', label: 'Rayon nümayəndəsi' },
        { value: 'schoolDirector', label: 'Məktəb direktoru' },
        { value: 'teacher', label: 'Müəllim' },
        { value: 'student', label: 'Şagird' },
    ];
    selectedRole = 'student';

    // Rayon/məktəb/müəllim фильтры (FIXES п.9 от 04.09.2026) — есть смысл только на табах, где
    // у пользователя есть эффективная привязка к иерархии.
    readonly filterableRoles = ['schoolDirector', 'teacher', 'student'];
    get showHierarchyFilters(): boolean {
        return this.filterableRoles.includes(this.selectedRole);
    }

    districts: District[] = [];
    schools: School[] = [];
    teachers: Teacher[] = [];
    selectedDistrictIds: string[] = [];
    selectedSchoolIds: string[] = [];
    selectedTeacherIds: string[] = [];

    get districtOptions(): SelectOption[] {
        return this.districts.map(district => ({ value: district.id, label: district.name }));
    }

    get schoolOptions(): SelectOption[] {
        return this.schools.map(school => ({ value: school.id, label: school.name }));
    }

    get teacherOptions(): SelectOption[] {
        return this.teachers.map(teacher => ({ value: teacher.id, label: teacher.fullname }));
    }

    // Sort
    sortColumn = 'email';
    sortDirection: 'asc' | 'desc' = 'asc';

    private destroy$ = new Subject<void>();

    // Icons
    readonly UserPlus = UserPlus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Users = Users;

    isSuperAdmin$ = this.authService.isSuperAdmin$;
    isLevelUpUser$ = this.authService.isLevelUpUser$;
    isAdminOrSuperAdmin$ = this.authService.isAdminOrSuperAdmin$;

    constructor(
        private dashboardService: DashboardService,
        private districtService: DistrictService,
        private schoolService: SchoolService,
        private teacherService: TeacherService,
        private dialog: Dialog,
        private toastService: ToastService,
        private authService: AuthService,
        private router: Router,
        private excelService: ExcelService
    ) {}

    ngOnInit(): void {
        // Initial load of users or rating columns based on user role
        this.authService.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe(isLoggedIn => {
                if (isLoggedIn) {
                    this.authorizedUserRole = this.authService.getRole();
                    if (this.authorizedUserRole === 'admin' || this.authorizedUserRole === 'superadmin') {
                        if (this.showHierarchyFilters) this.loadDistricts();
                        this.loadUsers();
                    } else this.router.navigate(['/admin/rating-columns']);
                } else {
                    this.router.navigate(['/login']);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isLevelUpUser(user: User): boolean {
        return user.role === 'superadmin' && this.authorizedUserRole !== 'superadmin';
    }

    @ViewChild('roleCell', { static: true }) roleCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;
    @ViewChild('approvedCell', { static: true }) approvedCellTemplate!: TemplateRef<{ $implicit: any; row: any }>;

    get tableColumns(): TableColumn[] {
        return [
            { key: 'email', label: 'E-mail', sortable: true },
            { key: 'role', label: 'Vəzifəsi', sortable: true, cellTemplate: this.roleCellTemplate },
            // Bağlı olduğu sahə (məktəb/müəllim/şagird/rayon/region adı) — admin-oxşar rollarda yoxdur (FIXES п.9).
            { key: 'linkedName', label: 'Bağlı olduğu', sortable: false, formatter: (value: string | undefined) => value || '—' },
            { key: 'isApproved', label: 'Təsdiq', sortable: false, cellTemplate: this.approvedCellTemplate }
        ];
    }

    get tableActions(): TableAction[] {
        return [
            {
                key: 'edit',
                label: 'Redaktə',
                icon: this.Edit,
                variant: 'secondary',
                condition: (user: User) => !this.isLevelUpUser(user)
            },
            {
                key: 'delete',
                label: 'Sil',
                icon: this.Trash2,
                variant: 'danger',
                condition: (user: User) => !this.isLevelUpUser(user) && user.role !== 'superadmin'
            }
        ];
    }

    onTableAction(event: { action: string; item: User }): void {
        if (event.action === 'edit') {
            this.onUserUpdate(event.item);
        } else if (event.action === 'delete') {
            this.onUserDelete(event.item);
        }
    }

    getRoleBadgeClass(role: string): string {
        const roleClasses: Record<string, string> = {
            'superadmin': 'bg-purple-100 text-purple-800',
            'admin': 'bg-blue-100 text-blue-800',
            'USER': 'bg-gray-100 text-gray-800'
        };
        return roleClasses[role] || 'bg-gray-100 text-gray-800';
    }

    loadUsers(): void {
        this.dashboardService.getUsers({
            page: this.pageIndex + 1,
            size: this.pageSize,
            role: this.selectedRole || undefined,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
            districtIds: this.showHierarchyFilters && this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
            schoolIds: this.showHierarchyFilters && this.selectedSchoolIds.length > 0 ? this.selectedSchoolIds : undefined,
            teacherIds: this.showHierarchyFilters && this.selectedTeacherIds.length > 0 ? this.selectedTeacherIds : undefined
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data: UserResponse) => {
                    this.dataSource = data.data;
                    this.totalCount = data.totalCount;
                },
                error: (err) => {
                    console.error('Error loading users:', err);
                }
            });
    }

    onPageChange(event: PaginationEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadUsers();
    }

    selectRoleTab(role: string): void {
        if (this.selectedRole === role) return;
        this.selectedRole = role;
        this.pageIndex = 0;
        this.resetHierarchyFilters();
        if (this.showHierarchyFilters && this.districts.length === 0) {
            this.loadDistricts();
        }
        this.loadUsers();
    }

    getTabClasses(role: string): string {
        return this.selectedRole === role
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }

    private resetHierarchyFilters(): void {
        this.selectedDistrictIds = [];
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.schools = [];
        this.teachers = [];
    }

    loadDistricts(): void {
        const params: FilterParams = { page: 1, size: 1000, sortColumn: 'name', sortDirection: 'asc' };
        this.districtService.getDistricts(params).subscribe({
            next: (response) => {
                this.districts = ResponseHandlerUtil.extractData<District[]>(response) || [];
            },
            error: (err: any) => {
                console.error('Error loading districts:', err);
            }
        });
    }

    loadSchools(): void {
        if (this.selectedDistrictIds.length === 0) {
            this.schools = [];
            return;
        }
        const params: FilterParams = { districtIds: this.selectedDistrictIds.join(',') };
        this.schoolService.getSchoolsForFilter(params).subscribe({
            next: (schools) => {
                this.schools = schools || [];
            },
            error: (err: any) => {
                console.error('Error loading schools:', err);
            }
        });
    }

    loadTeachers(): void {
        if (this.selectedSchoolIds.length === 0) {
            this.teachers = [];
            return;
        }
        const params: FilterParams = { schoolIds: this.selectedSchoolIds.join(',') };
        this.teacherService.getTeachersForFilter(params).subscribe({
            next: (teachers) => {
                this.teachers = teachers || [];
            },
            error: (err: any) => {
                console.error('Error loading teachers:', err);
            }
        });
    }

    onDistrictChange(districtIds: string[]): void {
        this.selectedDistrictIds = districtIds || [];
        this.selectedSchoolIds = [];
        this.selectedTeacherIds = [];
        this.teachers = [];
        this.loadSchools();
        this.pageIndex = 0;
        this.loadUsers();
    }

    onSchoolChange(schoolIds: string[]): void {
        this.selectedSchoolIds = schoolIds || [];
        this.selectedTeacherIds = [];
        this.loadTeachers();
        this.pageIndex = 0;
        this.loadUsers();
    }

    onTeacherChange(teacherIds: string[]): void {
        this.selectedTeacherIds = teacherIds || [];
        this.pageIndex = 0;
        this.loadUsers();
    }

    onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortColumn = event.column;
        this.sortDirection = event.direction;
        this.pageIndex = 0;
        this.loadUsers();
    }

    onUserCreate(): void {
        const dialogRef = this.dialog.open<any>(UserEditDialogComponent, {
            width: '1000px',
            data: {
                email: '',
                password: '',
                role: this.selectedRole, // Default to the currently active role tab
                isApproved: false,
                firstName: '',
                lastName: ''
            }
        });

        dialogRef.closed
            .pipe(takeUntil(this.destroy$))
            .subscribe((result: UserEdit | undefined) => {
                if (result) {
                    this.dashboardService.createUser(result)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadUsers();
                                this.toastService.show('Yeni istifadəçi yaradıldı', 'success');
                                if (result.password) {
                                    this.excelService.exportUserCredentials({
                                        email: result.email,
                                        password: result.password,
                                        role: result.role
                                    });
                                }
                            },
                            error: (error) => {
                                console.error(error);
                                this.toastService.show(error.error.message, 'error');
                            }
                        });
                }
            });
    }

    onUserUpdate(user: User): void {
        // Синхронная проверка прав вместо подписки на Observable
        if (this.authService.isAdminOrSuperAdmin()) {
            this.openEditDialog(user);
        }
    }

    onUserDelete(user: User): void {
        const confirmRef = this.dialog.open<any>(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'İstifadəçini silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.closed.pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean | undefined) => {
            if (confirmed && this.authService.isAdminOrSuperAdmin()) {
                this.dashboardService.deleteUser(user.id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.loadUsers();
                            this.toastService.show('İstifadəçi silindi', 'success');
                        },
                        error: (error) => {
                            console.error(error);
                            this.toastService.show(error.error.message, 'error');
                        }
                    });
            }
        });
    }

    openEditDialog(user: User): void {
        const dialogRef = this.dialog.open<any>(UserEditDialogComponent, {
            width: '1000px',
            data: user
        });

        dialogRef.closed
            .pipe(takeUntil(this.destroy$))
            .subscribe((result: UserEdit | undefined) => {
                if (result) {
                    this.dashboardService.editUser(result)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadUsers();
                                this.toastService.show('İstifadəçi məlumatları yeniləndi', 'success');
                            },
                            error: (error) => {
                                console.error(error);
                                this.toastService.show(error.error.message, 'error');
                            }
                        });
                }
            });
    }

    openUserDetails(user: User): void {
        const dialogRef = this.dialog.open<any>(UserEditDialogComponent, {
            width: '1000px',
            data: user
        });

        dialogRef.closed
            .pipe(takeUntil(this.destroy$))
            .subscribe((result: UserEdit | undefined) => {
                if (result) {
                    this.dashboardService.editUser(result)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadUsers();
                            },
                            error: (error) => {
                                console.error(error);
                                this.toastService.show(error.error.message, 'error');
                            }
                        });
                }
            });
    }
}
