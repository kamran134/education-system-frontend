import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AdminTokenStatsComponent } from '../../shared/components/admin-token-stats.component';
import { UserSessionsComponent } from '../../shared/components/user-sessions.component';
import { LucideAngularModule, Shield, BarChart, User, Settings, Info, ShieldCheck, Eye, Users, Server, CreditCard, Database, Clock, CheckCircle } from 'lucide-angular';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        ButtonComponent,
        AdminTokenStatsComponent,
        UserSessionsComponent
    ],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    selectedTabIndex = 0;

    // Icons
    readonly Shield = Shield;
    readonly BarChart = BarChart;
    readonly User = User;
    readonly Settings = Settings;
    readonly Info = Info;
    readonly ShieldCheck = ShieldCheck;
    readonly Eye = Eye;
    readonly Users = Users;
    readonly Server = Server;
    readonly CreditCard = CreditCard;
    readonly Database = Database;
    readonly Clock = Clock;
    readonly CheckCircle = CheckCircle;

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        // Компонент готов к использованию
    }

    selectTab(index: number): void {
        this.selectedTabIndex = index;
    }

    getTabClasses(index: number): string {
        const baseClasses = 'flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none cursor-pointer transition-colors';
        
        if (index === this.selectedTabIndex) {
            return `${baseClasses} border-blue-500 text-blue-600`;
        } else {
            return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
        }
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