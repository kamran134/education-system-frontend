import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { PermissionsService } from './core/services/permissions.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LucideAngularModule, User, Settings, BarChart3, Building2, GraduationCap, Users, LogOut, LogIn, Sun, Moon, ChevronDown, Shield, TrendingUp, ClipboardList } from 'lucide-angular';
import { DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from './shared/components/ui/dropdown/dropdown.component';
import { ToastContainerComponent } from './shared/components/ui/toast/toast-container.component';

@Component({
    selector: 'app-root',
    imports: [
    RouterOutlet,
    RouterModule,
    LucideAngularModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    ToastContainerComponent
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
    // Лендинг ('/') рисует свою шапку — глобальная на нём скрыта.
    isLandingRoute: boolean = false;

    // Lucide Icons
    readonly User = User;
    readonly Settings = Settings;
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
    readonly BarChart3 = BarChart3;
    readonly ClipboardList = ClipboardList;

    constructor(
        private authService: AuthService,
        private router: Router,
        public permissions: PermissionsService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.isLandingRoute = this.isLandingUrl(this.router.url);
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.isLandingRoute = this.isLandingUrl(event.urlAfterRedirects);
                // Лендинг темонезависим (см. LANDING_TASK.md): без этого пересчёта переход
                // на / внутри SPA (клик по лого) сохранял бы .dark-mode на body/html с
                // предыдущей страницы — класс не снимается сам по себе при смене маршрута.
                if (isPlatformBrowser(this.platformId)) {
                    this.setMode();
                }
            });
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

    /**
     * Сравнение только по пути, без query/fragment. Якорь "Metodika ilə tanış ol" на
     * лендинге — обычный <a href="#metodika">, не routerLink, но Router всё равно ловит
     * смену фрагмента через hashchange и гоняет полный цикл навигации: urlAfterRedirects
     * при этом становится строкой "/#metodika", а не "/". Без обрезки фрагмента строгое
     * сравнение ложно проваливалось, isLandingRoute сбрасывался в false прямо на лендинге,
     * и вылезала глобальная шапка поверх собственной шапки лендинга + возвращалась тёмная
     * тема (см. setMode()).
     */
    private isLandingUrl(url: string): boolean {
        return url.split('#')[0].split('?')[0] === '/';
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
        // Лендинг ('/') всегда светлый, независимо от сохранённой темы — публичная витрина
        // держит фиксированный бренд-вид, тумблер темы на ней физически недоступен (шапка
        // скрыта). darkMode при этом не сбрасываем: вернувшись в панель, пользователь должен
        // получить свою тему обратно, а не потерять выбор из-за визита на /.
        const applyDark = this.darkMode && !this.isLandingRoute;

        if (applyDark) {
            document.body.classList.add('dark-mode');
            document.documentElement.classList.add('dark-mode');

        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.classList.remove('dark-mode');
        }

        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            if (applyDark) {
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

    goToUsers(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessUserManagement')) {
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
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
            this.router.navigate(['/panel']);
            return;
        }
        this.router.navigate(['/students']);
    }

    /**
     * Без проверки прав, в отличие от соседей: маршрут /exam-results закрыт одним authGuard,
     * ролевого ключа под него в RolePermissions['routes'] просто нет.
     */
    goToExamResults(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/exam-results']);
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
