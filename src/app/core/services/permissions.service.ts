import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { RbacService, UserRole, RolePermissions } from '../config/rbac.config';

/**
 * Angular сервис для работы с RBAC
 * Интегрируется с AuthService и предоставляет удобные методы
 */
@Injectable({
    providedIn: 'root'
})
export class PermissionsService {
    constructor(private authService: AuthService) {}

    /**
     * Получить текущую роль пользователя
     */
    private getCurrentRole(): UserRole | null {
        const role = this.authService.getRole();
        return role as UserRole | null;
    }

    /**
     * Получить права текущего пользователя
     */
    getCurrentPermissions(): RolePermissions | null {
        const role = this.getCurrentRole();
        if (!role) return null;
        return RbacService.getPermissions(role);
    }

    /**
     * Проверить доступ к маршруту
     */
    canAccessRoute(route: keyof RolePermissions['routes']): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        return RbacService.canAccessRoute(role, route);
    }

    /**
     * Проверить доступ к маршруту (Observable)
     */
    canAccessRoute$(route: keyof RolePermissions['routes']): Observable<boolean> {
        return this.authService.isLoggedIn$.pipe(
            map(() => this.canAccessRoute(route))
        );
    }

    /**
     * Проверить права на CRUD операцию
     */
    canPerformCrud(action: keyof RolePermissions['crud']): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        return RbacService.canPerformCrud(role, action);
    }

    /**
     * Проверить видимость UI элемента
     */
    canShowUI(element: keyof RolePermissions['ui']): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        return RbacService.canShowUI(role, element);
    }

    /**
     * Проверить видимость UI элемента (Observable)
     */
    canShowUI$(element: keyof RolePermissions['ui']): Observable<boolean> {
        return this.authService.isLoggedIn$.pipe(
            map(() => this.canShowUI(element))
        );
    }

    /**
     * Проверить права на доступ к данным
     */
    hasDataAccess(access: keyof RolePermissions['dataAccess']): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        return RbacService.hasDataAccess(role, access);
    }

    /**
     * Является ли текущий пользователь админом
     */
    isAdmin(): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        return RbacService.isAdmin(role);
    }

    /**
     * Является ли текущий пользователь админом (Observable)
     */
    isAdmin$(): Observable<boolean> {
        return this.authService.isLoggedIn$.pipe(
            map(() => this.isAdmin())
        );
    }

    /**
     * Получить список доступных маршрутов
     */
    getAccessibleRoutes(): string[] {
        const role = this.getCurrentRole();
        if (!role) return [];
        return RbacService.getAccessibleRoutes(role);
    }

    /**
     * Проверить множественные права (все должны быть true)
     */
    hasAllPermissions(permissions: Array<{
        category: keyof RolePermissions;
        action: string;
    }>): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        
        return permissions.every(({ category, action }) => 
            RbacService.can(role, category, action)
        );
    }

    /**
     * Проверить множественные права (хотя бы одно должно быть true)
     */
    hasAnyPermission(permissions: Array<{
        category: keyof RolePermissions;
        action: string;
    }>): boolean {
        const role = this.getCurrentRole();
        if (!role) return false;
        
        return permissions.some(({ category, action }) => 
            RbacService.can(role, category, action)
        );
    }
}
