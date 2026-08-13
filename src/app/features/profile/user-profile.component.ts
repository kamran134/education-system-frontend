import { Component, OnInit } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { UserInfo } from '../../core/models/auth.models';
import { UserSessionsComponent } from '../../shared/components/user-sessions.component';

@Component({
    selector: 'app-user-profile',
    imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    UserSessionsComponent
],
    template: `
        <div class="profile-container">
          <mat-card class="profile-header">
            <mat-card-header>
              <div mat-card-avatar class="profile-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <mat-card-title>İstifadəçi Profili</mat-card-title>
              @if (userInfo) {
                <mat-card-subtitle>
                  {{userInfo.email}} • {{getRoleDisplayName(userInfo.role)}}
                </mat-card-subtitle>
              }
            </mat-card-header>
          </mat-card>
        
          <mat-tab-group class="profile-tabs">
            <!-- Основная информация -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>person</mat-icon>
                Şəxsi məlumatlar
              </ng-template>
        
              <div class="tab-content">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Hesab məlumatları</mat-card-title>
                  </mat-card-header>
        
                  <mat-card-content>
                    @if (userInfo && !editMode) {
                      <div class="profile-info">
                        <div class="info-row">
                          <mat-icon>email</mat-icon>
                          <span class="label">E-mail:</span>
                          <span class="value">{{userInfo.email}}</span>
                        </div>
                        <div class="info-row">
                          <mat-icon>admin_panel_settings</mat-icon>
                          <span class="label">Rol:</span>
                          <span class="value">{{getRoleDisplayName(userInfo.role)}}</span>
                        </div>
                        <div class="info-row">
                          <mat-icon>verified</mat-icon>
                          <span class="label">Status:</span>
                          <span class="value" [class.approved]="userInfo.isApproved" [class.pending]="!userInfo.isApproved">
                            {{userInfo.isApproved ? 'Təsdiqlənib' : 'Təsdiq gözlənilir'}}
                          </span>
                        </div>
                        @if (userInfo.lastLoginAt) {
                          <div class="info-row">
                            <mat-icon>schedule</mat-icon>
                            <span class="label">Son giriş:</span>
                            <span class="value">{{formatDate(userInfo.lastLoginAt)}}</span>
                          </div>
                        }
                      </div>
                    }
        
                    <!-- Форма редактирования пароля -->
                    @if (editMode) {
                      <form [formGroup]="passwordForm" class="password-form">
                        <mat-form-field appearance="outline">
                          <mat-label>Cari şifrə</mat-label>
                          <input matInput type="password" formControlName="currentPassword">
                          <mat-icon matSuffix>lock</mat-icon>
                          @if (passwordForm.get('currentPassword')?.hasError('required')) {
                            <mat-error>
                              Cari şifrə tələb olunur
                            </mat-error>
                          }
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Yeni şifrə</mat-label>
                          <input matInput type="password" formControlName="newPassword">
                          <mat-icon matSuffix>lock_reset</mat-icon>
                          @if (passwordForm.get('newPassword')?.hasError('required')) {
                            <mat-error>
                              Yeni şifrə tələb olunur
                            </mat-error>
                          }
                          @if (passwordForm.get('newPassword')?.hasError('minlength')) {
                            <mat-error>
                              Şifrə minimum 6 simvol olmalıdır
                            </mat-error>
                          }
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Yeni şifrəni təsdiq et</mat-label>
                          <input matInput type="password" formControlName="confirmPassword">
                          <mat-icon matSuffix>lock_reset</mat-icon>
                          @if (passwordForm.get('confirmPassword')?.hasError('required')) {
                            <mat-error>
                              Şifrə təsdiqi tələb olunur
                            </mat-error>
                          }
                          @if (passwordForm.hasError('passwordMismatch')) {
                            <mat-error>
                              Şifrələr uyğun gəlmir
                            </mat-error>
                          }
                        </mat-form-field>
                      </form>
                    }
        
                    @if (loading) {
                      <div class="loading">
                        <mat-spinner diameter="30"></mat-spinner>
                        <span>Yüklənir...</span>
                      </div>
                    }
                  </mat-card-content>
        
                  <mat-card-actions>
                    <button mat-button (click)="refreshProfile()" [disabled]="loading || editMode">
                      <mat-icon>refresh</mat-icon>
                      Yenilə
                    </button>
        
                    <button mat-raised-button
                      color="primary"
                      (click)="toggleEditMode()"
                      [disabled]="loading">
                      <mat-icon>{{editMode ? 'cancel' : 'edit'}}</mat-icon>
                      {{editMode ? 'Ləğv et' : 'Şifrəni dəyiş'}}
                    </button>
        
                    @if (editMode) {
                      <button mat-raised-button
                        color="accent"
                        (click)="changePassword()"
                        [disabled]="!passwordForm.valid || loading"
                        >
                        <mat-icon>save</mat-icon>
                        Yadda saxla
                      </button>
                    }
                  </mat-card-actions>
                </mat-card>
              </div>
            </mat-tab>
        
            <!-- Управление сессиями -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>devices</mat-icon>
                Sessiyalar
              </ng-template>
        
              <div class="tab-content">
                <app-user-sessions></app-user-sessions>
        
                <mat-card class="security-tips">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>security</mat-icon>
                      Təhlükəsizlik məsləhətləri
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <ul>
                      <li>Şifrəni mütəmadi olaraq dəyişin</li>
                      <li>Naməlum cihazlardan giriş etməyin</li>
                      <li>İşdən sonra hesabdan çıxın</li>
                      <li>Sessiyaları mütəmadi yoxlayın</li>
                    </ul>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
        `,
    styles: [`
        .profile-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .profile-header {
            margin-bottom: 20px;
        }

        .profile-avatar {
            background-color: #1976d2;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .profile-tabs {
            background: white;
            border-radius: 8px;
        }

        .tab-content {
            padding: 20px;
        }

        .profile-info {
            margin: 20px 0;
        }

        .info-row {
            display: flex;
            align-items: center;
            margin: 16px 0;
            gap: 12px;
        }

        .info-row mat-icon {
            color: #666;
            width: 24px;
        }

        .info-row .label {
            font-weight: 500;
            min-width: 120px;
            color: #666;
        }

        .info-row .value {
            font-weight: 400;
        }

        .approved {
            color: #4caf50;
            font-weight: 500;
        }

        .pending {
            color: #ff9800;
            font-weight: 500;
        }

        .password-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin: 20px 0;
        }

        .loading {
            display: flex;
            align-items: center;
            gap: 16px;
            justify-content: center;
            margin: 20px 0;
            color: #666;
        }

        mat-card-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            flex-wrap: wrap;
        }

        .security-tips {
            margin-top: 20px;
        }

        .security-tips ul {
            margin: 16px 0;
            padding-left: 20px;
        }

        .security-tips li {
            margin: 8px 0;
            color: #666;
        }

        mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        @media (max-width: 600px) {
            .profile-container {
                padding: 10px;
            }

            mat-card-actions {
                justify-content: center;
            }

            .info-row {
                flex-wrap: wrap;
            }

            .info-row .label {
                min-width: auto;
            }
        }
    `]
})
export class UserProfileComponent implements OnInit {
    userInfo: UserInfo | null = null;
    loading = false;
    editMode = false;
    passwordForm: FormGroup;

    constructor(
        private authService: AuthService,
        private snackBar: MatSnackBar,
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
                    this.snackBar.open('İstifadəçi məlumatları alına bilmədi', 'Bağla', { duration: 5000 });
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('User info error:', error);
                this.snackBar.open('Serverlə əlaqə xətası', 'Bağla', { duration: 5000 });
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
            this.snackBar.open('Şifrə uğurla dəyişdirildi', 'Bağla', { duration: 3000 });
        }, 1500);
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
