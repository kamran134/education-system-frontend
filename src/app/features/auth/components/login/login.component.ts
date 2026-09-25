import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
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
    // Пока запрос в полёте, повторные нажатия игнорируем: раньше серия тапов слала
    // по 10 запросов в секунду и сразу упиралась в rate-limit бэка.
    loading = signal(false);

    loginForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    submit() {
        if (this.loginForm.invalid || this.loading()) return;

        this.loading.set(true);
        this.errorMessage.set(null);
        const { email, password } = this.loginForm.getRawValue();
        this.authService.login({ email: email.trim(), password }).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                if (response.success) {
                    // Токен уже сохранен в сервисе, очищаем ошибку и редиректим на панель.
                    // '/' теперь публичный лендинг, рабочий экран — '/panel'.
                    this.errorMessage.set(null);
                    this.router.navigate(['/panel']);
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
