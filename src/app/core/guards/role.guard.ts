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
 * Порядок в массиве не гарантирует, что authGuard отработает первым: гварды одного
 * canActivate подписываются через combineLatest (см. prioritizedGuardValue в
 * @angular/router), то есть параллельно. Роутер действительно дождётся результата
 * authGuard, прежде чем применить решение roleGuard — но только если roleGuard
 * возвращает значение (UrlTree/true/false), а не выполняет побочный эффект сам.
 * Поэтому редирект отдаётся через router.createUrlTree(...), а не router.navigate() —
 * с navigate() побочный эффект уже случился бы в момент подписки, до того как
 * authGuard успел бы восстановить сессию через refresh.
 */
export const roleGuard = (routeKey: keyof RolePermissions['routes']): CanActivateFn => {
    return () => {
        const permissionsService = inject(PermissionsService);
        const router = inject(Router);

        const canAccess = permissionsService.canAccessRoute(routeKey);

        if (!canAccess) {
            return router.createUrlTree(['/panel']);
        }

        return true;
    };
};
