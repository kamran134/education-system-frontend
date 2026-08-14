import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { LucideAngularModule, UserPlus, Edit, Trash2, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-users',
    imports: [FormsModule, LucideAngularModule, ButtonComponent],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, OnDestroy {
    dataSource: User[] = [];
    totalCount: number = 0;
    authorizedUserRole: string | null = null;

    // Pagination
    currentPage = 0;
    pageSize = 100;
    readonly pageSizeOptions = [25, 50, 100, 250, 500];

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

    // Sort
    sortColumn = 'email';
    sortDirection: 'asc' | 'desc' = 'asc';

    private destroy$ = new Subject<void>();

    // Icons
    readonly UserPlus = UserPlus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Users = Users;
    readonly ChevronLeft = ChevronLeft;
    readonly ChevronRight = ChevronRight;
    readonly ChevronsLeft = ChevronsLeft;
    readonly ChevronsRight = ChevronsRight;
    readonly ChevronUp = ChevronUp;
    readonly ChevronDown = ChevronDown;

    isSuperAdmin$ = this.authService.isSuperAdmin$;
    isLevelUpUser$ = this.authService.isLevelUpUser$;
    isAdminOrSuperAdmin$ = this.authService.isAdminOrSuperAdmin$;

    constructor(
        private dashboardService: DashboardService,
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
                    if (this.authorizedUserRole === 'admin' || this.authorizedUserRole === 'superadmin') this.loadUsers();
                    else this.router.navigate(['/admin/rating-columns']);
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
            page: this.currentPage + 1,
            size: this.pageSize,
            role: this.selectedRole || undefined,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
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

    getTotalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    getDisplayStart(): number {
        return this.currentPage * this.pageSize + 1;
    }

    getDisplayEnd(): number {
        return Math.min((this.currentPage + 1) * this.pageSize, this.totalCount);
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.getTotalPages()) {
            this.currentPage = page;
            this.loadUsers();
        }
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 0;
        this.loadUsers();
    }

    selectRoleTab(role: string): void {
        if (this.selectedRole === role) return;
        this.selectedRole = role;
        this.currentPage = 0;
        this.loadUsers();
    }

    getTabClasses(role: string): string {
        return this.selectedRole === role
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }

    onSortChange(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.currentPage = 0;
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
