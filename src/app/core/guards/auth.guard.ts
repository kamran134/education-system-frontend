import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[AUTH GUARD] Checking authentication...');
    
    const token = authService.getToken();
    const cachedUser = authService.getCurrentUserValue();
    
    // Если есть токен И кешированные данные пользователя - сразу пропускаем
    if (token && cachedUser) {
        console.log('[AUTH GUARD] Token and user data cached, access granted');
        return true;
    }
    
    // Если токена нет, сразу пробуем refresh
    if (!token) {
        console.log('[AUTH GUARD] No token found, attempting refresh...');
        return authService.refreshToken().pipe(
            switchMap(() => authService.getCurrentUser()),
            map(() => {
                console.log('[AUTH GUARD] Refresh successful, access granted');
                return true;
            }),
            catchError((error) => {
                console.log('[AUTH GUARD] Refresh failed, redirecting to login:', error);
                router.navigate(['/login']);
                return of(false);
            })
        );
    }
    
    // Если токен есть но данных пользователя нет, проверяем его валидность через /me
    console.log('[AUTH GUARD] Token exists, validating...');
    return authService.getCurrentUser().pipe(
        map(() => {
            console.log('[AUTH GUARD] Token valid, access granted');
            return true;
        }),
        catchError((error) => {
            console.log('[AUTH GUARD] Token invalid, attempting refresh...');
            // Если токен невалиден, пробуем refresh
            return authService.refreshToken().pipe(
                switchMap(() => authService.getCurrentUser()),
                map(() => {
                    console.log('[AUTH GUARD] Refresh successful, access granted');
                    return true;
                }),
                catchError((refreshError) => {
                    console.log('[AUTH GUARD] Refresh failed, redirecting to login:', refreshError);
                    router.navigate(['/login']);
                    return of(false);
                })
            );
        })
    );
};