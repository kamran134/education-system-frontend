import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Добавляем токен к запросу если он есть
    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
    } else {
        // Если токена нет, но нужны credentials
        req = req.clone({
            withCredentials: true
        });
    }
    
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && 
                !req.url.includes('/refresh') && 
                !req.url.includes('/login') &&
                !req.url.includes('/register')) {
                
                return handle401Error(req, next, authService);
            }
            return throwError(() => error);
        })
    );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
    // Если это запрос на обновление токена и он вернул 401, то refresh токен истек
    if (req.url.includes('/api/auth/refresh')) {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.logout();
        return throwError(() => new Error('Refresh token expired'));
    }

    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);
        
        return authService.refreshToken().pipe(
            switchMap((response: any) => {
                isRefreshing = false;
                refreshTokenSubject.next(response.data.token);
                
                // Повторяем оригинальный запрос с новым токеном
                const newToken = authService.getToken();
                const newReq = req.clone({
                    setHeaders: { Authorization: `Bearer ${newToken}` },
                    withCredentials: true
                });
                return next(newReq);
            }),
            catchError((error) => {
                isRefreshing = false;
                refreshTokenSubject.next(null);
                // Если обновление токена не удалось, логаут
                authService.logout();
                return throwError(() => error);
            })
        );
    } else {
        // Если уже идет процесс обновления токена, ждем его завершения
        return refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(token => {
                const newReq = req.clone({
                    setHeaders: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                });
                return next(newReq);
            })
        );
    }
}
