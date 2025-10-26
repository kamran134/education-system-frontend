import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionsService } from '../services/permissions.service';
import { RolePermissions } from '../config/rbac.config';

/**
 * Директива для условного отображения элементов на основе прав доступа
 * 
 * Примеры использования:
 * 
 * <button *hasPermission="'canAccessUserManagement'; category: 'routes'">
 *   Управление пользователями
 * </button>
 * 
 * <div *hasPermission="'canCreateUsers'; category: 'crud'">
 *   Форма создания пользователя
 * </div>
 * 
 * <button *hasPermission="'showExportButtons'; category: 'ui'">
 *   Экспорт
 * </button>
 */
@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private permissionAction: string = '';
    private permissionCategory: keyof RolePermissions = 'routes';

    @Input() 
    set hasPermission(action: string) {
        this.permissionAction = action;
        this.updateView();
    }

    @Input()
    set hasPermissionCategory(category: keyof RolePermissions) {
        this.permissionCategory = category;
        this.updateView();
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionsService: PermissionsService
    ) {}

    ngOnInit(): void {
        this.updateView();
    }

    private updateView(): void {
        if (!this.permissionAction || !this.permissionCategory) {
            return;
        }

        const permissions = this.permissionsService.getCurrentPermissions();
        if (!permissions) {
            this.viewContainer.clear();
            return;
        }

        const category = permissions[this.permissionCategory] as any;
        const hasPermission = category?.[this.permissionAction] ?? false;

        if (hasPermission) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

/**
 * Директива для условного отображения на основе роли пользователя
 * 
 * Пример использования:
 * 
 * <div *hasRole="['admin', 'superadmin']">
 *   Видно только админам
 * </div>
 */
@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit {
    private allowedRoles: string[] = [];

    @Input() 
    set hasRole(roles: string | string[]) {
        this.allowedRoles = Array.isArray(roles) ? roles : [roles];
        this.updateView();
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionsService: PermissionsService
    ) {}

    ngOnInit(): void {
        this.updateView();
    }

    private updateView(): void {
        const permissions = this.permissionsService.getCurrentPermissions();
        if (!permissions) {
            this.viewContainer.clear();
            return;
        }

        // Простая проверка - нужно получить текущую роль из сервиса
        // Пока используем isAdmin как пример
        const hasRole = this.allowedRoles.some(role => {
            if (role === 'admin' || role === 'superadmin') {
                return this.permissionsService.isAdmin();
            }
            return false;
        });

        if (hasRole) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }
}
