import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TokenStatistics } from '../../core/models/auth.models';

@Component({
    selector: 'app-admin-token-stats',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    template: `
        <mat-card class="stats-card">
            <mat-card-header>
                <mat-card-title>
                    <mat-icon>analytics</mat-icon>
                    Token Statistikası
                </mat-card-title>
                <mat-card-subtitle>Sistem token məlumatları (Admin)</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
                <div class="stats-grid" *ngIf="statistics">
                    <div class="stat-item">
                        <div class="stat-value">{{statistics.totalUsers}}</div>
                        <div class="stat-label">
                            <mat-icon>people</mat-icon>
                            Ümumi istifadəçilər
                        </div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-value">{{statistics.usersWithTokens}}</div>
                        <div class="stat-label">
                            <mat-icon>person_pin</mat-icon>
                            Aktiv sessiyalı istifadəçilər
                        </div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-value">{{statistics.totalTokens}}</div>
                        <div class="stat-label">
                            <mat-icon>token</mat-icon>
                            Ümumi aktiv tokenlər
                        </div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-value">{{statistics.averageTokensPerUser}}</div>
                        <div class="stat-label">
                            <mat-icon>trending_up</mat-icon>
                            Orta token sayı
                        </div>
                    </div>
                </div>
                
                <div class="loading" *ngIf="loading">
                    <mat-icon>refresh</mat-icon>
                    Statistika yüklənir...
                </div>
                
                <div class="error" *ngIf="error">
                    <mat-icon>error</mat-icon>
                    {{error}}
                </div>
            </mat-card-content>
            
            <mat-card-actions>
                <button mat-button (click)="refreshStats()" [disabled]="loading">
                    <mat-icon>refresh</mat-icon>
                    Yenilə
                </button>
                
                <button mat-raised-button 
                        color="accent" 
                        (click)="forceCleanup()" 
                        [disabled]="loading">
                    <mat-icon>cleaning_services</mat-icon>
                    Köhnə tokenləri təmizlə
                </button>
            </mat-card-actions>
        </mat-card>
    `,
    styles: [`
        .stats-card {
            max-width: 600px;
            margin: 20px auto;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        
        .stat-item {
            text-align: center;
            padding: 16px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 8px;
        }
        
        .stat-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: #666;
            font-size: 0.9em;
        }
        
        .stat-label mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
        
        .loading, .error {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 0;
            justify-content: center;
        }
        
        .error {
            color: #f44336;
        }
        
        mat-card-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    `]
})
export class AdminTokenStatsComponent implements OnInit {
    statistics: TokenStatistics | null = null;
    loading = false;
    error: string | null = null;

    constructor(
        private authService: AuthService,
        private snackBar: MatSnackBar
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

    forceCleanup(): void {
        if (!confirm('Köhnə tokenləri təmizləmək istədiyinizdən əminsiniz?')) {
            return;
        }

        this.loading = true;
        
        this.authService.forceCleanupTokens().subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.snackBar.open('Köhnə tokenlər uğurla təmizləndi', 'Bağla', { duration: 3000 });
                    // Обновляем статистику после очистки
                    this.loadStats();
                } else {
                    this.snackBar.open(response.message || 'Təmizləmə xətası', 'Bağla', { duration: 5000 });
                }
            },
            error: (error) => {
                this.loading = false;
                this.snackBar.open('Serverlə əlaqə xətası', 'Bağla', { duration: 5000 });
                console.error('Token cleanup error:', error);
            }
        });
    }
}