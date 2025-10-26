import { Component, OnInit, OnDestroy } from '@angular/core';
import { User, UserResponse, UserEdit } from '../../../../core/models/user.model';
import { DashboardService } from '../../services/dashboard.service';
import { UserEditDialogComponent } from '../user-edit-dialog/user-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, UserPlus, Edit, Trash2, Users } from 'lucide-angular';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, ButtonComponent],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, OnDestroy {
    dataSource: User[] = [];
    totalCount: number = 0;
    matSnackConfig: MatSnackBarConfig = {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
    }
    authorizedUserRole: string | null = null;
    
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
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private router: Router
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
        this.dashboardService.getUsers({ page: 1, size: 10 })
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

    onUserCreate(): void {
        const dialogRef = this.dialog.open(UserEditDialogComponent, {
            width: '1000px',
            data: {
                email: '',
                password: '',
                role: 'USER', // Default role, can be changed in dialog
                isApproved: false,
                firstName: '',
                lastName: ''
            }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result: UserEdit) => {
                if (result) {
                    this.dashboardService.createUser(result)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadUsers();
                                this.snackBar.open('Yeni istifadəçi yaradıldı', 'Bağla', this.matSnackConfig);
                            },
                            error: (error) => {
                                console.error(error);
                                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
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
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: { title: 'Silinməyə razılıq', text: 'İstifadəçini silmək istədiyinizdən əminsiniz mi?' }
        });

        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed && this.authService.isAdminOrSuperAdmin()) {
                this.dashboardService.deleteUser(user._id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.loadUsers();
                            this.snackBar.open('İstifadəçi silindi', 'Bağla', this.matSnackConfig);
                        },
                        error: (error) => {
                            console.error(error);
                            this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                        }
                    });
            }
        });
    }

    openEditDialog(user: User): void {
        const dialogRef = this.dialog.open(UserEditDialogComponent, {
            width: '1000px',
            data: user
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result: UserEdit) => {
                if (result) {
                    this.dashboardService.editUser(result)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadUsers();
                                this.snackBar.open('İstifadəçi məlumatları yeniləndi', 'Bağla', this.matSnackConfig);
                            },
                            error: (error) => {
                                console.error(error);
                                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                            }
                        });
                }
            });
    }

    openUserDetails(user: User): void {
        const dialogRef = this.dialog.open(UserEditDialogComponent, {
            width: '1000px',
            data: user
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result: UserEdit) => {
                if (result) {
                    this.dashboardService.editUser(result)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadUsers();
                            },
                            error: (error) => {
                                console.error(error);
                                this.snackBar.open(error.error.message, 'Bağla', this.matSnackConfig);
                            }
                        });
                }
            });
    }
}
