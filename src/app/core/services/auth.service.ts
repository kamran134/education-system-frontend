import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap, catchError, switchMap, throwError, of } from 'rxjs';
import { ConfigService } from './config.service';
import { isPlatformBrowser } from '@angular/common';
import { ActiveSessionsInfo, TokenStatistics, AuthResponse, LoginResponse, RefreshResponse, UserInfo } from '../models/auth.models';
import { ROLE_PERMISSIONS, RolePermissions, UserRole } from '../config/rbac.config';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);

    // private userRole: string | null = isPlatformBrowser(this.platformId) && !!localStorage.getItem('role') ? localStorage.getItem('role') : '';
    // private userId: string | null = isPlatformBrowser(this.platformId) && !!localStorage.getItem('id') ? localStorage.getItem('id') : '';
    private authStatus = new BehaviorSubject<boolean>(this.hasToken());
    private userId = new BehaviorSubject<string | null>(
        isPlatformBrowser(this.platformId) ? localStorage.getItem('id') : null
    );
    private userRole = new BehaviorSubject<string | null>(
        isPlatformBrowser(this.platformId) ? localStorage.getItem('role') : null
    );
    private currentUserData = new BehaviorSubject<UserInfo | null>(null);

    get isLoggedIn$(): Observable<boolean> {
        return this.authStatus.asObservable();
    }

    get currentUser$(): Observable<UserInfo | null> {
        return this.currentUserData.asObservable();
    }

    getCurrentUserValue(): UserInfo | null {
        return this.currentUserData.value;
    }

    get userRole$(): Observable<string | null> {
        return this.userRole.asObservable();
    }

    get isSuperAdmin$(): Observable<boolean> {
        return this.userRole$.pipe(
            map(role => role === 'superadmin')
        );
    }

    get isAdminOrSuperAdmin$(): Observable<boolean> {
        return this.userRole$.pipe(
            map(role => role === 'admin' || role === 'superadmin')
        );
    }

    get isLevelUpUser$(): Observable<boolean> {
        return this.userRole$.pipe(
            map(role => role !== null && role !== 'superadmin')
        );
    }

    getRole(): string | null {
        if (!this.userRole.value) {
            this.userRole.next(this.getRoleFromToken());
        }
        return this.userRole.value;
    }

    getUserId(): string | null {
        if (!this.userId.value) {
            this.userId.next(this.getUserIdFromToken());
        }
        return this.userId.value;
    }

    updateUserRole(role: string | null) {
        this.userRole.next(role);
        if (isPlatformBrowser(this.platformId)) {
            if (role) {
                localStorage.setItem('role', role);
            } else {
                localStorage.removeItem('role');
            }
        }
    }

    isAdmin(): boolean {
        return this.userRole.value === 'admin';
    }

    isSuperAdmin(): boolean {
        return this.userRole.value === 'superadmin';
    }

    isAdminOrSuperAdmin(): boolean {
        return this.isAdmin() || this.isSuperAdmin();
    }

    // RBAC Permission checks — generic method
    canPerformCrud(permission: keyof RolePermissions['crud']): boolean {
        const role = this.userRole.value as UserRole;
        return role ? (ROLE_PERMISSIONS[role]?.crud[permission] ?? false) : false;
    }

    canCreateRegions(): boolean { return this.canPerformCrud('canCreateRegions'); }
    canEditRegions(): boolean { return this.canPerformCrud('canEditRegions'); }
    canDeleteRegions(): boolean { return this.canPerformCrud('canDeleteRegions'); }
    canCreateDistricts(): boolean { return this.canPerformCrud('canCreateDistricts'); }
    canEditDistricts(): boolean { return this.canPerformCrud('canEditDistricts'); }
    canDeleteDistricts(): boolean { return this.canPerformCrud('canDeleteDistricts'); }
    canCreateSchools(): boolean { return this.canPerformCrud('canCreateSchools'); }
    canEditSchools(): boolean { return this.canPerformCrud('canEditSchools'); }
    canDeleteSchools(): boolean { return this.canPerformCrud('canDeleteSchools'); }
    canCreateTeachers(): boolean { return this.canPerformCrud('canCreateTeachers'); }
    canEditTeachers(): boolean { return this.canPerformCrud('canEditTeachers'); }
    canDeleteTeachers(): boolean { return this.canPerformCrud('canDeleteTeachers'); }
    canCreateStudents(): boolean { return this.canPerformCrud('canCreateStudents'); }
    canEditStudents(): boolean { return this.canPerformCrud('canEditStudents'); }
    canDeleteStudents(): boolean { return this.canPerformCrud('canDeleteStudents'); }
    canEditExamResults(): boolean { return this.canPerformCrud('canEditExamResults'); }
    canDeleteExamResults(): boolean { return this.canPerformCrud('canDeleteExamResults'); }
    canCreateExams(): boolean { return this.canPerformCrud('canCreateExams'); }
    canEditExams(): boolean { return this.canPerformCrud('canEditExams'); }
    canDeleteExams(): boolean { return this.canPerformCrud('canDeleteExams'); }
    canEditBooklets(): boolean { return this.canPerformCrud('canEditBooklets'); }
    canDeleteBooklets(): boolean { return this.canPerformCrud('canDeleteBooklets'); }

    get isAuthorized(): boolean {
        return this.authStatus.getValue();
    }

    private hasToken(): boolean {
        return isPlatformBrowser(this.platformId) && !!localStorage.getItem('token');
    }

    private getUserIdFromToken(): string | null {
        const token = this.getToken();
        if (!token || !isPlatformBrowser(this.platformId)) {
            return null;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || null;
        }
        catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    private getRoleFromToken(): string | null {
        const token = this.getToken();
        if (!token || !isPlatformBrowser(this.platformId)) {
            return null;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role || null;
        }
        catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    login(credentials: { email: string; password: string }): Observable<AuthResponse<LoginResponse>> {
        return this.http.post<AuthResponse<LoginResponse>>(
            `${this.configService.getAuthUrl()}/login`,
            credentials,
            { withCredentials: true }).pipe(
                tap(response => {
                    if (response.success && response.data) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('id', String(response.data.user.id));
                        localStorage.setItem('role', response.data.user.role);

                        // Обновляем состояние
                        this.authStatus.next(true);
                        this.userId.next(String(response.data.user.id));
                        this.userRole.next(response.data.user.role);

                        this.router.navigate(['/admin']);
                    }
                })
            );
    }

    register(credentials: { email: string; password: string; confirmPassword: string }): Observable<any> {
        return this.http.post(`${this.configService.getAuthUrl()}/register`, credentials, { withCredentials: true });
    }

    refreshToken(): Observable<AuthResponse<RefreshResponse>> {
        return this.http.post<AuthResponse<RefreshResponse>>(`${this.configService.getAuthUrl()}/refresh`, {}, { withCredentials: true })
            .pipe(
                tap(response => {
                    if (response.success && response.data && response.data.token) {
                        // Сохраняем новый токен
                        localStorage.setItem('token', response.data.token);

                        // Декодируем токен чтобы обновить данные пользователя
                        try {
                            const payload = JSON.parse(atob(response.data.token.split('.')[1]));
                            if (payload.userId) {
                                localStorage.setItem('id', payload.userId);
                                this.userId.next(payload.userId);
                            }
                            if (payload.role) {
                                localStorage.setItem('role', payload.role);
                                this.userRole.next(payload.role);
                            }
                        } catch (error) {
                            console.error('Error decoding refreshed token:', error);
                        }
                    }
                }),
                catchError(error => {
                    // Если refresh токен истек (401), делаем logout
                    if (error.status === 401) {
                        this.logout();
                    }
                    return throwError(() => error);
                })
            );
    }

    getCurrentUser(): Observable<AuthResponse<UserInfo>> {
        return this.http.get<AuthResponse<UserInfo>>(`${this.configService.getAuthUrl()}/me`)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        if (isPlatformBrowser(this.platformId)) {
                            localStorage.setItem('id', String(response.data.id));
                            localStorage.setItem('role', response.data.role);
                        }
                        this.userId.next(String(response.data.id));
                        this.userRole.next(response.data.role);
                        this.currentUserData.next(response.data); // Сохраняем полные данные пользователя
                        this.authStatus.next(true);
                    }
                })
            );
    }

    getToken(): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem('token');
        }
        return null;
    }

    saveToken(token: string): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', token);
        }
    }

    /**
     * Проверяет текущий токен и обновляет данные пользователя
     * Если токена нет, пробует получить новый через refresh token
     */
    validateToken(): Observable<boolean> {
        const token = this.getToken();

        // Если токена нет, пробуем refresh
        if (!token) {
            return this.refreshToken().pipe(
                switchMap(() => this.getCurrentUser()),
                map(() => {
                    this.authStatus.next(true);
                    return true;
                }),
                catchError(() => {
                    this.authStatus.next(false);
                    this.userId.next(null);
                    this.userRole.next(null);
                    return of(false);
                })
            );
        }

        // Если токен есть, проверяем его валидность
        return this.getCurrentUser().pipe(
            map(() => {
                this.authStatus.next(true);
                return true;
            }),
            catchError(() => {
                // Если токен невалиден, пробуем refresh
                return this.refreshToken().pipe(
                    switchMap(() => this.getCurrentUser()),
                    map(() => {
                        this.authStatus.next(true);
                        return true;
                    }),
                    catchError(() => {
                        // Если refresh тоже не сработал, очищаем все
                        if (isPlatformBrowser(this.platformId)) {
                            localStorage.removeItem('token');
                            localStorage.removeItem('id');
                            localStorage.removeItem('role');
                        }
                        this.authStatus.next(false);
                        this.userId.next(null);
                        this.userRole.next(null);
                        return of(false);
                    })
                );
            })
        );
    }

    logout(): void {
        // Сначала очищаем локальные данные
        this.clearLocalData();

        // Затем уведомляем сервер (но не зависим от результата)
        this.http.post(`${this.configService.getAuthUrl()}/logout`, {}, { withCredentials: true })
            .pipe(
                catchError(() => of(null)) // Игнорируем ошибку
            )
            .subscribe();
    }

    private clearLocalData(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('token');
            localStorage.removeItem('id');
            localStorage.removeItem('role');
        }
        this.userRole.next(null);
        this.userId.next(null);
        this.currentUserData.next(null); // Очищаем данные пользователя
        this.authStatus.next(false);
        this.router.navigate(['/login']);
    }

    /**
     * Выход из всех устройств (удаляет все refresh токены пользователя)
     */
    logoutFromAllDevices(): Observable<any> {
        return this.http.post(`${this.configService.getAuthUrl()}/logout-all`, {}, { withCredentials: true })
            .pipe(
                tap(() => {
                    if (isPlatformBrowser(this.platformId)) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('id');
                        localStorage.removeItem('role');
                    }
                    this.userRole.next(null);
                    this.userId.next(null);
                    this.authStatus.next(false);
                    this.router.navigate(['/login']);
                })
            );
    }

    /**
     * Получить информацию об активных сессиях пользователя
     */
    getActiveSessions(): Observable<AuthResponse<ActiveSessionsInfo>> {
        return this.http.get<AuthResponse<ActiveSessionsInfo>>(`${this.configService.getAuthUrl()}/sessions`, { withCredentials: true });
    }

    /**
     * Админские методы для работы с токенами (только для админов/суперадминов)
     */
    getTokenStatistics(): Observable<AuthResponse<TokenStatistics>> {
        return this.http.get<AuthResponse<TokenStatistics>>(`${this.configService.getAuthUrl()}/admin/token-stats`, { withCredentials: true });
    }

    /**
     * Принудительная очистка истекших токенов (только для админов)
     */
    forceCleanupTokens(): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.configService.getAuthUrl()}/admin/cleanup-tokens`, {}, { withCredentials: true });
    }

    constructor(private configService: ConfigService) {
        if (isPlatformBrowser(this.platformId)) {
            const token = this.getToken();
            const storedUserId = localStorage.getItem('id');
            const storedRole = localStorage.getItem('role');

            if (token && storedUserId && storedRole) {
                this.userId.next(storedUserId);
                this.userRole.next(storedRole);
            } else if (token) {
                // Если есть токен, но нет сохраненных данных, декодируем токен
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    this.userRole.next(payload.role || null);
                    this.userId.next(payload.userId || null);

                    // Сохраняем в localStorage если их там нет
                    if (payload.userId && !storedUserId) {
                        localStorage.setItem('id', payload.userId);
                    }
                    if (payload.role && !storedRole) {
                        localStorage.setItem('role', payload.role);
                    }
                } catch (error) {
                    console.error('Error decoding token:', error);
                    // Если токен поврежден, очищаем все
                    localStorage.removeItem('token');
                    localStorage.removeItem('id');
                    localStorage.removeItem('role');
                }
            }
        }
    }
}
