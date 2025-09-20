import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, HttpClientModule, CommonModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    errorMessage = signal<string | null>(null);
  
    registerForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.passwordsMatch });
  
    passwordsMatch(group: any) {
        const password = group.controls['password'];
        const confirmPassword = group.controls['confirmPassword'];
        return password.value === confirmPassword.value ? null : { mismatch: true };
    }
  
    submit() {
        if (this.registerForm.invalid) return;

        this.authService.register(this.registerForm.getRawValue()).subscribe({
            next: (response) => {
                // Регистрация прошла успешно, перенаправляем на логин
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.errorMessage.set(err.error.message || 'Qeydiyyat zamanı xəta');
            }
        });
    }
}
