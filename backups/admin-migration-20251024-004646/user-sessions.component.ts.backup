import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ActiveSessionsInfo } from '../../core/models/auth.models';

@Component({
    selector: 'app-user-sessions',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    template: `
        <mat-card class="sessions-card">
            <mat-card-header>
                <mat-card-title>
                    <mat-icon>devices</mat-icon>
                    Aktiv Sessiyalar
                </mat-card-title>
                <mat-card-subtitle>Cihaz və sessiya idarəetməsi</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
                <div class="sessions-info" *ngIf="sessionInfo">
                    <div class="info-item">
                        <mat-icon>smartphone</mat-icon>
                        <span>Aktiv cihazlar: <strong>{{sessionInfo.activeSessionsCount}}</strong></span>
                    </div>
                    
                    <div class="info-item" *ngIf="sessionInfo.lastLoginAt">
                        <mat-icon>access_time</mat-icon>
                        <span>Son giriş: <strong>{{formatDate(sessionInfo.lastLoginAt)}}</strong></span>
                    </div>
                    
                    <div class="info-item">
                        <mat-icon [class.current-device]="sessionInfo.currentSession">
                            {{sessionInfo.currentSession ? 'computer' : 'device_unknown'}}
                        </mat-icon>
                        <span>Bu cihaz: <strong>{{sessionInfo.currentSession ? 'Aktiv' : 'Deaktiv'}}</strong></span>
                    </div>
                </div>
                
                <div class="loading" *ngIf="loading">
                    <mat-icon>refresh</mat-icon>
                    Yüklənir...
                </div>
                
                <div class="error" *ngIf="error">
                    <mat-icon>error</mat-icon>
                    {{error}}
                </div>
            </mat-card-content>
            
            <mat-card-actions>
                <button mat-button (click)="refreshSessions()" [disabled]="loading">
                    <mat-icon>refresh</mat-icon>
                    Yenilə
                </button>
                
                <button mat-raised-button 
                        color="warn" 
                        (click)="logoutFromAllDevices()" 
                        [disabled]="loading">
                    <mat-icon>logout</mat-icon>
                    Bütün cihazlardan çıx
                </button>
            </mat-card-actions>
        </mat-card>
    `,
    styles: [`
        .sessions-card {
            max-width: 500px;
            margin: 20px auto;
        }
        
        .sessions-info {
            margin: 16px 0;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            margin: 12px 0;
            gap: 12px;
        }
        
        .info-item mat-icon {
            color: #666;
        }
        
        .current-device {
            color: #4caf50 !important;
        }
        
        .loading, .error {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 0;
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
export class UserSessionsComponent implements OnInit {
    sessionInfo: ActiveSessionsInfo | null = null;
    loading = false;
    error: string | null = null;

    constructor(
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadSessions();
    }

    loadSessions(): void {
        this.loading = true;
        this.error = null;
        
        this.authService.getActiveSessions().subscribe({
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

    logoutFromAllDevices(): void {
        if (!confirm('Bütün cihazlardan çıxmaq istədiyinizdən əminsiniz? Bu əməliyyat geri alına bilməz.')) {
            return;
        }

        this.loading = true;
        
        this.authService.logoutFromAllDevices().subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.snackBar.open('Bütün cihazlardan uğurla çıxıldı', 'Bağla', { duration: 3000 });
                    // AuthService уже перенаправит на страницу логина
                } else {
                    this.snackBar.open(response.message || 'Xəta baş verdi', 'Bağla', { duration: 5000 });
                }
            },
            error: (error) => {
                this.loading = false;
                this.snackBar.open('Serverlə əlaqə xətası', 'Bağla', { duration: 5000 });
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