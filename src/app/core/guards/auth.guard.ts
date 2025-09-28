import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Сначала проверяем и валидируем токен
    return authService.validateToken().pipe(
        map(isValid => {
            if (!isValid) {
                router.navigate(['/login']);
                return false;
            }
            return true;
        })
    );
};