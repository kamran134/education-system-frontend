import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from './ui/toast/toast.service';
import { ConfirmDialogService } from './ui/confirm-dialog/confirm-dialog.service';

import { AuthService } from '../../core/services/auth.service';
import { ActiveSessionsInfo } from '../../core/models/auth.models';
import { LucideAngularModule, Monitor, Clock, AlertCircle, RefreshCw, LogOut, CheckCircle, XCircle } from 'lucide-angular';
import { ButtonComponent } from './ui/button/button.component';

@Component({
    selector: 'app-user-sessions',
    imports: [
    LucideAngularModule,
    ButtonComponent
],
    template: `
        <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-2xl mx-auto my-5">
          <!-- Header -->
          <div class="mb-6">
            <div class="flex items-center space-x-2 mb-2">
              <lucide-icon [img]="Monitor" class="w-6 h-6 text-blue-600"></lucide-icon>
              <h2 class="text-2xl font-semibold text-gray-800">Aktiv Sessiyalar</h2>
            </div>
            <p class="text-sm text-gray-500">Cihaz və sessiya idarəetməsi</p>
          </div>
        
          <!-- Sessions Info -->
          @if (sessionInfo) {
            <div class="space-y-3 mb-6">
              <div class="info-item">
                <lucide-icon [img]="Monitor" class="w-5 h-5 text-gray-600"></lucide-icon>
                <span class="text-gray-700">Aktiv cihazlar: <strong class="text-gray-900">{{sessionInfo.activeSessionsCount}}</strong></span>
              </div>
              @if (sessionInfo.lastLoginAt) {
                <div class="info-item">
                  <lucide-icon [img]="Clock" class="w-5 h-5 text-gray-600"></lucide-icon>
                  <span class="text-gray-700">Son giriş: <strong class="text-gray-900">{{formatDate(sessionInfo.lastLoginAt)}}</strong></span>
                </div>
              }
              <div class="info-item">
                <lucide-icon
                  [img]="sessionInfo.currentSession ? CheckCircle : XCircle"
                  [class]="sessionInfo.currentSession ? 'w-5 h-5 text-green-600' : 'w-5 h-5 text-gray-400'">
                </lucide-icon>
                <span class="text-gray-700">Bu cihaz: <strong [class]="sessionInfo.currentSession ? 'text-green-600' : 'text-gray-500'">{{sessionInfo.currentSession ? 'Aktiv' : 'Deaktiv'}}</strong></span>
              </div>
            </div>
          }
        
          <!-- Loading State -->
          @if (loading) {
            <div class="flex items-center justify-center space-x-2 py-8">
              <lucide-icon [img]="RefreshCw" class="w-5 h-5 animate-spin text-blue-500"></lucide-icon>
              <span class="text-gray-600">Yüklənir...</span>
            </div>
          }
        
          <!-- Error State -->
          @if (error) {
            <div class="flex items-center space-x-2 text-red-600 py-4">
              <lucide-icon [img]="AlertCircle" class="w-5 h-5"></lucide-icon>
              <span>{{error}}</span>
            </div>
          }
        
          <!-- Actions -->
          <div class="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200">
            <app-button
              variant="secondary"
              (clicked)="refreshSessions()"
              [disabled]="loading">
              <div class="flex items-center space-x-2">
                <lucide-icon [img]="RefreshCw" class="w-4 h-4"></lucide-icon>
                <span>Yenilə</span>
              </div>
            </app-button>
        
            <app-button
              variant="danger"
              (clicked)="logoutFromAllDevices()"
              [disabled]="loading">
              <div class="flex items-center space-x-2">
                <lucide-icon [img]="LogOut" class="w-4 h-4"></lucide-icon>
                <span>Bütün cihazlardan çıx</span>
              </div>
            </app-button>
          </div>
        </div>
        `,
    styles: [`
        .info-item {
            @apply flex items-center space-x-3;
        }
    `]
})
export class UserSessionsComponent implements OnInit {
    sessionInfo: ActiveSessionsInfo | null = null;
    loading = false;
    error: string | null = null;

    // Icons
    readonly Monitor = Monitor;
    readonly Clock = Clock;
    readonly AlertCircle = AlertCircle;
    readonly RefreshCw = RefreshCw;
    readonly LogOut = LogOut;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;

    private destroyRef = inject(DestroyRef);

    constructor(
        private authService: AuthService,
        private toastService: ToastService,
        private confirmDialog: ConfirmDialogService
    ) {}

    ngOnInit(): void {
        this.loadSessions();
    }

    loadSessions(): void {
        this.loading = true;
        this.error = null;

        this.authService.getActiveSessions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.sessionInfo = response.data;
                } else {
                    this.error = response.message || 'Sessiya məlumatları alına bilmədi';
                }
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Serverlə əlaqə xətası';
                this.loading = false;
                console.error('Session info error:', error);
            }
        });
    }

    refreshSessions(): void {
        this.loadSessions();
    }

    async logoutFromAllDevices(): Promise<void> {
        const confirmed = await this.confirmDialog.confirm({
            title: 'Bütün cihazlardan çıxış',
            message: 'Bütün cihazlardan çıxmaq istədiyinizdən əminsiniz? Bu əməliyyat geri alına bilməz.',
            confirmText: 'Bəli, çıx',
            variant: 'danger'
        });
        if (!confirmed) return;

        this.loading = true;

        this.authService.logoutFromAllDevices().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.toastService.show('Bütün cihazlardan uğurla çıxıldı', 'success', 3000);
                    // AuthService уже перенаправит на страницу логина
                } else {
                    this.toastService.show(response.message || 'Xəta baş verdi', 'error');
                }
            },
            error: (error) => {
                this.loading = false;
                this.toastService.show('Serverlə əlaqə xətası', 'error');
                console.error('Logout all devices error:', error);
            }
        });
    }

    formatDate(date: Date | string): string {
        if (!date) return '';

        const d = new Date(date);
        return d.toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
