import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    console.log('[AUTH INTERCEPTOR] Request to:', req.url, 'Token exists:', !!token);

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
            console.log('[AUTH INTERCEPTOR] ❌ Error caught:', error.status, 'for URL:', req.url);
            console.log('[AUTH INTERCEPTOR] Error details:', error);
            
            if (error.status === 401) {
                console.log('[AUTH INTERCEPTOR] 🔍 401 error detected!');
                console.log('[AUTH INTERCEPTOR] URL check - refresh:', req.url.includes('/refresh'));
                console.log('[AUTH INTERCEPTOR] URL check - login:', req.url.includes('/login'));
                console.log('[AUTH INTERCEPTOR] URL check - register:', req.url.includes('/register'));
                
                if (!req.url.includes('/refresh') && 
                    !req.url.includes('/login') &&
                    !req.url.includes('/register')) {
                    
                    console.log('[AUTH INTERCEPTOR] 🔄 Attempting token refresh...');
                    return handle401Error(req, next, authService);
                } else {
                    console.log('[AUTH INTERCEPTOR] ❌ Skipping refresh for this URL');
                }
            }
            console.log('[AUTH INTERCEPTOR] 📤 Throwing error without refresh');
            return throwError(() => error);
        })
    );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
    console.log('[AUTH INTERCEPTOR] 🚀 handle401Error called for:', req.url);
    
    // Если это запрос на обновление токена и он вернул 401, то refresh токен истек
    if (req.url.includes('/api/auth/refresh')) {
        console.log('[AUTH INTERCEPTOR] ❌ Refresh token expired, logging out...');
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.logout();
        return throwError(() => new Error('Refresh token expired'));
    }

    if (!isRefreshing) {
        console.log('[AUTH INTERCEPTOR] 🔄 Setting isRefreshing to true');
        isRefreshing = true;
        refreshTokenSubject.next(null);
        
        console.log('[AUTH INTERCEPTOR] 📞 Calling authService.refreshToken()...');

        return authService.refreshToken().pipe(
            switchMap((response: any) => {
                console.log('[AUTH INTERCEPTOR] Token refresh successful');
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
                console.log('[AUTH INTERCEPTOR] Token refresh failed:', error);
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
