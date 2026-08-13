import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';


@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    errorMessage = signal<string | null>(null);

    loginForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    submit() {
        if (this.loginForm.invalid) return;

        this.authService.login(this.loginForm.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (response) => {
                if (response.success) {
                    // Токен уже сохранен в сервисе, очищаем ошибку и редиректим на главную
                    this.errorMessage.set(null);
                    this.router.navigate(['/']);
                } else {
                    this.errorMessage.set(response.message || 'Girişdə xəta');
                }
            },
            error: (error) => {
                this.errorMessage.set(error?.error?.message || 'Girişdə xəta');
            }
        });
    }
}
