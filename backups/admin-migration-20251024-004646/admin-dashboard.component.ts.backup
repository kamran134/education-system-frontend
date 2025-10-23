import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';
import { AdminTokenStatsComponent } from '../../shared/components/admin-token-stats.component';
import { UserSessionsComponent } from '../../shared/components/user-sessions.component';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatSnackBarModule,
        AdminTokenStatsComponent,
        UserSessionsComponent
    ],
    template: `
        <div class="admin-dashboard">
            <mat-card class="dashboard-header">
                <mat-card-header>
                    <div mat-card-avatar class="admin-avatar">
                        <mat-icon>admin_panel_settings</mat-icon>
                    </div>
                    <mat-card-title>Admin İdarəetmə Paneli</mat-card-title>
                    <mat-card-subtitle>Sistem idarəetməsi və statistika</mat-card-subtitle>
                </mat-card-header>
            </mat-card>

            <mat-tab-group class="dashboard-tabs">
                <!-- Статистика токенов -->
                <mat-tab>
                    <ng-template mat-tab-label>
                        <mat-icon>analytics</mat-icon>
                        Token Statistikası
                    </ng-template>
                    
                    <div class="tab-content">
                        <app-admin-token-stats></app-admin-token-stats>
                        
                        <mat-card class="info-card">
                            <mat-card-header>
                                <mat-card-title>
                                    <mat-icon>info</mat-icon>
                                    Token İdarəetməsi haqqında
                                </mat-card-title>
                            </mat-card-header>
                            <mat-card-content>
                                <p><strong>Token Statistikası</strong> - sistemdəki aktiv tokenlərin ümumi məlumatlarını göstərir.</p>
                                <ul>
                                    <li><strong>Ümumi istifadəçilər:</strong> Sistemə qeydiyyatdan keçən bütün istifadəçilər</li>
                                    <li><strong>Aktiv sessiyalı istifadəçilər:</strong> Hazırda giriş etmiş istifadəçilər</li>
                                    <li><strong>Ümumi aktiv tokenlər:</strong> Bütün aktiv refresh tokenlərin sayı</li>
                                    <li><strong>Orta token sayı:</strong> Hər istifadəçiyə düşən orta cihaz sayı</li>
                                </ul>
                                <p><strong>Köhnə tokenləri təmizlə</strong> - müddəti bitmiş tokenləri silir.</p>
                            </mat-card-content>
                        </mat-card>
                    </div>
                </mat-tab>

                <!-- Личные сессии админа -->
                <mat-tab>
                    <ng-template mat-tab-label>
                        <mat-icon>person</mat-icon>
                        Şəxsi Sessiyalar
                    </ng-template>
                    
                    <div class="tab-content">
                        <app-user-sessions></app-user-sessions>
                        
                        <mat-card class="admin-actions">
                            <mat-card-header>
                                <mat-card-title>
                                    <mat-icon>security</mat-icon>
                                    Admin Əməliyyatları
                                </mat-card-title>
                            </mat-card-header>
                            <mat-card-content>
                                <p>Admin kimi siz əlavə imkanlara sahibsiniz:</p>
                                <ul>
                                    <li>Sistem tokenləri haqqında məlumat ala bilərsiniz</li>
                                    <li>Köhnə tokenləri təmizləyə bilərsiniz</li>
                                    <li>İstifadəçi sessiyalarını izləyə bilərsiniz</li>
                                </ul>
                                
                                <div class="action-buttons">
                                    <button mat-raised-button color="primary" (click)="viewSystemLogs()">
                                        <mat-icon>visibility</mat-icon>
                                        Sistem Logları
                                    </button>
                                    
                                    <button mat-raised-button color="accent" (click)="viewUserManagement()">
                                        <mat-icon>people</mat-icon>
                                        İstifadəçi İdarəetməsi
                                    </button>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </div>
                </mat-tab>

                <!-- Системная информация -->
                <mat-tab>
                    <ng-template mat-tab-label>
                        <mat-icon>settings</mat-icon>
                        Sistem
                    </ng-template>
                    
                    <div class="tab-content">
                        <mat-card class="system-info">
                            <mat-card-header>
                                <mat-card-title>
                                    <mat-icon>computer</mat-icon>
                                    Sistem Məlumatları
                                </mat-card-title>
                            </mat-card-header>
                            <mat-card-content>
                                <div class="system-stats">
                                    <div class="stat-item">
                                        <mat-icon>token</mat-icon>
                                        <span>Refresh Token sistemi aktiv</span>
                                        <mat-icon class="status-icon success">check_circle</mat-icon>
                                    </div>
                                    
                                    <div class="stat-item">
                                        <mat-icon>storage</mat-icon>
                                        <span>MongoDB əlaqəsi aktiv</span>
                                        <mat-icon class="status-icon success">check_circle</mat-icon>
                                    </div>
                                    
                                    <div class="stat-item">
                                        <mat-icon>schedule</mat-icon>
                                        <span>Avtomatik təmizləmə (24 saat)</span>
                                        <mat-icon class="status-icon success">check_circle</mat-icon>
                                    </div>
                                    
                                    <div class="stat-item">
                                        <mat-icon>security</mat-icon>
                                        <span>Maksimum 5 cihaz/istifadəçi</span>
                                        <mat-icon class="status-icon info">info</mat-icon>
                                    </div>
                                </div>
                                
                                <div class="version-info">
                                    <p><strong>Sistem versiyası:</strong> Education System v2.0</p>
                                    <p><strong>Token sistem versiyası:</strong> MongoDB-based v1.0</p>
                                    <p><strong>Son yenilik:</strong> {{getCurrentDate()}}</p>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </div>
                </mat-tab>
            </mat-tab-group>
        </div>
    `,
    styles: [`
        .admin-dashboard {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }

        .dashboard-header {
            margin-bottom: 20px;
        }

        .admin-avatar {
            background-color: #ff9800;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .dashboard-tabs {
            background: white;
            border-radius: 8px;
        }

        .tab-content {
            padding: 20px;
        }

        .info-card, .admin-actions, .system-info {
            margin-top: 20px;
        }

        .info-card ul, .admin-actions ul {
            margin: 16px 0;
            padding-left: 20px;
        }

        .info-card li, .admin-actions li {
            margin: 8px 0;
            color: #666;
        }

        .action-buttons {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            flex-wrap: wrap;
        }

        .system-stats {
            margin: 20px 0;
        }

        .stat-item {
            display: flex;
            align-items: center;
            margin: 12px 0;
            gap: 12px;
        }

        .stat-item mat-icon {
            color: #666;
        }

        .status-icon {
            margin-left: auto;
        }

        .status-icon.success {
            color: #4caf50;
        }

        .status-icon.info {
            color: #2196f3;
        }

        .version-info {
            margin-top: 20px;
            padding: 16px;
            background: #f5f5f5;
            border-radius: 8px;
        }

        .version-info p {
            margin: 8px 0;
            color: #666;
        }

        mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        @media (max-width: 600px) {
            .admin-dashboard {
                padding: 10px;
            }
            
            .action-buttons {
                justify-content: center;
            }
        }
    `]
})
export class AdminDashboardComponent implements OnInit {

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        // Компонент готов к использованию
    }

    viewSystemLogs(): void {
        // Здесь будет переход к системным логам
        console.log('Navigate to system logs');
    }

    viewUserManagement(): void {
        // Здесь будет переход к управлению пользователями
        console.log('Navigate to user management');
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}