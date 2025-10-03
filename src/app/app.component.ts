import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterModule,
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatToolbarModule,
        MatMenuModule,
        MatDividerModule,
        HttpClientModule
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [
        trigger('rotateAnimation', [
            state('default', style({ transform: 'rotate(0deg)' })),
            state('rotated', style({ transform: 'rotate(360deg)' })),
            transition('default <=> rotated', animate('300ms ease-in-out'))
        ])
    ]
})
export class AppComponent implements OnInit {
    title: string = 'İbtidai Siniflərin İnkişaf Metodikası';
    darkMode: boolean = false;
    animationState: string = 'default';
    userId: string | null = null;

    constructor(
        private matIconRegistry: MatIconRegistry, 
        private domSanitizer: DomSanitizer, 
        private authService: AuthService,
        private router: Router
    ) {
        this.matIconRegistry.addSvgIcon('dark_mode', this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/dark_mode.svg'));
        this.matIconRegistry.addSvgIcon('light_mode', this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/light_mode.svg'));
    }

    ngOnInit(): void {
        if (typeof localStorage !== 'undefined') {
            this.userId = this.authService.getUserId();
            this.darkMode = localStorage.getItem('theme') === 'true';
            this.setMode();
            
            // Проверяем и валидируем токен при старте приложения
            this.authService.validateToken().subscribe({
                next: (isValid) => {
                    if (isValid) {
                        console.log('User token validated successfully');
                    } else {
                        console.log('User token validation failed');
                    }
                },
                error: (error) => {
                    console.error('Token validation error:', error);
                }
            });
        }
    }

    isAuthorized(): boolean {
        return this.authService.getToken() !== null;
    }

    darkModeToogleChanged(): void {
        this.animationState = this.animationState === 'default' ? 'rotated' : 'default';
        this.darkMode = !this.darkMode;
        localStorage.setItem('theme', this.darkMode.toString());
        this.setMode();

    }

    setMode(): void {    
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            
        } else {
            document.body.classList.remove('dark-mode');
        }

        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            if (this.darkMode) {
                table.classList.add('dark-mode');
            } else {
                table.classList.remove('dark-mode');
            }
        });
    }

    goToProfile(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/profile']);
    }

    goToAdminPanel(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/admin']);
    }

    goToAdminDashboard(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/admin/dashboard']);
    }

    goToUsers(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/admin/users']);
    }

    goToRatingColumns(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/admin/rating-columns']);
    }

    goToStats(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/stats']);
    }

    goToDistricts(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/districts']);
    }

    goToSchools(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/schools']);
    }

    goToTeachers(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/teachers']);
    }

    goToStudents(): void {
        if (!this.isAuthorized()) {
            this.router.navigate(['/login']);
            return;
        }
        this.router.navigate(['/students']);
    }

    isAdminOrSuperAdmin(): boolean {
        return this.authService.isAdminOrSuperAdmin();
    }

    logInOut(): void {
        if (this.isAuthorized())
            this.authService.logout();
        else 
            this.router.navigate(['/login']);
    }
}
