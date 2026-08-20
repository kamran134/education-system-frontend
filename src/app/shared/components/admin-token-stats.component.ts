import { Component, OnInit } from '@angular/core';
import { ToastService } from './ui/toast/toast.service';
import { ConfirmDialogService } from './ui/confirm-dialog/confirm-dialog.service';

import { AuthService } from '../../core/services/auth.service';
import { TokenStatistics } from '../../core/models/auth.models';
import { LucideAngularModule, BarChart3, Users, UserCheck, CreditCard, TrendingUp, RefreshCw, Trash2, AlertCircle } from 'lucide-angular';
import { ButtonComponent } from './ui/button/button.component';

@Component({
    selector: 'app-admin-token-stats',
    imports: [
    LucideAngularModule,
    ButtonComponent
],
    template: `
        <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-3xl mx-auto my-5">
          <!-- Header -->
          <div class="mb-6">
            <div class="flex items-center space-x-2 mb-2">
              <lucide-icon [img]="BarChart3" class="w-6 h-6 text-blue-600"></lucide-icon>
              <h2 class="text-2xl font-semibold text-gray-800">Token Statistikası</h2>
            </div>
            <p class="text-sm text-gray-500">Sistem token məlumatları (Admin)</p>
          </div>
        
          <!-- Stats Grid -->
          @if (statistics) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="stat-card">
                <div class="stat-value text-blue-600">{{statistics.totalUsers}}</div>
                <div class="stat-label">
                  <lucide-icon [img]="Users" class="w-4 h-4"></lucide-icon>
                  <span>Ümumi istifadəçilər</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-value text-green-600">{{statistics.usersWithTokens}}</div>
                <div class="stat-label">
                  <lucide-icon [img]="UserCheck" class="w-4 h-4"></lucide-icon>
                  <span>Aktiv sessiyalı istifadəçilər</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-value text-purple-600">{{statistics.totalTokens}}</div>
                <div class="stat-label">
                  <lucide-icon [img]="CreditCard" class="w-4 h-4"></lucide-icon>
                  <span>Ümumi aktiv tokenlər</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-value text-orange-600">{{statistics.averageTokensPerUser}}</div>
                <div class="stat-label">
                  <lucide-icon [img]="TrendingUp" class="w-4 h-4"></lucide-icon>
                  <span>Orta token sayı</span>
                </div>
              </div>
            </div>
          }
        
          <!-- Loading State -->
          @if (loading) {
            <div class="flex items-center justify-center space-x-2 py-8">
              <lucide-icon [img]="RefreshCw" class="w-5 h-5 animate-spin text-blue-500"></lucide-icon>
              <span class="text-gray-600">Statistika yüklənir...</span>
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
              (clicked)="refreshStats()"
              [disabled]="loading">
              <div class="flex items-center space-x-2">
                <lucide-icon [img]="RefreshCw" class="w-4 h-4"></lucide-icon>
                <span>Yenilə</span>
              </div>
            </app-button>
        
            <app-button
              variant="danger"
              (clicked)="forceCleanup()"
              [disabled]="loading">
              <div class="flex items-center space-x-2">
                <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                <span>Köhnə tokenləri təmizlə</span>
              </div>
            </app-button>
          </div>
        </div>
        `,
    styles: [`
        .stat-card {
            @apply text-center p-4 border border-gray-200 rounded-lg bg-gray-50;
        }
        
        .stat-value {
            @apply text-3xl font-bold mb-2;
        }
        
        .stat-label {
            @apply flex items-center justify-center space-x-1.5 text-gray-600 text-sm;
        }
    `]
})
export class AdminTokenStatsComponent implements OnInit {
    statistics: TokenStatistics | null = null;
    loading = false;
    error: string | null = null;

    // Icons
    readonly BarChart3 = BarChart3;
    readonly Users = Users;
    readonly UserCheck = UserCheck;
    readonly CreditCard = CreditCard;
    readonly TrendingUp = TrendingUp;
    readonly RefreshCw = RefreshCw;
    readonly Trash2 = Trash2;
    readonly AlertCircle = AlertCircle;

    constructor(
        private authService: AuthService,
        private toastService: ToastService,
        private confirmDialog: ConfirmDialogService
    ) {}

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.loading = true;
        this.error = null;
        
        this.authService.getTokenStatistics().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.statistics = response.data;
                } else {
                    this.error = response.message || 'Statistika alına bilmədi';
                }
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Serverlə əlaqə xətası. Admin icazəsi yoxdur?';
                this.loading = false;
                console.error('Token stats error:', error);
            }
        });
    }

    refreshStats(): void {
        this.loadStats();
    }

    async forceCleanup(): Promise<void> {
        const confirmed = await this.confirmDialog.confirm({
            title: 'Tokenlərin təmizlənməsi',
            message: 'Köhnə tokenləri təmizləmək istədiyinizdən əminsiniz?',
            confirmText: 'Bəli, təmizlə',
            variant: 'danger'
        });
        if (!confirmed) return;

        this.loading = true;
        
        this.authService.forceCleanupTokens().subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.toastService.show('Köhnə tokenlər uğurla təmizləndi', 'success', 3000);
                    // Обновляем статистику после очистки
                    this.loadStats();
                } else {
                    this.toastService.show(response.message || 'Təmizləmə xətası', 'error');
                }
            },
            error: (error) => {
                this.loading = false;
                this.toastService.show('Serverlə əlaqə xətası', 'error');
                console.error('Token cleanup error:', error);
            }
        });
    }
}