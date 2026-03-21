import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();
    const cachedUser = authService.getCurrentUserValue();

    // Если есть токен И кешированные данные пользователя - сразу пропускаем
    if (token && cachedUser) {
        return true;
    }

    // Если токена нет, сразу пробуем refresh
    if (!token) {
        return authService.refreshToken().pipe(
            switchMap(() => authService.getCurrentUser()),
            map(() => true),
            catchError(() => {
                router.navigate(['/login']);
                return of(false);
            })
        );
    }

    // Если токен есть но данных пользователя нет, проверяем его валидность через /me
    return authService.getCurrentUser().pipe(
        map(() => true),
        catchError(() =>
            authService.refreshToken().pipe(
                switchMap(() => authService.getCurrentUser()),
                map(() => true),
                catchError(() => {
                    router.navigate(['/login']);
                    return of(false);
                })
            )
        )
    );
};
