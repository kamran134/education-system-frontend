import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();
    const cachedUser = authService.getCurrentUserValue();

    // Токен и данные пользователя уже свежие (например, authGuard только что провалидировал
    // их на предыдущей странице) — не гоняем ещё один /me, тот же паттерн, что в authGuard.
    if (token && cachedUser) {
        if (authService.isAdminOrSuperAdmin()) {
            return true;
        }
        // Пользователь авторизован, просто не админ — это не про сессию, ведём на /panel,
        // а не /login (тот же принцип, что и roleGuard: не разлогинивать валидного юзера).
        return router.createUrlTree(['/panel']);
    }

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
                        router.navigate(['/panel']);
                        return false;
                    }
                    return true;
                })
            );
        })
    );
};