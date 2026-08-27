import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { PermissionsService } from './core/services/permissions.service';
import { NavigationHistoryService } from './core/services/navigation-history.service';
import { ProfileChangeService } from './core/services/profile-change.service';
import { isOwnerRole } from './core/config/owner-roles.config';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LucideAngularModule, User, Settings, BarChart3, Building2, GraduationCap, Users, LogOut, LogIn, Sun, Moon, ChevronDown, Shield, TrendingUp, ClipboardList, ClipboardCheck, LayoutGrid, UserCog, UserCheck, Landmark, Home } from 'lucide-angular';
import { DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from './shared/components/ui/dropdown/dropdown.component';
import { ToastContainerComponent } from './shared/components/ui/toast/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-root',
    imports: [
    RouterOutlet,
    RouterModule,
    LucideAngularModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    ToastContainerComponent,
    ConfirmDialogComponent
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
    isPublicBrandRoute: boolean = false;
    // '/admin/*' (свой topbar+сайдбар) и '/sertifikat/:token' (публичная страница проверки,
    // своя мини-шапка с лого) тоже рисуют собственную шапку. Без этого флага глобальная
    // накладывалась поверх неё — на десктопе выглядело как toolbar над toolbar, на мобильном
    // читалось однозначно как «два хедера подряд».
    hideGlobalHeader: boolean = false;

    /** Бейдж «Təsdiq gözləyən məlumatlar» в İdarəetmə (BASE_FIXES_TASK.md §2.7) — грузится
     *  один раз здесь, дальше обновляется локально сервисом после approve/reject/submit. */
    pendingChangesCount = 0;

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
    readonly ClipboardCheck = ClipboardCheck;
    readonly LayoutGrid = LayoutGrid;
    readonly UserCog = UserCog;
    readonly UserCheck = UserCheck;
    readonly Landmark = Landmark;
    readonly Home = Home;

    constructor(
        private authService: AuthService,
        private router: Router,
        public permissions: PermissionsService,
        // Инъекция здесь ничем не пользуется напрямую — но providedIn:'root' создаёт сервис
        // лениво при первом обращении, а профильным страницам он нужен уже готовым, с живой
        // подпиской на события роутера с самого первого NavigationEnd (BASE_FIXES_TASK.md §1.5).
        // AppComponent конструируется раньше первой навигации, поэтому это надёжная точка входа.
        navigationHistory: NavigationHistoryService,
        private profileChangeService: ProfileChangeService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.isPublicBrandRoute = this.isPublicBrandUrl(this.router.url);
        this.hideGlobalHeader = this.hasOwnHeader(this.router.url);
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.isPublicBrandRoute = this.isPublicBrandUrl(event.urlAfterRedirects);
                this.hideGlobalHeader = this.hasOwnHeader(event.urlAfterRedirects);
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

            this.profileChangeService.pendingCount$.subscribe((n) => { this.pendingChangesCount = n; });
            if (this.isAuthorized() && this.permissions.canAccessRoute('canAccessProfileChanges')) {
                this.profileChangeService.refreshPendingCount();
            }

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
     * Роли с привязанной сущностью (BASE_FIXES_TASK.md §1.2): вместо полной навигации
     * («Bölmələr»/«Profil»/«İdarəetmə») в шапке — одно меню с именем сущности.
     */
    isOwnerRole(): boolean {
        return isOwnerRole(this.authService.getRole());
    }

    /** У ученика нет своей области видимости для /statistics (BASE_FIXES_TASK.md §1.2) — ему в
     *  сжатом меню оставляем только «Reytinqlər» и «Çıxış et». */
    showStatisticsMenuItem(): boolean {
        return this.authService.getRole() !== 'student';
    }

    get ownerDisplayName(): string {
        const user = this.authService.getCurrentUserValue();
        return user?.profile?.fullName ?? user?.profile?.name ?? user?.email ?? '';
    }

    /** Лого: залогиненный идёт в свой кабинет, гость — на лендинг (BASE_FIXES_TASK.md §1.1). */
    goHome(): void {
        this.router.navigate([this.isAuthorized() ? '/panel' : '/']);
    }

    /**
     * Публичные брендовые страницы: лендинг и «İSİM metodikası». У обеих своя шапка и подвал
     * (PublicHeaderComponent / PublicFooterComponent), поэтому глобальная шапка на них скрыта,
     * а тема всегда светлая — это витрина с фиксированным бренд-видом (см. setMode()).
     *
     * Сравнение только по пути, без query/fragment: якоря внутри страницы («#hedef», «#uslub»
     * на /metodika) — обычные <a href="#...">, но Router всё равно ловит смену фрагмента через
     * hashchange и гоняет полный цикл навигации, где urlAfterRedirects становится строкой вида
     * "/metodika#hedef". Без обрезки фрагмента сравнение ложно проваливалось бы прямо на
     * странице, и поверх собственной шапки вылезала бы глобальная плюс тёмная тема.
     */
    private isPublicBrandUrl(url: string): boolean {
        const path = url.split('#')[0].split('?')[0];
        return path === '/' || path === '/metodika';
    }

    private hasOwnHeader(url: string): boolean {
        const path = url.split('#')[0].split('?')[0];
        return path.startsWith('/admin') || path.startsWith('/sertifikat/');
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
        const applyDark = this.darkMode && !this.isPublicBrandRoute;

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

    goToProfileChanges(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessProfileChanges')) {
            this.router.navigate(['/panel']);
            return;
        }
        this.router.navigate(['/admin/profile-changes']);
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

    goToRegions(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.permissions.canAccessRoute('canAccessRegions')) {
            this.router.navigate(['/panel']);
            return;
        }
        this.router.navigate(['/regions']);
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
