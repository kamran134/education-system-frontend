import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
    }
    
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('/refresh') && !req.url.includes('/login')) {
                // Попытка обновить токен
                return authService.refreshToken().pipe(
                    switchMap(() => {
                        // Повторяем запрос с новым токеном
                        const newToken = authService.getToken();
                        const newReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${newToken}` },
                            withCredentials: true
                        });
                        return next(newReq);
                    }),
                    catchError(() => {
                        // Если refresh не удался, логаут
                        authService.logout();
                        return throwError(() => error);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
