import { Component, OnInit } from '@angular/core';

import { ToastService } from '../../shared/components/ui/toast/toast.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Mail, ShieldCheck, BadgeCheck, Clock, RefreshCw, X, Pencil, Save, Monitor, Loader } from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';
import { UserInfo } from '../../core/models/auth.models';
import { UserSessionsComponent } from '../../shared/components/user-sessions.component';
import { CardComponent } from '../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputComponent } from '../../shared/components/ui/form-controls/input/input.component';

@Component({
    selector: 'app-user-profile',
    imports: [
        ReactiveFormsModule,
        LucideAngularModule,
        UserSessionsComponent,
        CardComponent,
        ButtonComponent,
        InputComponent
    ],
    templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
    userInfo: UserInfo | null = null;
    loading = false;
    editMode = false;
    activeTab: number = 0;
    passwordForm: FormGroup;

    readonly User = User;
    readonly Mail = Mail;
    readonly ShieldCheck = ShieldCheck;
    readonly BadgeCheck = BadgeCheck;
    readonly Clock = Clock;
    readonly RefreshCw = RefreshCw;
    readonly X = X;
    readonly Pencil = Pencil;
    readonly Save = Save;
    readonly Monitor = Monitor;
    readonly Loader = Loader;

    constructor(
        private authService: AuthService,
        private toastService: ToastService,
        private fb: FormBuilder
    ) {
        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void {
        this.loadUserInfo();
    }

    loadUserInfo(): void {
        this.loading = true;

        this.authService.getCurrentUser().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.userInfo = response.data;
                } else {
                    this.toastService.show('İstifadəçi məlumatları alına bilmədi', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('User info error:', error);
                this.toastService.show('Serverlə əlaqə xətası', 'error');
                this.loading = false;
            }
        });
    }

    refreshProfile(): void {
        this.loadUserInfo();
    }

    toggleEditMode(): void {
        this.editMode = !this.editMode;
        if (!this.editMode) {
            this.passwordForm.reset();
        }
    }

    changePassword(): void {
        if (!this.passwordForm.valid) return;

        this.loading = true;
        const formData = this.passwordForm.value;

        // Здесь будет вызов API для смены пароля
        // Пока что просто имитируем успешную смену
        setTimeout(() => {
            this.loading = false;
            this.editMode = false;
            this.passwordForm.reset();
            this.toastService.show('Şifrə uğurla dəyişdirildi', 'success', 3000);
        }, 1500);
    }

    get currentPasswordError(): string {
        return this.passwordForm.get('currentPassword')?.hasError('required') ? 'Cari şifrə tələb olunur' : '';
    }

    get newPasswordError(): string {
        const control = this.passwordForm.get('newPassword');
        if (control?.hasError('required')) return 'Yeni şifrə tələb olunur';
        if (control?.hasError('minlength')) return 'Şifrə minimum 6 simvol olmalıdır';
        return '';
    }

    get confirmPasswordError(): string {
        const control = this.passwordForm.get('confirmPassword');
        if (control?.hasError('required')) return 'Şifrə təsdiqi tələb olunur';
        if (this.passwordForm.hasError('passwordMismatch')) return 'Şifrələr uyğun gəlmir';
        return '';
    }

    getRoleDisplayName(role: string): string {
        const roleNames: { [key: string]: string } = {
            'superadmin': 'Super Admin',
            'admin': 'Administrator',
            'moderator': 'Moderator',
            'teacher': 'Müəllim',
            'user': 'İstifadəçi'
        };
        return roleNames[role] || role;
    }

    formatDate(date: Date | string): string {
        if (!date) return '';

        const d = new Date(date);
        return d.toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private passwordMatchValidator(form: FormGroup) {
        const newPassword = form.get('newPassword');
        const confirmPassword = form.get('confirmPassword');

        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }
}
