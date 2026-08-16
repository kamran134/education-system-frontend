import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { RolePermissions } from '../config/rbac.config';

/**
 * Гард для проверки доступа к маршруту на основе роли пользователя.
 *
 * Использование:
 *   canActivate: [authGuard, roleGuard('canAccessDistricts')]
 *
 * authGuard должен стоять ПЕРЕД roleGuard, чтобы гарантированно
 * иметь данные пользователя к моменту проверки роли.
 */
export const roleGuard = (routeKey: keyof RolePermissions['routes']): CanActivateFn => {
    return () => {
        const permissionsService = inject(PermissionsService);
        const router = inject(Router);

        const canAccess = permissionsService.canAccessRoute(routeKey);

        if (!canAccess) {
            router.navigate(['/panel']);
            return false;
        }

        return true;
    };
};
