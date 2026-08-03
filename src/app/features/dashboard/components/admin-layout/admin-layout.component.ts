import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Users, Settings, BarChart3, Menu, X, LogOut, Database, ShieldCheck, GraduationCap } from 'lucide-angular';
import { PermissionsService } from '../../../../core/services/permissions.service';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule
    ],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
    // Icons
    readonly Users = Users;
    readonly Settings = Settings;
    readonly BarChart3 = BarChart3;
    readonly Menu = Menu;
    readonly X = X;
    readonly LogOut = LogOut;
    readonly Database = Database;
    readonly ShieldCheck = ShieldCheck;
    readonly GraduationCap = GraduationCap;

    sidebarOpen = signal(true);
    isAdminOrSuperAdmin$ = this.authService.isAdminOrSuperAdmin$;

    constructor(
        private authService: AuthService,
        public permissions: PermissionsService,
        private router: Router
    ) { }

    toggleSidebar(): void {
        this.sidebarOpen.set(!this.sidebarOpen());
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
