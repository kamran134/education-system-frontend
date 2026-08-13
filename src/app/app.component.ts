import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './core/services/auth.service';
import { PermissionsService } from './core/services/permissions.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LucideAngularModule, User, Settings, BarChart3, Building2, GraduationCap, Users, LogOut, LogIn, Sun, Moon, ChevronDown, Shield, TrendingUp } from 'lucide-angular';
import { DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from './shared/components/ui/dropdown/dropdown.component';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        RouterModule,
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatToolbarModule,
        MatMenuModule,
        MatDividerModule,
        LucideAngularModule,
        DropdownComponent,
        DropdownItemComponent,
        DropdownDividerComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [
        trigger('rotateAnimation', [
            state('default', style({ transform: 'rotate(0deg)' })),
            state('rotated', style({ transform: 'rotate(360deg)' })),
            transition('default <=> rotated', animate('300ms ease-in-out'))
        ])
    ]
})
export class AppComponent implements OnInit {
    title: string = 'İbtidai Siniflərin İnkişaf Metodikası';
    darkMode: boolean = false;
    animationState: string = 'default';
    userId: string | null = null;

    // Lucide Icons
    readonly User = User;
    readonly Settings = Settings;
    readonly BarChart3 = BarChart3;
    readonly TrendingUp = TrendingUp;
    readonly Building2 = Building2;
    readonly GraduationCap = GraduationCap;
    readonly Users = Users;
    readonly LogOut = LogOut;
    readonly LogIn = LogIn;
    readonly Sun = Sun;
    readonly Moon = Moon;
    readonly ChevronDown = ChevronDown;
    readonly Shield = Shield;

    constructor(
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private authService: AuthService,
        private router: Router,
        public permissions: PermissionsService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.matIconRegistry.addSvgIcon('dark_mode', this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/dark_mode.svg'));
        this.matIconRegistry.addSvgIcon('light_mode', this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/light_mode.svg'));
    }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.userId = this.authService.getUserId();
            this.darkMode = localStorage.getItem('theme') === 'true';
            this.setMode();

            // Проверяем и валидируем токен при старте приложения
            // Только если есть токен в localStorage
            const token = this.authService.getToken();
            if (token) {
                this.authService.validateToken().subscribe({
                    next: (isValid) => {
                        if (isValid) {
                            console.log('[APP COMPONENT] User token validated successfully');
                        } else {
                            console.log('[APP COMPONENT] User token validation failed');
                        }
                    },
                    error: (error) => {
                        console.error('[APP COMPONENT] Token validation error:', error);
                    }
                });
            } else {
                console.log('[APP COMPONENT] No token found, skipping validation');
            }
        }
    }

    isAuthorized(): boolean {
        return this.authService.getToken() !== null;
    }

    darkModeToogleChanged(): void {
        this.animationState = this.animationState === 'default' ? 'rotated' : 'default';
        this.darkMode = !this.darkMode;
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('theme', this.darkMode.toString());
        }
        this.setMode();

    }

    setMode(): void {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            document.documentElement.classList.add('dark-mode');

        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.classList.remove('dark-mode');
        }

        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            if (this.darkMode) {
                table.classList.add('dark-mode');
            } else {
                table.classList.remove('dark-mode');
            }
        });
    }

    goToProfile(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/profile']);
    }

    goToAdminPanel(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/admin']);
    }

    goToAdminDashboard(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessAdminPanel')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/admin/dashboard']);
    }

    goToUsers(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessUserManagement')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/admin/users']);
    }

    goToRatingColumns(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessRatingColumns')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/admin/rating-columns']);
    }

    goToStats(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessStats')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/stats']);
    }

    goToStatistics(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessStatistics')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/statistics']);
    }

    goToDistricts(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessDistricts')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/districts']);
    }

    goToSchools(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessSchools')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/schools']);
    }

    goToTeachers(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessTeachers')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/teachers']);
    }

    goToStudents(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessStudents')) {
            this.router.navigate(['/']);
            return;
        }
        this.router.navigate(['/students']);
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    logInOut(): void {
        if (this.isAuthorized())
            this.authService.logout();
        else
            this.router.navigate(['/login']);
    }
}
