import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Сначала валидируем токен, потом проверяем роль
    return authService.validateToken().pipe(
        switchMap(isValid => {
            if (!isValid) {
                router.navigate(['/login']);
                return [false];
            }
            
            return authService.isAdminOrSuperAdmin$.pipe(
                map(isAdminOrSuperAdmin => {
                    if (!isAdminOrSuperAdmin) {
                        router.navigate(['/login']);
                        return false;
                    }
                    return true;
                })
            );
        })
    );
};